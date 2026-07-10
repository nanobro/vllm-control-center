import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.db import init_db
from app.main import app


@pytest.fixture(autouse=True)
async def temp_database(tmp_path):
    original = settings.database_path
    settings.database_path = tmp_path / 'controller.db'
    await init_db()
    yield
    settings.database_path = original


def test_delete_stopped_instance():
    client = TestClient(app)
    created = client.post('/api/instances', json={
        'name': 'delete-me',
        'config': {'model': 'Qwen/Qwen3-0.6B', 'port': 8123},
    })
    assert created.status_code == 200
    instance_id = created.json()['id']

    deleted = client.delete(f'/api/instances/{instance_id}')
    assert deleted.status_code == 200
    assert deleted.json()['deleted'] is True
    assert client.get(f'/api/instances/{instance_id}').status_code == 404


def test_delete_running_instance_is_blocked():
    client = TestClient(app)
    created = client.post('/api/instances', json={
        'name': 'running',
        'config': {'model': 'Qwen/Qwen3-0.6B', 'port': 8124},
    })
    assert created.status_code == 200
    instance_id = created.json()['id']

    # Simulate a running process state without spawning vLLM.
    import anyio
    from app.db import execute
    anyio.run(execute, "UPDATE instances SET status = 'running' WHERE id = ?", (instance_id,))

    deleted = client.delete(f'/api/instances/{instance_id}')
    assert deleted.status_code == 400
    assert 'stop the instance' in deleted.text
