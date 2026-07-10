import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.db import execute, init_db
from app.main import app


@pytest.fixture(autouse=True)
async def temp_database(tmp_path):
    original = settings.database_path
    settings.database_path = tmp_path / 'controller.db'
    await init_db()
    yield
    settings.database_path = original


def test_server_qa_returns_readiness_summary(monkeypatch):
    from app.schemas.system import CheckResult, DoctorReport
    import app.api.server as server_api

    async def fake_doctor():
        return DoctorReport(
            python=CheckResult(ok=True, message='Python ok', version='3.11'),
            vllm=CheckResult(ok=True, message='vLLM ok', version='0.test'),
            nvidia=CheckResult(ok=True, message='GPU ok'),
            docker=CheckResult(ok=False, message='Docker missing'),
            gpus=[],
            warnings=[],
        )

    monkeypatch.setattr(server_api, 'run_doctor', fake_doctor)
    client = TestClient(app)
    response = client.get('/api/server/qa')
    assert response.status_code == 200
    body = response.json()
    assert 'checks' in body
    assert any(check['id'] == 'vllm-cli' and check['status'] == 'ok' for check in body['checks'])
    assert body['active_downloads'] == 0


async def test_server_qa_counts_downloads_and_instances(monkeypatch):
    from app.schemas.system import CheckResult, DoctorReport
    import app.api.server as server_api

    async def fake_doctor():
        return DoctorReport(
            python=CheckResult(ok=True, message='Python ok'),
            vllm=CheckResult(ok=False, message='vLLM missing'),
            nvidia=CheckResult(ok=False, message='No GPU'),
            docker=CheckResult(ok=False, message='Docker missing'),
            gpus=[],
            warnings=[],
        )

    monkeypatch.setattr(server_api, 'run_doctor', fake_doctor)
    await execute("""
        INSERT INTO model_download_jobs(id, model_id, status, register_model, dry_run, created_at, updated_at)
        VALUES ('job1', 'org/model', 'running', 1, 1, 'now', 'now')
    """)
    await execute("""
        INSERT INTO instances(id, name, status, host, port, config_json, created_at, updated_at)
        VALUES ('inst1', 'model', 'running', '127.0.0.1', 8000, '{"model":"org/model"}', 'now', 'now')
    """)
    client = TestClient(app)
    response = client.get('/api/server/qa')
    assert response.status_code == 200
    body = response.json()
    assert body['active_downloads'] == 1
    assert body['running_instances'] == 1
    assert any(check['id'] == 'downloads-active' for check in body['checks'])
