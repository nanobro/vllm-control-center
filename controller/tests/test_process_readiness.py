import pytest

from app.config import settings
from app.core.process_manager import ProcessManager, probe_openai_endpoint, readiness_urls
from app.db import execute, fetchone, init_db
from app.schemas.instances import VllmServeConfig


@pytest.fixture(autouse=True)
async def temp_database(tmp_path):
    original = settings.database_path
    settings.database_path = tmp_path / 'controller.db'
    await init_db()
    yield
    settings.database_path = original


def test_readiness_urls_use_loopback_for_wildcard_host():
    urls = readiness_urls(VllmServeConfig(model='org/model', host='0.0.0.0', port=8123))
    assert urls == ['http://127.0.0.1:8123/v1/models', 'http://127.0.0.1:8123/health']


async def test_probe_openai_endpoint_tries_models_then_health(monkeypatch):
    seen: list[str] = []

    def fake_probe(url: str, api_key: str | None):
        seen.append(url)
        return (url.endswith('/health'), None if url.endswith('/health') else 'not ready')

    monkeypatch.setattr('app.core.process_manager._probe_url', fake_probe)
    ok, error = await probe_openai_endpoint(VllmServeConfig(model='org/model', port=8124))
    assert ok is True
    assert error is None
    assert seen == ['http://127.0.0.1:8124/v1/models', 'http://127.0.0.1:8124/health']


async def test_readiness_watch_marks_starting_instance_running(monkeypatch):
    await execute("""
        INSERT INTO instances(id, name, status, host, port, config_json, created_at, updated_at)
        VALUES ('inst-ready', 'ready-model', 'starting', '127.0.0.1', 8125, '{"model":"org/model"}', 'now', 'now')
    """)

    async def fake_probe(config: VllmServeConfig):
        return True, None

    class FakeProc:
        returncode = None

    monkeypatch.setattr('app.core.process_manager.probe_openai_endpoint', fake_probe)
    manager = ProcessManager()
    await manager._watch_readiness('inst-ready', FakeProc(), VllmServeConfig(model='org/model', port=8125))

    row = await fetchone('SELECT status, last_error FROM instances WHERE id = ?', ('inst-ready',))
    assert row is not None
    assert row['status'] == 'running'
    assert row['last_error'] is None
