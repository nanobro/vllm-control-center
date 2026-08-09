from __future__ import annotations

from datetime import datetime, timezone

import pytest

from app.core import recipe_ownership as ownership


def _row() -> dict:
    started = datetime.now(timezone.utc).isoformat()
    return {
        "id": "recipe-1",
        "name": ownership.INSTANCE_PREFIX,
        "pid": 4242,
        "port": 8000,
        "started_at": started,
        "config_json": __import__("json").dumps(
            {"model": ownership.MODEL_ID, "port": 8000}
        ),
        "command_json": __import__("json").dumps(
            ["vllm", "serve", ownership.MODEL_ID, "--port", "8000"]
        ),
    }


@pytest.mark.asyncio
async def test_persisted_ownership_revalidates_after_controller_restart(monkeypatch):
    row = _row()
    started = datetime.fromisoformat(row["started_at"])

    monkeypatch.setattr(ownership, "_process_start_time", lambda _pid: started)
    monkeypatch.setattr(
        ownership,
        "_live_cmdline",
        lambda _pid: f"vllm serve {ownership.MODEL_ID} --port 8000",
    )
    monkeypatch.setattr(ownership, "_endpoint_models", lambda _port: [ownership.MODEL_ID])
    monkeypatch.setattr(ownership.os, "getpgid", lambda pid: pid)

    proof = await ownership.prove_persisted_recipe_ownership(row)

    assert proof["owned"] is True
    assert proof["pid"] == 4242
    assert proof["port"] == 8000


@pytest.mark.asyncio
async def test_pid_reuse_fails_closed(monkeypatch):
    row = _row()
    launched = datetime.fromisoformat(row["started_at"])
    reused = launched.replace(year=launched.year - 1)

    monkeypatch.setattr(ownership, "_process_start_time", lambda _pid: reused)

    proof = await ownership.prove_persisted_recipe_ownership(row)

    assert proof["owned"] is False
    assert "PID birth time" in proof["reason"]


@pytest.mark.asyncio
async def test_changed_live_command_fails_closed(monkeypatch):
    row = _row()
    started = datetime.fromisoformat(row["started_at"])

    monkeypatch.setattr(ownership, "_process_start_time", lambda _pid: started)
    monkeypatch.setattr(
        ownership,
        "_live_cmdline",
        lambda _pid: "python embedding_server.py --port 8000",
    )

    proof = await ownership.prove_persisted_recipe_ownership(row)

    assert proof["owned"] is False
    assert "live process command" in proof["reason"]


@pytest.mark.asyncio
async def test_changed_process_group_fails_closed(monkeypatch):
    row = _row()
    started = datetime.fromisoformat(row["started_at"])

    monkeypatch.setattr(ownership, "_process_start_time", lambda _pid: started)
    monkeypatch.setattr(
        ownership,
        "_live_cmdline",
        lambda _pid: f"vllm serve {ownership.MODEL_ID} --port 8000",
    )
    monkeypatch.setattr(ownership.os, "getpgid", lambda _pid: 9999)

    proof = await ownership.prove_persisted_recipe_ownership(row)

    assert proof["owned"] is False
    assert "process-group leader" in proof["reason"]


@pytest.mark.asyncio
async def test_changed_endpoint_model_fails_closed(monkeypatch):
    row = _row()
    started = datetime.fromisoformat(row["started_at"])

    monkeypatch.setattr(ownership, "_process_start_time", lambda _pid: started)
    monkeypatch.setattr(
        ownership,
        "_live_cmdline",
        lambda _pid: f"vllm serve {ownership.MODEL_ID} --port 8000",
    )
    monkeypatch.setattr(ownership.os, "getpgid", lambda pid: pid)
    monkeypatch.setattr(ownership, "_endpoint_models", lambda _port: ["Qwen/Qwen3-Embedding-0.6B"])

    proof = await ownership.prove_persisted_recipe_ownership(row)

    assert proof["owned"] is False
    assert "OpenAI endpoint" in proof["reason"]


@pytest.mark.asyncio
async def test_eject_refuses_unverified_persisted_runtime(monkeypatch):
    row = _row()
    ownership.process_manager._processes.clear()

    async def no_proof(_row):
        return {"owned": False, "reason": "PID birth time does not match the persisted launch"}

    monkeypatch.setattr(ownership, "prove_persisted_recipe_ownership", no_proof)

    with pytest.raises(ValueError, match="Eject is disabled"):
        await ownership.eject_persisted_recipe_instance(row, delete_record=False)
