from __future__ import annotations

import asyncio
import json
import os
import platform
import shutil
import signal
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import error as urlerror
from urllib import request as urlrequest
from uuid import uuid4

from app.core.command_builder import build_subprocess_argv, redact_argv
from app.core.log_store import append_log
from app.core.ports import next_available_port
from app.core.process_manager import ManagedProcess, process_manager, probe_openai_endpoint
from app.db import dumps_json, execute, fetchall, fetchone, loads_json
from app.schemas.instances import VllmServeConfig

RECIPE_ID = "dgx-spark-qwen36-35b-a3b-nvfp4-fast"
MODEL_ID = "unsloth/Qwen3.6-35B-A3B-NVFP4-Fast"
INSTANCE_PREFIX = "Recipe: Qwen3.6 35B NVFP4"
STARTUP_TIMEOUT_SECONDS = 600
WARMUP_REQUESTS = 3
EXPECTED_SAFETENSORS_SHARDS = 5
RECIPE_ENVIRONMENT = {
    "CUTE_DSL_ARCH": "sm_121a",
    "VLLM_USE_DEEP_GEMM": "0",
    "TORCHINDUCTOR_COMPILE_THREADS": "2",
    "MAX_JOBS": "4",
}
RECIPE_EXTRA_ARGS = [
    "--moe-backend",
    "flashinfer_b12x",
    "--max-num-seqs",
    "4",
    "--max-num-batched-tokens",
    "8192",
    "--speculative-config",
    json.dumps({"method": "mtp", "num_speculative_tokens": 3}, separators=(",", ":")),
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass(frozen=True)
class RecipeInspection:
    ready: bool
    blockers: list[str]
    warnings: list[str]
    details: dict[str, Any]


def model_matches_recipe(model: str) -> bool:
    normalized = model.strip().lower().replace("_", "-")
    return normalized == MODEL_ID.lower() or "qwen3.6-35b-a3b-nvfp4-fast" in normalized


def _local_checkpoint_issues(model: str) -> tuple[list[str], dict[str, Any]]:
    path = Path(model).expanduser()
    details: dict[str, Any] = {"local": False}
    if not path.exists():
        return [], details
    details["local"] = True
    details["path"] = str(path)
    if not path.is_dir():
        return ["Select the full checkpoint folder, not one weight file."], details
    incomplete = sorted(item.name for item in path.rglob("*.incomplete"))
    shards = sorted(item.name for item in path.glob("*.safetensors"))
    details["safetensors_shards"] = len(shards)
    details["incomplete_files"] = incomplete
    issues: list[str] = []
    if incomplete:
        issues.append("The checkpoint still has .incomplete files. Finish the download before loading.")
    if model_matches_recipe(model) and len(shards) < EXPECTED_SAFETENSORS_SHARDS:
        issues.append(
            f"Expected at least {EXPECTED_SAFETENSORS_SHARDS} safetensors shards for this recipe; found {len(shards)}."
        )
    for required in ("config.json", "tokenizer_config.json"):
        if not (path / required).exists():
            issues.append(f"Checkpoint is missing {required}.")
    return issues, details


async def _command_output(*argv: str, timeout: float = 15.0) -> str | None:
    try:
        proc = await asyncio.create_subprocess_exec(
            *argv,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        output, _ = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        return output.decode(errors="replace").strip()
    except (FileNotFoundError, OSError, TimeoutError):
        return None


async def inspect_recipe(model: str) -> RecipeInspection:
    blockers, checkpoint = _local_checkpoint_issues(model)
    warnings: list[str] = []
    vllm_path = shutil.which("vllm")
    if not vllm_path:
        blockers.append("vLLM CLI was not found in the controller environment.")
    version_text = await _command_output(vllm_path, "--version") if vllm_path else None
    if version_text and "0.25." not in version_text:
        warnings.append(
            f"This checkpoint requires vLLM 0.25.x; detected {version_text}. The app will try it without silently changing your runtime."
        )
    machine = platform.machine().lower()
    if machine not in {"aarch64", "arm64"}:
        warnings.append(f"The recipe targets DGX Spark ARM64; detected {machine or 'unknown architecture'}.")
    gpu_text = await _command_output(
        "nvidia-smi", "--query-gpu=name,driver_version", "--format=csv,noheader", timeout=8.0
    )
    if gpu_text and "GB10" not in gpu_text.upper() and "DGX SPARK" not in gpu_text.upper():
        warnings.append(f"The recipe targets NVIDIA GB10 / DGX Spark; detected {gpu_text.splitlines()[0]}.")
    return RecipeInspection(
        ready=not blockers,
        blockers=blockers,
        warnings=warnings,
        details={
            "recipe_id": RECIPE_ID,
            "model": model,
            "verified_vllm": "vLLM 0.25.x target (hardware validation pending)",
            "detected_vllm": version_text,
            "architecture": machine,
            "gpu": gpu_text,
            "checkpoint": checkpoint,
        },
    )


def build_recipe_config(model: str, port: int = 8000) -> VllmServeConfig:
    return VllmServeConfig(
        model=model,
        host="0.0.0.0",
        port=port,
        served_model_name=MODEL_ID,
        dtype="auto",
        max_model_len=262144,
        gpu_memory_utilization=0.85,
        kv_cache_memory_bytes="4294967296",
        extra_args=list(RECIPE_EXTRA_ARGS),
    )


def recipe_summary() -> dict[str, Any]:
    return {
        "id": RECIPE_ID,
        "name": "Qwen3.6 35B-A3B NVFP4 Fast — DGX Spark",
        "model_id": MODEL_ID,
        "verified_runtime": "vLLM 0.25.x target + CUDA 13 compatible PyTorch (hardware validation pending)",
        "startup_timeout_seconds": STARTUP_TIMEOUT_SECONDS,
        "warmup_requests": WARMUP_REQUESTS,
        "environment": RECIPE_ENVIRONMENT,
        "serve": {
            "moe_backend": "flashinfer_b12x",
            "max_model_len": 262144,
            "kv_cache_memory_bytes": 4294967296,
            "gpu_memory_utilization": 0.85,
            "max_num_seqs": 4,
            "max_num_batched_tokens": 8192,
            "speculative_config": {"method": "mtp", "num_speculative_tokens": 3},
        },
        "note": "Known-good settings are applied as one unit. Advanced mode remains available for manual tuning.",
    }


async def _existing_recipe_row() -> dict[str, Any] | None:
    rows = await fetchall("SELECT * FROM instances ORDER BY updated_at DESC")
    for row in rows:
        try:
            config = VllmServeConfig(**loads_json(row["config_json"]))
        except Exception:
            continue
        if row["name"].startswith(INSTANCE_PREFIX) or model_matches_recipe(config.model):
            return row
    return None


async def _create_or_reuse_instance(model: str, port: int) -> tuple[str, VllmServeConfig]:
    config = build_recipe_config(model, port)
    existing = await _existing_recipe_row()
    ts = now_iso()
    if existing and existing["status"] not in {"running", "starting", "stopping"}:
        await execute(
            "UPDATE instances SET name = ?, status = ?, host = ?, port = ?, config_json = ?, pid = NULL, "
            "command_json = NULL, last_error = NULL, updated_at = ? WHERE id = ?",
            (
                INSTANCE_PREFIX,
                "stopped",
                config.host,
                config.port,
                dumps_json(config.model_dump()),
                ts,
                existing["id"],
            ),
        )
        return existing["id"], config
    if existing:
        return existing["id"], VllmServeConfig(**loads_json(existing["config_json"]))
    instance_id = str(uuid4())
    await execute(
        "INSERT INTO instances(id, name, status, host, port, config_json, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (
            instance_id,
            INSTANCE_PREFIX,
            "stopped",
            config.host,
            config.port,
            dumps_json(config.model_dump()),
            ts,
            ts,
        ),
    )
    return instance_id, config


def _warmup_request(config: VllmServeConfig) -> None:
    host = "127.0.0.1" if config.host in {"0.0.0.0", "::", ""} else config.host
    body = json.dumps(
        {
            "model": config.served_model_name or MODEL_ID,
            "messages": [{"role": "user", "content": "Reply with the word ready."}],
            "max_tokens": 32,
            "temperature": 0,
            "chat_template_kwargs": {"enable_thinking": False},
        }
    ).encode()
    req = urlrequest.Request(
        f"http://{host}:{config.port}/v1/chat/completions",
        data=body,
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urlrequest.urlopen(req, timeout=120) as response:  # noqa: S310 - local endpoint only.
        response.read(256)


async def _watch_recipe_readiness(
    instance_id: str,
    proc: asyncio.subprocess.Process,
    config: VllmServeConfig,
) -> None:
    deadline = asyncio.get_running_loop().time() + STARTUP_TIMEOUT_SECONDS
    last_error: str | None = None
    while proc.returncode is None:
        ok, error = await probe_openai_endpoint(config)
        if ok:
            await append_log(instance_id, "system", "Endpoint is live. Running three automatic warm-up requests.")
            for index in range(WARMUP_REQUESTS):
                if proc.returncode is not None:
                    return
                try:
                    await asyncio.to_thread(_warmup_request, config)
                    await append_log(instance_id, "system", f"Warm-up {index + 1}/{WARMUP_REQUESTS} complete.")
                except (OSError, TimeoutError, urlerror.URLError, urlerror.HTTPError) as exc:
                    await append_log(instance_id, "system", f"Warm-up {index + 1} did not complete: {exc}")
                    break
            row = await fetchone("SELECT status FROM instances WHERE id = ?", (instance_id,))
            if row and row["status"] == "starting":
                await execute(
                    "UPDATE instances SET status = ?, last_error = NULL, updated_at = ? WHERE id = ?",
                    ("running", now_iso(), instance_id),
                )
                await append_log(instance_id, "system", "Model is ready. Test it or copy the OpenAI /v1 URL.")
            return
        last_error = error
        if asyncio.get_running_loop().time() >= deadline:
            raw = (
                f"Recipe startup timed out after {STARTUP_TIMEOUT_SECONDS}s while waiting for /v1/models."
                + (f" Last probe: {last_error}" if last_error else "")
            )
            await append_log(instance_id, "system", raw)
            await eject_recipe_instance(instance_id, delete_record=False)
            await execute(
                "UPDATE instances SET status = ?, last_error = ?, updated_at = ? WHERE id = ?",
                ("crashed", raw, now_iso(), instance_id),
            )
            return
        await asyncio.sleep(2.0)


async def load_recipe_model(model: str, port: int = 8000) -> tuple[dict[str, Any], RecipeInspection]:
    inspection = await inspect_recipe(model)
    if not inspection.ready:
        raise RuntimeError(" ".join(inspection.blockers))
    existing = await _existing_recipe_row()
    if existing and existing["status"] in {"running", "starting"}:
        return existing, inspection
    instance_id, config = await _create_or_reuse_instance(model, port)
    requested_port = config.port
    available_port = next_available_port(config.host, requested_port)
    if available_port is None:
        raise RuntimeError(f"No free port was found near {requested_port}.")
    if available_port != requested_port:
        config.port = available_port
        await execute(
            "UPDATE instances SET host = ?, port = ?, config_json = ?, updated_at = ? WHERE id = ?",
            (config.host, config.port, dumps_json(config.model_dump()), now_iso(), instance_id),
        )
    argv = build_subprocess_argv(config)
    await execute(
        "UPDATE instances SET status = ?, command_json = ?, last_error = NULL, updated_at = ? WHERE id = ?",
        ("starting", dumps_json(redact_argv(argv)), now_iso(), instance_id),
    )
    await append_log(instance_id, "system", f"Applying runtime recipe {RECIPE_ID}.")
    for warning in inspection.warnings:
        await append_log(instance_id, "system", f"Recipe warning: {warning}")
    await append_log(instance_id, "system", f"Starting: {' '.join(redact_argv(argv))}")
    env = os.environ.copy()
    env.update(RECIPE_ENVIRONMENT)
    try:
        proc = await asyncio.create_subprocess_exec(
            *argv,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env,
            start_new_session=True,
        )
    except (FileNotFoundError, OSError) as exc:
        raw = f"Failed to start recipe runtime: {exc}"
        await process_manager._mark_crashed(instance_id, raw)
        raise RuntimeError(raw) from exc
    process_manager._processes[instance_id] = ManagedProcess(instance_id=instance_id, proc=proc, argv=argv)
    await execute(
        "UPDATE instances SET status = ?, pid = ?, started_at = ?, updated_at = ? WHERE id = ?",
        ("starting", proc.pid, now_iso(), now_iso(), instance_id),
    )
    await append_log(
        instance_id,
        "system",
        "vLLM started in its own process group. Loading and compiling can take several minutes on DGX Spark.",
    )
    asyncio.create_task(process_manager._pipe_logs(instance_id, proc.stdout, "stdout"))
    asyncio.create_task(process_manager._pipe_logs(instance_id, proc.stderr, "stderr"))
    asyncio.create_task(process_manager._watch_exit(instance_id, proc))
    asyncio.create_task(_watch_recipe_readiness(instance_id, proc, config))
    row = await fetchone("SELECT * FROM instances WHERE id = ?", (instance_id,))
    assert row is not None
    return row, inspection


async def eject_recipe_instance(instance_id: str, *, delete_record: bool = True) -> None:
    row = await fetchone("SELECT * FROM instances WHERE id = ?", (instance_id,))
    if not row:
        return
    managed = process_manager._processes.get(instance_id)
    if managed and managed.proc.returncode is None:
        await execute(
            "UPDATE instances SET status = ?, updated_at = ? WHERE id = ?",
            ("stopping", now_iso(), instance_id),
        )
        await append_log(instance_id, "system", "Eject requested. Stopping the full recipe process group.")
        try:
            os.killpg(managed.proc.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        try:
            await asyncio.wait_for(managed.proc.wait(), timeout=15)
        except TimeoutError:
            try:
                os.killpg(managed.proc.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            await managed.proc.wait()
        process_manager._processes.pop(instance_id, None)
    await execute(
        "UPDATE instances SET status = ?, pid = NULL, stopped_at = ?, updated_at = ? WHERE id = ?",
        ("stopped", now_iso(), now_iso(), instance_id),
    )
    if delete_record:
        await execute("DELETE FROM logs WHERE instance_id = ?", (instance_id,))
        await execute("DELETE FROM metrics_snapshots WHERE instance_id = ?", (instance_id,))
        await execute("DELETE FROM instances WHERE id = ?", (instance_id,))


async def recipe_status() -> dict[str, Any] | None:
    return await _existing_recipe_row()
