import logging
from datetime import datetime, timezone

from app.db import execute, fetchall
from app.schemas.instances import LogLine

_RUNTIME_LOGGER = logging.getLogger("uvicorn.error")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def redact_line(line: str) -> str:
    # Conservative redaction for common secret patterns.
    lowered = line.lower()
    if "api-key" in lowered or "authorization:" in lowered or "hf_token" in lowered:
        return "<redacted secret line>"
    return line.rstrip("\n")


async def append_log(instance_id: str, stream: str, line: str) -> None:
    safe_line = redact_line(line)
    await execute(
        "INSERT INTO logs(instance_id, stream, line, created_at) VALUES (?, ?, ?, ?)",
        (instance_id, stream, safe_line, now_iso()),
    )
    # Mirror persisted runtime output into the controller process log so hardware
    # evidence still contains child stdout/stderr even if an Eject later removes
    # the transient instance and database log rows.
    _RUNTIME_LOGGER.info("runtime[%s][%s] %s", instance_id, stream, safe_line)


async def tail_logs(instance_id: str, tail: int = 200) -> list[LogLine]:
    rows = await fetchall(
        """
        SELECT id, instance_id, stream, line, created_at
        FROM logs
        WHERE instance_id = ?
        ORDER BY id DESC
        LIMIT ?
        """,
        (instance_id, tail),
    )
    return [LogLine(**row) for row in reversed(rows)]


async def logs_after(instance_id: str, after_id: int = 0, limit: int = 200) -> list[LogLine]:
    rows = await fetchall(
        """
        SELECT id, instance_id, stream, line, created_at
        FROM logs
        WHERE instance_id = ? AND id > ?
        ORDER BY id ASC
        LIMIT ?
        """,
        (instance_id, after_id, limit),
    )
    return [LogLine(**row) for row in rows]
