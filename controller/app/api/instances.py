from datetime import datetime, timezone
from uuid import uuid4

import asyncio
import json

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.core.command_builder import (
    build_docker_command,
    build_docker_compose,
    build_subprocess_argv,
    build_yaml_config,
    redact_argv,
    shell_join,
)
from app.core.error_recovery import build_error_recovery_advice, join_error_sources
from app.core.log_store import logs_after, tail_logs
from app.core.process_manager import process_manager
from app.db import dumps_json, execute, fetchall, fetchone, loads_json
from app.schemas.error_recovery import ErrorRecoveryAdvice
from app.schemas.instances import CommandPreview, CreateInstanceRequest, InstanceRecord, LogLine, VllmServeConfig

router = APIRouter(tags=["instances"])


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def row_to_instance(row: dict) -> InstanceRecord:
    return InstanceRecord(
        id=row["id"],
        name=row["name"],
        status=row["status"],
        host=row["host"],
        port=row["port"],
        config=VllmServeConfig(**loads_json(row["config_json"])),
        pid=row.get("pid"),
        started_at=row.get("started_at"),
        stopped_at=row.get("stopped_at"),
        last_error=row.get("last_error"),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.get("", response_model=list[InstanceRecord])
async def list_instances():
    rows = await fetchall("SELECT * FROM instances ORDER BY created_at DESC")
    return [row_to_instance(row) for row in rows]


@router.post("", response_model=InstanceRecord)
async def create_instance(req: CreateInstanceRequest):
    instance_id = str(uuid4())
    ts = now_iso()
    await execute(
        """
        INSERT INTO instances(id, name, status, host, port, config_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            instance_id,
            req.name,
            "stopped",
            req.config.host,
            req.config.port,
            dumps_json(req.config.model_dump()),
            ts,
            ts,
        ),
    )
    row = await fetchone("SELECT * FROM instances WHERE id = ?", (instance_id,))
    assert row is not None
    return row_to_instance(row)


@router.get("/{instance_id}", response_model=InstanceRecord)
async def get_instance(instance_id: str):
    row = await fetchone("SELECT * FROM instances WHERE id = ?", (instance_id,))
    if not row:
        raise HTTPException(status_code=404, detail="instance not found")
    return row_to_instance(row)


@router.get("/{instance_id}/command", response_model=CommandPreview)
async def command_preview(instance_id: str):
    row = await fetchone("SELECT * FROM instances WHERE id = ?", (instance_id,))
    if not row:
        raise HTTPException(status_code=404, detail="instance not found")
    config = VllmServeConfig(**loads_json(row["config_json"]))
    argv = build_subprocess_argv(config)
    redacted = redact_argv(argv)
    docker = build_docker_command(config)
    return CommandPreview(
        argv=redacted,
        redacted_command=shell_join(redacted),
        yaml_config=build_yaml_config(config, redact=True),
        docker_command=shell_join(redact_argv(docker)),
        docker_compose=build_docker_compose(config),
    )


@router.post("/{instance_id}/start")
async def start_instance(instance_id: str):
    try:
        await process_manager.start(instance_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail="vLLM is not installed or not in this environment") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"ok": True}


@router.post("/{instance_id}/stop")
async def stop_instance(instance_id: str):
    try:
        await process_manager.stop(instance_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True}


@router.post("/{instance_id}/restart")
async def restart_instance(instance_id: str):
    try:
        await process_manager.restart(instance_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True}




@router.delete("/{instance_id}")
async def delete_instance(instance_id: str):
    row = await fetchone("SELECT * FROM instances WHERE id = ?", (instance_id,))
    if not row:
        raise HTTPException(status_code=404, detail="instance not found")
    if row["status"] in {"running", "starting", "stopping"}:
        raise HTTPException(status_code=400, detail="stop the instance before deleting it")
    await execute("DELETE FROM logs WHERE instance_id = ?", (instance_id,))
    await execute("DELETE FROM metrics_snapshots WHERE instance_id = ?", (instance_id,))
    await execute("DELETE FROM instances WHERE id = ?", (instance_id,))
    return {"ok": True, "deleted": True}


@router.get("/{instance_id}/recovery", response_model=ErrorRecoveryAdvice)
async def instance_recovery(instance_id: str):
    row = await fetchone("SELECT * FROM instances WHERE id = ?", (instance_id,))
    if not row:
        raise HTTPException(status_code=404, detail="instance not found")
    logs = await tail_logs(instance_id, tail=160)
    log_text = "\n".join(f"[{line.stream}] {line.line}" for line in logs)
    raw = join_error_sources([row.get("last_error"), log_text])
    return build_error_recovery_advice(raw, context="runtime")


@router.get("/{instance_id}/logs", response_model=list[LogLine])
async def get_logs(instance_id: str, tail: int = Query(default=200, ge=1, le=5000)):
    return await tail_logs(instance_id, tail=tail)


@router.get("/{instance_id}/logs/stream")
async def stream_logs(instance_id: str, after_id: int = Query(default=0, ge=0)):
    row = await fetchone("SELECT id FROM instances WHERE id = ?", (instance_id,))
    if not row:
        raise HTTPException(status_code=404, detail="instance not found")

    async def event_generator():
        last_id = after_id
        idle_ticks = 0
        while True:
            rows = await logs_after(instance_id, after_id=last_id, limit=200)
            if rows:
                idle_ticks = 0
                for line in rows:
                    last_id = line.id
                    payload = line.model_dump()
                    yield f"id: {line.id}\nevent: log\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"
            else:
                idle_ticks += 1
                if idle_ticks % 15 == 0:
                    yield ': keepalive\n\n'
                await asyncio.sleep(1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
