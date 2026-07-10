import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.core.error_recovery import build_error_recovery_advice, concise_error_label
from app.db import execute, init_db
from app.main import app


@pytest.fixture(autouse=True)
async def temp_database(tmp_path):
    original = settings.database_path
    settings.database_path = tmp_path / 'controller.db'
    await init_db()
    yield
    settings.database_path = original


def test_oom_error_maps_to_low_vram_recovery():
    advice = build_error_recovery_advice('torch.cuda.OutOfMemoryError: CUDA out of memory')
    assert advice.category == 'cuda_oom'
    assert advice.severity == 'critical'
    assert any('Low VRAM' in action.label for action in advice.actions)
    assert '--max-model-len' in (advice.actions[1].copy_text or '')


def test_port_in_use_error_has_port_check_action():
    advice = build_error_recovery_advice('OSError: [Errno 98] address already in use')
    assert advice.category == 'port_in_use'
    assert any(action.copy_text == 'lsof -i :8000' for action in advice.actions)


def test_concise_error_label_uses_human_title():
    assert concise_error_label('vllm: command not found') == 'vLLM is not installed or not in this environment'


async def test_instance_recovery_uses_last_error_and_logs():
    await execute("""
        INSERT INTO instances(id, name, status, host, port, config_json, last_error, created_at, updated_at)
        VALUES ('inst1', 'bad-model', 'crashed', '127.0.0.1', 8000, '{"model":"org/model"}', 'exit code 1', 'now', 'now')
    """)
    await execute("""
        INSERT INTO logs(instance_id, stream, line, created_at)
        VALUES ('inst1', 'stderr', 'RuntimeError: CUDA out of memory while loading weights', 'now')
    """)
    client = TestClient(app)
    response = client.get('/api/instances/inst1/recovery')
    assert response.status_code == 200
    body = response.json()
    assert body['category'] == 'cuda_oom'
    assert body['title'] == 'Insufficient GPU memory'


async def test_download_recovery_uses_hf_auth_error():
    await execute("""
        INSERT INTO model_download_jobs(id, model_id, status, register_model, dry_run, error, created_at, updated_at)
        VALUES ('job1', 'org/private-model', 'failed', 1, 0, '401 Client Error: gated repo requires authentication', 'now', 'now')
    """)
    client = TestClient(app)
    response = client.get('/api/downloads/job1/recovery')
    assert response.status_code == 200
    body = response.json()
    assert body['category'] == 'hf_auth'
    assert 'Hugging Face' in body['title']



def test_unsupported_architecture_has_specific_recovery():
    advice = build_error_recovery_advice("ValueError: Model architectures ['CoolNewVisionModel'] are not supported for vLLM")
    assert advice.category == 'unsupported_architecture'
    assert 'architecture' in advice.title.lower()
    assert any('update' in fix.lower() for fix in advice.immediate_fixes)


def test_wrong_model_type_has_specific_recovery():
    advice = build_error_recovery_advice('Wrong model type: diffusion/image model architecture is not supported')
    assert advice.category == 'wrong_model_type'
    assert 'text' in advice.title.lower()
    assert any('text-generation' in fix for fix in advice.immediate_fixes)


def test_bad_hf_snapshot_path_has_specific_recovery():
    advice = build_error_recovery_advice('Bad Hugging Face snapshot path: choose snapshots/<revision>; config.json missing in models--Qwen--repo')
    assert advice.category == 'bad_hf_snapshot_path'
    assert 'snapshot' in advice.title.lower()


def test_unknown_crash_uses_plain_title():
    advice = build_error_recovery_advice('RuntimeError: worker process died unexpectedly')
    assert advice.category == 'unknown_vllm_crash'
    assert advice.title == 'Unknown vLLM crash'
