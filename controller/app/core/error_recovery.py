from __future__ import annotations

import re
from collections.abc import Iterable

from app.schemas.error_recovery import ErrorRecoveryAdvice, RecoveryAction

_SECRETISH_PATTERNS = [
    re.compile(r'(hf_[A-Za-z0-9_\-]{12,})'),
    re.compile(r'(Bearer\s+)[A-Za-z0-9._\-]+', re.IGNORECASE),
    re.compile(r'(--api-key\s+)(\S+)', re.IGNORECASE),
    re.compile(r'(api[_-]?key["\'\s:=]+)([^\s,"\']+)', re.IGNORECASE),
]


def _redact(text: str) -> str:
    redacted = text
    for pattern in _SECRETISH_PATTERNS:
        if pattern.pattern.startswith('(hf_'):
            redacted = pattern.sub('<redacted-token>', redacted)
        else:
            redacted = pattern.sub(lambda match: f'{match.group(1)}<redacted>', redacted)
    return redacted


def _excerpt(text: str, limit: int = 900) -> str | None:
    clean_lines = [line.strip() for line in _redact(text).splitlines() if line.strip()]
    if not clean_lines:
        return None
    joined = '\n'.join(clean_lines[-12:])
    return joined[-limit:]


def _contains(text: str, *needles: str) -> bool:
    lowered = text.lower()
    return any(needle.lower() in lowered for needle in needles)


def _contains_all(text: str, *needles: str) -> bool:
    lowered = text.lower()
    return all(needle.lower() in lowered for needle in needles)


def _copy_action(label: str, description: str, copy_text: str) -> RecoveryAction:
    return RecoveryAction(label=label, description=description, kind='copy', copy_text=copy_text)


def build_error_recovery_advice(raw_text: str | None, *, context: str = 'runtime') -> ErrorRecoveryAdvice:
    """Classify common vLLM/download failures into plain-English recovery steps.

    The goal is UX, not perfect root-cause analysis. Prefer a safe, likely fix and
    keep the raw logs one click away for advanced users.
    """
    text = raw_text or ''
    raw_excerpt = _excerpt(text)

    if not text.strip():
        return ErrorRecoveryAdvice(
            category='no_error',
            severity='info',
            title='No error detected yet',
            summary='There is no captured failure text for this item yet.',
            likely_cause='The model may not have been started, logs may still be empty, or the issue already cleared.',
            immediate_fixes=['Recheck status.', 'Open logs if the instance recently changed state.', 'Try a quick test once the model is running.'],
            actions=[RecoveryAction(label='Recheck', description='Refresh the latest status.', kind='refresh')],
            raw_excerpt=None,
        )

    if _contains(text, 'cuda out of memory', 'torch.cuda.outofmemoryerror', 'out of memory', 'cublas_status_alloc_failed', 'cuda error: out of memory', 'insufficient memory'):
        return ErrorRecoveryAdvice(
            category='cuda_oom',
            severity='critical',
            title='Insufficient GPU memory',
            summary='vLLM tried to reserve more VRAM than the GPU could provide.',
            likely_cause='The selected model, context length, batch settings, or GPU memory utilization is too large for the available GPU memory.',
            immediate_fixes=[
                'Retry with the Low VRAM preset or Fast test preset.',
                'Lower max context length, for example 4096 or 8192.',
                'Lower GPU memory utilization to around 0.75-0.85.',
                'Unload other models before trying again.',
                'Use a smaller or more quantized variant only if safer settings still fail.',
            ],
            actions=[
                RecoveryAction(label='Use Low VRAM preset', description='Reduce context and scheduling pressure before retrying.', kind='change_preset'),
                _copy_action('Copy safe args', 'Paste into Advanced load settings if needed.', '--gpu-memory-utilization 0.80 --max-model-len 4096 --max-num-seqs 8'),
                RecoveryAction(label='Retry', description='Start the same model again after safer settings are applied.', kind='retry'),
                RecoveryAction(label='Open logs', description='Inspect the exact allocator failure.', kind='open_logs'),
            ],
            raw_excerpt=raw_excerpt,
        )

    if _contains(text, 'address already in use', 'errno 98', 'errno 48', 'port is already allocated', 'port already in use', 'bind: address already in use'):
        return ErrorRecoveryAdvice(
            category='port_in_use',
            severity='warning',
            title='Port already used',
            summary='Another process is already listening on the vLLM endpoint port.',
            likely_cause='A previous vLLM server, another app, or another Control Center instance is using the same host/port.',
            immediate_fixes=[
                'Retry; Control Center will try the next free port when possible.',
                'Pick a different port such as 8001 or 8010.',
                'Stop the other server using this port.',
                'Refresh instances to check whether an older model is still running.',
            ],
            actions=[
                RecoveryAction(label='Retry on another port', description='Start again and let Control Center move to a free port.', kind='retry'),
                _copy_action('Copy port check', 'Find the process using port 8000.', 'lsof -i :8000'),
                RecoveryAction(label='Open logs', description='Confirm the bind/address failure.', kind='open_logs'),
            ],
            raw_excerpt=raw_excerpt,
        )

    if _contains(text, 'vllm: command not found', 'no such file or directory: \'vllm\'', 'vllm cli not found', 'failed to start: vllm cli not found', 'no module named vllm', 'modulenotfounderror: no module named \'vllm\'', 'cannot import name'):
        return ErrorRecoveryAdvice(
            category='vllm_missing',
            severity='critical',
            title='vLLM is not installed or not in this environment',
            summary='The controller could not find a working `vllm` command/module in the environment that launched it.',
            likely_cause='The UI and backend may be using one Python environment while vLLM is installed in another, or vLLM was not installed yet.',
            immediate_fixes=[
                'Install vLLM in the same Python environment that runs the controller.',
                'Activate the correct conda/venv before starting the backend.',
                'Restart the controller after installing.',
                'Run Setup check again to confirm vLLM is detected.',
            ],
            actions=[
                _copy_action('Copy install command', 'Install vLLM into the active Python environment.', 'python -m pip install vllm'),
                RecoveryAction(label='Open Setup check', description='Recheck the environment after install.', kind='open_settings'),
                RecoveryAction(label='Open logs', description='Confirm which Python environment failed.', kind='open_logs'),
            ],
            raw_excerpt=raw_excerpt,
        )

    if _contains(text, '401 client error', '403 client error', 'gated repo', 'gated repository', 'repository not found', 'requires authentication', 'invalid username or password', 'access token'):
        return ErrorRecoveryAdvice(
            category='hf_auth',
            severity='warning',
            title='Hugging Face access is missing',
            summary='The model download or load needs Hugging Face authentication.',
            likely_cause='The model is private/gated, the token is missing, or the account has not accepted the model terms.',
            immediate_fixes=[
                'Set HF_TOKEN or HUGGING_FACE_HUB_TOKEN before starting the controller.',
                'Accept the model terms on Hugging Face if the model is gated.',
                'Try a public starter model to confirm the app is working.',
            ],
            actions=[
                _copy_action('Copy token example', 'Set this in your shell before starting the controller.', 'export HF_TOKEN=hf_your_token_here'),
                RecoveryAction(label='Retry download', description='Retry after token/model access is fixed.', kind='retry'),
            ],
            raw_excerpt=raw_excerpt,
        )

    if _contains(text, 'diffusion', 'diffusers', 'stable diffusion', 'unet', 'vae', 'controlnet', 'image-to-text', 'image classification', 'audio', 'whisper', 'wav2vec', 'clipmodel', 'vision model', 'image model') and _contains(text, 'not supported', 'unsupported', 'wrong model type', 'not a text-generation', 'architectures'):
        return ErrorRecoveryAdvice(
            category='wrong_model_type',
            severity='warning',
            title='Wrong model type for vLLM text serving',
            summary='This looks like an image, audio, diffusion, or other non-text-generation model.',
            likely_cause='The selected repo/folder is not a chat or text-generation Transformers model that vLLM can serve through an OpenAI-compatible API.',
            immediate_fixes=[
                'Pick a text-generation or chat model variant.',
                'Use the Hugging Face search filter for text-generation models.',
                'Open logs/details to confirm the detected architecture before deleting anything.',
            ],
            actions=[
                RecoveryAction(label='Pick another model', description='Return to the model picker and choose a text-generation model.', kind='open_settings'),
                RecoveryAction(label='Open logs', description='Inspect the detected model type.', kind='open_logs'),
            ],
            raw_excerpt=raw_excerpt,
        )

    if _contains(text, 'model architectures') and _contains(text, 'not supported', 'unsupported') or _contains(text, 'unsupported architecture', 'unsupported model architecture', 'unrecognized configuration class', 'is not supported for vllm'):
        return ErrorRecoveryAdvice(
            category='unsupported_architecture',
            severity='warning',
            title='Unsupported model architecture',
            summary='vLLM recognized the model config, but this architecture is not supported by the installed vLLM build.',
            likely_cause='The model may require a newer vLLM version, trust_remote_code, or a different serving backend. Large Qwen text models are not blocked by size alone.',
            immediate_fixes=[
                'Update vLLM and retry.',
                'Enable trust_remote_code only for models you trust if the model card requires it.',
                'Pick another text-generation model if this architecture is not supported yet.',
                'Open logs/details to confirm the exact architecture name.',
            ],
            actions=[
                _copy_action('Copy update command', 'Upgrade vLLM in the active Python environment.', 'python -m pip install -U vllm'),
                RecoveryAction(label='Pick another model', description='Choose a model with a vLLM-supported architecture.', kind='open_settings'),
                RecoveryAction(label='Open logs', description='Inspect the architecture error.', kind='open_logs'),
            ],
            raw_excerpt=raw_excerpt,
        )

    if _contains(text, 'tokenizer', 'tokenizer.json', 'tokenizer_config.json') and _contains(text, 'not found', 'no such file', 'missing', 'cannot find'):
        return ErrorRecoveryAdvice(
            category='missing_tokenizer',
            severity='warning',
            title='Tokenizer files are missing',
            summary='vLLM found model weights but could not find the tokenizer files it needs to serve text.',
            likely_cause='Only part of the Hugging Face repo was downloaded, or the selected folder points at a weight file instead of the full model snapshot.',
            immediate_fixes=[
                'Download the full model repository, not only the weight file.',
                'Choose the snapshot folder that contains tokenizer files.',
                'If this is GGUF-only, choose a vLLM-supported HF/Safetensors variant instead.',
            ],
            actions=[
                RecoveryAction(label='Pick another model', description='Choose a complete Hugging Face text-generation folder.', kind='open_settings'),
                RecoveryAction(label='Open logs', description='See which tokenizer file was missing.', kind='open_logs'),
            ],
            raw_excerpt=raw_excerpt,
        )

    if _contains(text, 'config.json') and _contains(text, 'not found', 'no such file', 'missing', 'cannot find') and not _contains(text, 'snapshots', 'models--', 'bad hugging face snapshot path', 'huggingface hub cache', 'hugging face cache'):
        return ErrorRecoveryAdvice(
            category='missing_config',
            severity='warning',
            title='Model config is missing',
            summary='vLLM could not find `config.json` for this model.',
            likely_cause='The selected path is incomplete, points at a single file, or is not a Hugging Face Transformers model folder.',
            immediate_fixes=[
                'Select the root snapshot folder that contains config.json.',
                'Download the full Hugging Face repo.',
                'Use a different variant that includes model config and tokenizer files.',
            ],
            actions=[
                RecoveryAction(label='Pick another model', description='Choose the full model folder instead of a partial path.', kind='open_settings'),
                RecoveryAction(label='Open logs', description='Confirm the missing config path.', kind='open_logs'),
            ],
            raw_excerpt=raw_excerpt,
        )

    if _contains(text, 'snapshots', 'models--', 'huggingface hub cache', 'hugging face cache', 'hf cache', 'blobs', 'refs') and _contains(text, 'config.json', 'bad hugging face snapshot path', 'choose a snapshot', 'not found', 'missing'):
        return ErrorRecoveryAdvice(
            category='bad_hf_snapshot_path',
            severity='warning',
            title='Bad Hugging Face snapshot path',
            summary='The selected folder looks like a cache parent, not the actual model snapshot folder.',
            likely_cause='Hugging Face cache folders often contain blobs/refs/snapshots. vLLM needs the specific snapshots/<revision> folder that contains config.json and tokenizer files.',
            immediate_fixes=[
                'Open the model details and choose the folder under snapshots/<revision>.',
                'Rescan local models so Control Center can register the exact snapshot folder.',
                'Download the full repo again if the snapshot is incomplete.',
            ],
            actions=[
                RecoveryAction(label='Recheck models', description='Refresh local model discovery.', kind='refresh'),
                RecoveryAction(label='Open logs', description='See the exact path that failed.', kind='open_logs'),
            ],
            raw_excerpt=raw_excerpt,
        )

    if _contains(text, 'no such file or directory', 'not a directory', 'does not exist', 'invalid model path'):
        return ErrorRecoveryAdvice(
            category='bad_model_path',
            severity='warning',
            title='The selected model path is not available',
            summary='The path saved in the app does not exist or is not readable from the controller.',
            likely_cause='The model folder was moved/deleted, or the controller is running in a different environment than the UI expects.',
            immediate_fixes=[
                'Rescan the model folder.',
                'Add the correct path from Models → Add scan path.',
                'Confirm the backend machine can read the path.',
            ],
            actions=[RecoveryAction(label='Recheck models', description='Refresh local model discovery.', kind='refresh')],
            raw_excerpt=raw_excerpt,
        )

    if _contains(text, 'gguf', 'awq', 'gptq', 'quantization') and _contains(text, 'unsupported', 'not supported', 'unknown quantization', 'not implemented'):
        return ErrorRecoveryAdvice(
            category='unsupported_quantization',
            severity='warning',
            title='This variant may not be supported by vLLM',
            summary='The selected quantization or file format does not look compatible with this vLLM setup.',
            likely_cause='The model may be an LM Studio/GGUF-style asset, or it needs a newer vLLM build / different load arguments.',
            immediate_fixes=[
                'Try a Safetensors FP16/BF16, AWQ, or GPTQ variant known to work with vLLM.',
                'Update vLLM if the model format is newly supported.',
                'Use the model detail compatibility notes before retrying.',
            ],
            actions=[RecoveryAction(label='Open model details', description='Check detected format and compatibility notes.', kind='open_settings')],
            raw_excerpt=raw_excerpt,
        )

    if _contains(text, 'connection reset', 'connection aborted', 'read timed out', 'connect timeout', 'temporary failure', 'name resolution', 'network is unreachable'):
        return ErrorRecoveryAdvice(
            category='network',
            severity='warning',
            title='Network connection failed',
            summary='The download or remote request failed before it could complete.',
            likely_cause='Network connectivity, DNS, proxy/firewall rules, or Hugging Face availability interrupted the request.',
            immediate_fixes=[
                'Retry the download or request.',
                'Check proxy/VPN/firewall settings on the controller machine.',
                'Try again with a smaller model to confirm connectivity.',
            ],
            actions=[RecoveryAction(label='Retry', description='Retry after checking connectivity.', kind='retry')],
            raw_excerpt=raw_excerpt,
        )

    if context == 'download' and _contains(text, 'cancelled'):
        return ErrorRecoveryAdvice(
            category='download_cancelled',
            severity='info',
            title='Download was cancelled',
            summary='The download job was stopped before completion.',
            likely_cause='The user cancelled it, or the app reconciled an interrupted job.',
            immediate_fixes=['Retry the download when ready.', 'Remove the job if it is no longer needed.'],
            actions=[RecoveryAction(label='Retry download', description='Queue the same download again.', kind='retry')],
            raw_excerpt=raw_excerpt,
        )

    return ErrorRecoveryAdvice(
        category='unknown_vllm_crash',
        severity='warning',
        title='Unknown vLLM crash',
        summary='Control Center could not match this failure to a known recovery path yet.',
        likely_cause='The error may be model-specific, environment-specific, or from a newer vLLM message pattern.',
        immediate_fixes=[
            'Open logs and look for the first Python traceback or vLLM error.',
            'Try Fast test or Low VRAM preset.',
            'Confirm the model folder contains config, tokenizer, and weights.',
            'Retry with a known-good starter model to isolate environment vs model issues.',
        ],
        actions=[
            RecoveryAction(label='Open logs', description='Inspect the raw vLLM output.', kind='open_logs'),
            RecoveryAction(label='Use Low VRAM preset', description='Retry with safer memory settings.', kind='change_preset'),
            RecoveryAction(label='Pick another model', description='Try a known text-generation model to compare.', kind='open_settings'),
        ],
        raw_excerpt=raw_excerpt,
    )


def concise_error_label(raw_text: str | None, fallback: str = 'unknown error') -> str:
    advice = build_error_recovery_advice(raw_text, context='runtime')
    if advice.category == 'no_error':
        return fallback
    return advice.title


def join_error_sources(values: Iterable[str | None]) -> str:
    return '\n'.join(value for value in values if value and value.strip())
