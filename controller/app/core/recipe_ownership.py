from __future__ import annotations

import asyncio
import json
import os
import signal
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import error as urlerror
from urllib import request as urlrequest

from app.core.log_store import append_log
from app.core.process_manager import process_manager
from app.db import execute, loads_json

MODEL_ID = "unsloth/Qwen3.6-35B-A3B-NVFP4"
INSTANCE_PREFIX = "Recipe: Qwen3.6 35B NVFP4"
PROCESS_START_TOLERANCE_SECONDS = 30.0


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _model_matches(value: str) -> bool:
    normalized = value.strip().lower().replace("_", "-")
    canonical = MODEL_ID.lower()
    name = canonical.rsplit("/", 1)[-1]
    return normalized == canonical or normalized.endswith(f"/{canonical}") or normalized.endswith(name)


def _parse_utc(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _process_start_time(pid: int) -> datetime | None:
    try:
        stat_text = Path(f"/proc/{pid}/stat").read_text(encoding="utf-8")
        close_paren = stat_text.rfind(")")
        if close_paren < 0:
            return None
        fields = stat_text[close_paren + 2 :].split()
        start_ticks = int(fields[19])
        boot_line = next(
            line for line in Path("/proc/stat").read_text(encoding="utf-8").splitlines() if line.startswith("btime ")
        )
        boot_seconds = int(boot_line.split()[1])
        ticks_per_second = int(os.sysconf("SC_CLK_TCK"))
    except (OSError, ValueError, IndexError, StopIteration):
        return None
    return datetime.fromtimestamp(boot_seconds + (start_ticks / ticks_per_second), tz=timezone.utc)


def _live_cmdline(pid: int) -> str | None:
    try:
        return Path(f"/proc/{pid}/cmdline").read_bytes().decode(errors="replace").replace("\x00", " ").strip()
    except OSError:
        return None


def _endpoint_models(port: int) -> list[str] | None:
    try:
        with urlrequest.urlopen(f"http://127.0.0.1:{port}/v1/models", timeout=3) as response:  # noqa: S310
            payload = json.loads(response.read().decode())
    except (OSError, TimeoutError, urlerror.URLError, urlerror.HTTPError, json.JSONDecodeError):
        return None
    return [str(item.get("id")) for item in payload.get("data", []) if isinstance(item, dict)]


async def prove_persisted_recipe_ownership(row: dict[str, Any] | None) -> dict[str, Any]:
    """Revalidate a recipe process using only durable DB evidence plus live OS/API evidence.

    This is intentionally fail-closed. A persisted instance row is necessary but
    never sufficient: PID reuse, a changed command, a changed process group, or a
    mismatched OpenAI model identity all invalidate ownership.
    """
    proof: dict[str, Any] = {"owned": False, "reason": "ownership evidence is incomplete"}
    if not row or not str(row.get("name") or "").startswith(INSTANCE_PREFIX):
        proof["reason"] = "instance is not a Control Center recipe record"
        return proof

    pid = row.get("pid")
    if not isinstance(pid, int) or pid <= 1:
        proof["reason"] = "persisted PID is missing"
        return proof

    try:
        config = loads_json(str(row.get("config_json") or "{}"))
        model = str(config.get("model") or "")
        port = int(config.get("port") or row.get("port") or 0)
        command = loads_json(str(row.get("command_json") or "[]"))
    except (ValueError, TypeError, json.JSONDecodeError):
        proof["reason"] = "persisted recipe metadata is invalid"
        return proof

    if not _model_matches(model) or port <= 0:
        proof["reason"] = "persisted model or port does not match the canonical recipe"
        return proof
    if not isinstance(command, list):
        proof["reason"] = "persisted launch command is missing"
        return proof
    persisted_command = " ".join(str(item) for item in command)
    if "vllm" not in persisted_command.lower() or MODEL_ID.lower() not in persisted_command.lower():
        proof["reason"] = "persisted launch command does not identify the canonical runtime"
        return proof

    started_at = _parse_utc(row.get("started_at"))
    process_started = await asyncio.to_thread(_process_start_time, pid)
    if not started_at or not process_started:
        proof["reason"] = "process birth time cannot be revalidated"
        return proof
    start_delta = abs((process_started - started_at).total_seconds())
    if start_delta > PROCESS_START_TOLERANCE_SECONDS:
        proof["reason"] = "PID birth time does not match the persisted launch"
        proof["start_delta_seconds"] = round(start_delta, 3)
        return proof

    live_command = await asyncio.to_thread(_live_cmdline, pid)
    if not live_command or "vllm" not in live_command.lower() or MODEL_ID.lower() not in live_command.lower():
        proof["reason"] = "live process command does not match the canonical runtime"
        return proof
    if f"--port {port}" not in live_command:
        proof["reason"] = "live process port does not match the persisted recipe"
        return proof

    try:
        pgid = os.getpgid(pid)
    except OSError:
        proof["reason"] = "persisted process is no longer running"
        return proof
    if pgid != pid:
        proof["reason"] = "live process is not the process-group leader created by the recipe"
        return proof

    models = await asyncio.to_thread(_endpoint_models, port)
    if not models or not any(_model_matches(item) for item in models):
        proof["reason"] = "OpenAI endpoint does not report the canonical model"
        return proof

    return {
        "owned": True,
        "reason": "persisted launch evidence revalidated",
        "pid": pid,
        "pgid": pgid,
        "port": port,
        "model": MODEL_ID,
        "process_started_at": process_started.isoformat(),
        "start_delta_seconds": round(start_delta, 3),
    }


async def eject_persisted_recipe_instance(row: dict[str, Any], *, delete_record: bool = True) -> None:
    """Eject a recipe after restart, while preserving the v0.79 fail-closed boundary."""
    instance_id = str(row.get("id") or "")
    if not instance_id:
        raise ValueError("Recipe instance is missing an id; Eject is disabled.")

    managed = process_manager._processes.get(instance_id)
    if managed and managed.proc.returncode is None:
        # Keep the original in-memory lifecycle path when the Controller has not restarted.
        from app.core.dgx_spark_recipe import eject_recipe_instance

        await eject_recipe_instance(instance_id, delete_record=delete_record)
        return

    proof = await prove_persisted_recipe_ownership(row)
    if not proof["owned"]:
        raise ValueError(f"Ownership could not be revalidated; Eject is disabled: {proof['reason']}.")

    pid = int(proof["pid"])
    await execute(
        "UPDATE instances SET status = ?, updated_at = ? WHERE id = ?",
        ("stopping", now_iso(), instance_id),
    )
    await append_log(instance_id, "system", "Persistent ownership revalidated after Controller restart. Ejecting owned process group.")

    try:
        os.killpg(pid, signal.SIGTERM)
    except ProcessLookupError:
        pass

    for _ in range(30):
        if not Path(f"/proc/{pid}").exists():
            break
        await asyncio.sleep(0.5)
    else:
        # Revalidate immediately before escalation. Never SIGKILL a PID whose
        # identity changed while waiting for graceful shutdown.
        fresh_row = dict(row)
        fresh_proof = await prove_persisted_recipe_ownership(fresh_row)
        if not fresh_proof["owned"]:
            raise ValueError("Ownership changed during Eject; refusing SIGKILL escalation.")
        try:
            os.killpg(pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        for _ in range(20):
            if not Path(f"/proc/{pid}").exists():
                break
            await asyncio.sleep(0.25)

    if Path(f"/proc/{pid}").exists():
        raise ValueError("Owned process did not exit after Eject; record was preserved for inspection.")

    await execute(
        "UPDATE instances SET status = ?, pid = NULL, stopped_at = ?, updated_at = ? WHERE id = ?",
        ("stopped", now_iso(), now_iso(), instance_id),
    )
    if delete_record:
        await execute("DELETE FROM logs WHERE instance_id = ?", (instance_id,))
        await execute("DELETE FROM metrics_snapshots WHERE instance_id = ?", (instance_id,))
        await execute("DELETE FROM instances WHERE id = ?", (instance_id,))
