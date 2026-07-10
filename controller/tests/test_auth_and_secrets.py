import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.core.secrets import mask_secret, redact_secret_text
from app.db import init_db
from app.main import app


@pytest.fixture(autouse=True)
async def temp_database_and_auth(tmp_path):
    original_db = settings.database_path
    original_key = settings.controller_api_key
    original_bypass = settings.allow_localhost_auth_bypass
    settings.database_path = tmp_path / 'controller.db'
    settings.controller_api_key = None
    settings.allow_localhost_auth_bypass = False
    await init_db()
    yield
    settings.database_path = original_db
    settings.controller_api_key = original_key
    settings.allow_localhost_auth_bypass = original_bypass


def test_health_is_public_when_auth_enabled():
    settings.controller_api_key = 'secret'
    client = TestClient(app)
    assert client.get('/api/health').status_code == 200


def test_controller_auth_blocks_api_without_key():
    settings.controller_api_key = 'secret'
    client = TestClient(app)
    response = client.get('/api/system/doctor')
    assert response.status_code == 401


def test_controller_auth_accepts_bearer_key():
    settings.controller_api_key = 'secret'
    client = TestClient(app)
    response = client.get('/api/system/doctor', headers={'Authorization': 'Bearer secret'})
    assert response.status_code == 200


def test_controller_auth_accepts_query_key_for_eventsource_style_routes():
    settings.controller_api_key = 'secret'
    client = TestClient(app)
    response = client.get('/api/system/doctor?api_key=secret')
    assert response.status_code == 200


def test_controller_auth_localhost_bypass_is_explicit():
    settings.controller_api_key = 'secret'
    settings.allow_localhost_auth_bypass = True
    client = TestClient(app)
    assert client.get('/api/system/doctor').status_code == 200


def test_secret_redaction_helpers():
    text = 'Authorization: Bearer abc123 and --api-key xyz789 and hf_token=hello'
    redacted = redact_secret_text(text)
    assert 'abc123' not in redacted
    assert 'xyz789' not in redacted
    assert 'hello' not in redacted
    assert '<redacted>' in redacted
    assert mask_secret('abcdefghijkl') == 'abcd...ijkl'
