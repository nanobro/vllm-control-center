from __future__ import annotations

import asyncio
import json
import os
import signal
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import error as urlerror
from urllib import request as urlrequest

from app.core.command_builder import build_subprocess_argv, redact_argv
from app.core.error_recovery import concise_error_label
from app.core.log_store import append_log, tail_logs
from app.core.ports import next_available_port
from app.db import dumps_json, execute, fetchone, loads_json
from app.schemas.instances import VllmServeConfig

TEXT_MODEL_TYPES = {
    'baichuan',
    'bloom',
    'chatglm',
    'cohere',
    'deepseek_v2',
    'deepseek_v3',
    'falcon',
    'gemma',
    'gemma2',
    'glm',
    'gpt2',
    'gpt_bigcode',
    'gpt_neox',
    'gptj',
    'granite',
    'internlm',
    'llama',
    'mistral',
    'mixtral',
    'mpt',
    'nemotron',
    'phi',
    'phi3',
    'qwen',
    'qwen2',
    'qwen2_moe',
    'qwen3',
    'qwen3_moe',
    'stablelm',
    'starcoder2',
    'yi',
}

NON_TEXT_HINTS = {
    'audio',
    'clip',
    'controlnet',
    'diffusers',
    'diffusion',
    'image',
    'sam',
    'stable-diffusion',
    'unet',
    'vae',
    'vision',
    'wav2vec',
    'whisper',
}

TOKENIZER_FILES = {'tokenizer.json', 'tokenizer_config.json', 'tokenizer.model', 'vocab.json', 'merges.txt'}
WEIGHT_SUFFIXES = {'.safetensors', '.bin', '.pt', '.pth', '.gguf'}
READINESS_TIMEOUT_SECONDS = int(os.environ.get('VCC_VLLM_READINESS_TIMEOUT_SECONDS', '180'))
READINESS_POLL_SECONDS = float(os.environ.get('VCC_VLLM_READINESS_POLL_SECONDS', '1.5'))


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class ManagedProcess:
    instance_id: str
    proc: asyncio.subprocess.Process
    argv: list[str]


def _looks_like_local_reference(model: str) -> bool:
    value = model.strip()
    if not value:
        return False
    expanded = Path(value).expanduser()
    return (
        value.startswith(('/', './', '../', '~'))
        or '\\' in value
        or expanded.exists()
        or value.startswith('models--')
    )


def _read_config_json(path: Path) -> dict[str, Any] | None:
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError):
        return None


def _has_any(path: Path, names: set[str]) -> bool:
    return any((path / name).exists() for name in names)


def _has_weight_file(path: Path) -> bool:
    try:
        return any(child.is_file() and child.suffix.lower() in WEIGHT_SUFFIXES for child in path.iterdir())
    except OSError:
        return False


def _is_hf_cache_parent(path: Path) -> bool:
    return (path / 'snapshots').exists() or (path / 'blobs').exists() or (path / 'refs').exists() or path.name.startswith('models--')


def _non_text_reason(config: dict[str, Any]) -> str | None:
    model_type = str(config.get('model_type') or '').lower()
    architectures = [str(item).lower() for item in config.get('architectures') or []]
    candidates = ' '.join([model_type, *architectures])
    if any(hint in candidates for hint in NON_TEXT_HINTS):
        return f'Wrong model type: image/audio/diffusion model detected ({model_type or architectures[0]}).'
    if model_type and model_type not in TEXT_MODEL_TYPES and not model_type.startswith(('qwen', 'llama', 'mistral', 'gemma', 'deepseek')):
        # Let vLLM make the final call for unknown text architectures; only flag
        # obvious non-text models above. This keeps new Qwen-style LLMs runnable.
        return None
    return None


def diagnose_model_reference_before_start(config: VllmServeConfig) -> str | None:
    """Return a plain failure reason for obvious local model path problems.

    Remote Hugging Face IDs are intentionally not blocked here. In particular,
    large Qwen/Qwen3.x text-generation models must remain runnable; size alone is
    not a compatibility signal.
    """
    model = config.model.strip()
    if not _looks_like_local_reference(model):
        return None

    path = Path(model).expanduser()
    if not path.exists():
        return f'The selected model path is not available: {model}'
    if path.is_file():
        if path.suffix.lower() == '.gguf':
            return None
        return f'Model config is missing: select the full model folder, not a single file ({path.name}).'
    if not path.is_dir():
        return f'The selected model path is not available: {model}'

    config_path = path / 'config.json'
    if not config_path.exists():
        if _is_hf_cache_parent(path):
            return 'Bad Hugging Face snapshot path: choose the snapshots/<revision> folder that contains config.json and tokenizer files.'
        if _has_weight_file(path):
            return 'Model config is missing: config.json was not found beside the model weights.'
        return 'The selected model path is not available or is not a complete Hugging Face model folder.'

    model_config = _read_config_json(config_path)
    if model_config is None:
        return 'Model config is missing: config.json could not be read.'

    non_text_reason = _non_text_reason(model_config)
    if non_text_reason:
        return non_text_reason

    if not _has_any(path, TOKENIZER_FILES):
        return 'Tokenizer files are missing: tokenizer.json, tokenizer_config.json, tokenizer.model, vocab.json, or merges.txt was not found.'

    return None


def _probe_host(host: str) -> str:
    if host in {'0.0.0.0', '::', ''}:
        return '127.0.0.1'
    return host


def readiness_urls(config: VllmServeConfig) -> list[str]:
    """Return local URLs used to prove the OpenAI-compatible endpoint is live."""
    base = f'http://{_probe_host(config.host)}:{config.port}'
    return [f'{base}/v1/models', f'{base}/health']


def _probe_url(url: str, api_key: str | None) -> tuple[bool, str | None]:
    headers = {'accept': 'application/json'}
    if api_key:
        headers['authorization'] = f'Bearer {api_key}'
    req = urlrequest.Request(url, headers=headers)
    try:
        with urlrequest.urlopen(req, timeout=1.5) as response:  # noqa: S310 - local controller probe only.
            if 200 <= response.status < 300:
                return True, None
            return False, f'{url} returned HTTP {response.status}'
    except urlerror.HTTPError as exc:
        # A 401 means the process is alive but the configured server key did not
        # authorize this check. Treat the server as reachable; the actual test
        # request will surface auth mistakes in the user path.
        if exc.code == 401:
            return True, None
        return False, f'{url} returned HTTP {exc.code}'
    except (OSError, TimeoutError, urlerror.URLError) as exc:
        return False, str(exc)


async def probe_openai_endpoint(config: VllmServeConfig) -> tuple[bool, str | None]:
    """Probe vLLM readiness without pulling in extra async HTTP dependencies."""
    last_error: str | None = None
    for url in readiness_urls(config):
        ok, error = await asyncio.to_thread(_probe_url, url, config.api_key)
        if ok:
            return True, None
        last_error = error
    return False, last_error


class ProcessManager:
    def __init__(self) -> None:
        self._processes: dict[str, ManagedProcess] = {}

    async def _mark_crashed(self, instance_id: str, raw_error: str) -> None:
        label = concise_error_label(raw_error, fallback=raw_error)
        await execute(
            'UPDATE instances SET status = ?, last_error = ?, updated_at = ? WHERE id = ?',
            ('crashed', label, now_iso(), instance_id),
        )
        await append_log(instance_id, 'system', raw_error)

    async def start(self, instance_id: str) -> None:
        row = await fetchone('SELECT * FROM instances WHERE id = ?', (instance_id,))
        if not row:
            raise ValueError('instance not found')
        if instance_id in self._processes and self._processes[instance_id].proc.returncode is None:
            raise ValueError('instance already running')

        config = VllmServeConfig(**loads_json(row['config_json']))

        preflight_error = diagnose_model_reference_before_start(config)
        if preflight_error:
            await self._mark_crashed(instance_id, preflight_error)
            raise RuntimeError(preflight_error)

        requested_port = config.port
        available_port = next_available_port(config.host, requested_port)
        if available_port is None:
            port_error = f'Port already used: no free port found near {requested_port}.'
            await self._mark_crashed(instance_id, port_error)
            raise RuntimeError(port_error)
        if available_port != requested_port:
            config.port = available_port
            await execute(
                'UPDATE instances SET host = ?, port = ?, config_json = ?, updated_at = ? WHERE id = ?',
                (config.host, config.port, dumps_json(config.model_dump()), now_iso(), instance_id),
            )
            await append_log(instance_id, 'system', f'Port {requested_port} was already in use; using {available_port} instead.')

        argv = build_subprocess_argv(config)
        await execute(
            'UPDATE instances SET status = ?, command_json = ?, last_error = NULL, updated_at = ? WHERE id = ?',
            ('starting', dumps_json(redact_argv(argv)), now_iso(), instance_id),
        )
        await append_log(instance_id, 'system', f"Starting: {' '.join(redact_argv(argv))}")

        try:
            proc = await asyncio.create_subprocess_exec(
                *argv,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
        except FileNotFoundError as exc:
            raw_error = f'Failed to start: vLLM CLI not found ({exc})'
            await self._mark_crashed(instance_id, raw_error)
            raise
        except OSError as exc:
            raw_error = f'Failed to start vLLM process: {exc}'
            await self._mark_crashed(instance_id, raw_error)
            raise RuntimeError(raw_error) from exc

        self._processes[instance_id] = ManagedProcess(instance_id=instance_id, proc=proc, argv=argv)
        await execute(
            'UPDATE instances SET status = ?, pid = ?, started_at = ?, updated_at = ? WHERE id = ?',
            ('starting', proc.pid, now_iso(), now_iso(), instance_id),
        )
        await append_log(instance_id, 'system', 'vLLM process started; waiting for OpenAI-compatible endpoint readiness (/v1/models).')
        asyncio.create_task(self._pipe_logs(instance_id, proc.stdout, 'stdout'))
        asyncio.create_task(self._pipe_logs(instance_id, proc.stderr, 'stderr'))
        asyncio.create_task(self._watch_exit(instance_id, proc))
        asyncio.create_task(self._watch_readiness(instance_id, proc, config))

    async def stop(self, instance_id: str) -> None:
        managed = self._processes.get(instance_id)
        if not managed or managed.proc.returncode is not None:
            await execute(
                'UPDATE instances SET status = ?, stopped_at = ?, updated_at = ? WHERE id = ?',
                ('stopped', now_iso(), now_iso(), instance_id),
            )
            return

        await execute('UPDATE instances SET status = ?, updated_at = ? WHERE id = ?', ('stopping', now_iso(), instance_id))
        await append_log(instance_id, 'system', 'Stopping process')
        managed.proc.send_signal(signal.SIGTERM)
        try:
            await asyncio.wait_for(managed.proc.wait(), timeout=10)
        except TimeoutError:
            await append_log(instance_id, 'system', 'SIGTERM timed out; killing process')
            managed.proc.kill()
            await managed.proc.wait()

        await execute(
            'UPDATE instances SET status = ?, stopped_at = ?, updated_at = ? WHERE id = ?',
            ('stopped', now_iso(), now_iso(), instance_id),
        )
        self._processes.pop(instance_id, None)

    async def restart(self, instance_id: str) -> None:
        await self.stop(instance_id)
        await self.start(instance_id)

    async def _pipe_logs(self, instance_id: str, stream: asyncio.StreamReader | None, name: str) -> None:
        if stream is None:
            return
        while True:
            line = await stream.readline()
            if not line:
                break
            await append_log(instance_id, name, line.decode(errors='replace'))

    async def _watch_exit(self, instance_id: str, proc: asyncio.subprocess.Process) -> None:
        code = await proc.wait()
        row = await fetchone('SELECT status FROM instances WHERE id = ?', (instance_id,))
        current_status = row['status'] if row else None
        if current_status == 'stopping':
            final_status = 'stopped'
        elif code == 0:
            final_status = 'stopped'
        else:
            final_status = 'crashed'
        await append_log(instance_id, 'system', f'Process exited with code {code}')
        last_error = None
        if code != 0:
            recent = await tail_logs(instance_id, tail=80)
            recent_text = '\n'.join(line.line for line in recent if line.stream in {'stderr', 'system'})
            last_error = concise_error_label(recent_text, fallback=f'exit code {code}')
        await execute(
            'UPDATE instances SET status = ?, stopped_at = ?, last_error = ?, updated_at = ? WHERE id = ?',
            (final_status, now_iso(), last_error, now_iso(), instance_id),
        )
        self._processes.pop(instance_id, None)

    async def _watch_readiness(self, instance_id: str, proc: asyncio.subprocess.Process, config: VllmServeConfig) -> None:
        deadline = asyncio.get_running_loop().time() + READINESS_TIMEOUT_SECONDS
        last_error: str | None = None
        while proc.returncode is None:
            ok, error = await probe_openai_endpoint(config)
            if ok:
                row = await fetchone('SELECT status FROM instances WHERE id = ?', (instance_id,))
                if row and row['status'] == 'starting':
                    await execute(
                        'UPDATE instances SET status = ?, last_error = NULL, updated_at = ? WHERE id = ?',
                        ('running', now_iso(), instance_id),
                    )
                    await append_log(instance_id, 'system', 'OpenAI-compatible endpoint is ready. /v1/models responded.')
                return
            last_error = error
            if asyncio.get_running_loop().time() >= deadline:
                await append_log(
                    instance_id,
                    'system',
                    f'Still waiting for /v1/models after {READINESS_TIMEOUT_SECONDS}s. The model may still be loading; open logs for progress.' + (f' Last probe: {last_error}' if last_error else ''),
                )
                return
            await asyncio.sleep(READINESS_POLL_SECONDS)


process_manager = ProcessManager()
