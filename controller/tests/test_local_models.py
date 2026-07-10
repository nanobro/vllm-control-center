import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.db import execute, fetchall, fetchone, init_db
from app.main import app
from app.core import local_model_library


@pytest.fixture(autouse=True)
async def temp_database(tmp_path, monkeypatch):
    original_db = settings.database_path
    settings.database_path = tmp_path / 'controller.db'
    monkeypatch.setenv('HF_HOME', str(tmp_path / 'hf-home'))
    await init_db()
    yield tmp_path
    settings.database_path = original_db


async def test_local_models_lists_registry_completed_download_and_active_instance(tmp_path):
    client = TestClient(app)
    model_dir = tmp_path / 'models' / 'org--local-model'
    model_dir.mkdir(parents=True)
    (model_dir / 'config.json').write_text('{}')

    created = client.post('/api/models', json={
        'model_id': 'org/local-model',
        'display_name': 'Local Model',
        'local_path': str(model_dir),
        'tags': ['local'],
    })
    assert created.status_code == 200

    instance = client.post('/api/instances', json={
        'name': 'local-model',
        'config': {'model': 'org/local-model', 'port': 8222},
    })
    assert instance.status_code == 200
    instance_id = instance.json()['id']
    await execute("UPDATE instances SET status = 'running' WHERE id = ?", (instance_id,))

    response = client.get('/api/local-models')
    assert response.status_code == 200
    body = response.json()
    assert any(item['model_id'] == 'org/local-model' and item['active_status'] == 'running' for item in body['models'])
    assert instance_id in body['loaded_instance_ids']
    assert body['scanned_paths']


def test_load_local_model_creates_instance_without_starting(tmp_path):
    client = TestClient(app)
    model_dir = tmp_path / 'model'
    model_dir.mkdir()
    response = client.post('/api/local-models/load', json={
        'model_id': 'org/model',
        'local_path': str(model_dir),
        'port': 8223,
        'start': False,
    })
    assert response.status_code == 200
    body = response.json()
    assert body['loaded'] is False
    assert body['config']['model'] == str(model_dir)
    assert body['instance']['status'] == 'stopped'


async def test_unload_local_model_alias_stops_instance(monkeypatch):
    client = TestClient(app)
    created = client.post('/api/instances', json={
        'name': 'loaded-model',
        'config': {'model': 'org/model', 'port': 8224},
    })
    assert created.status_code == 200
    instance_id = created.json()['id']
    await execute("UPDATE instances SET status = 'running' WHERE id = ?", (instance_id,))

    # The process manager has no live process for this synthetic row, so it reports stopped after updating state.
    response = client.post(f'/api/local-models/{instance_id}/unload')
    assert response.status_code == 200
    row = await fetchone('SELECT status FROM instances WHERE id = ?', (instance_id,))
    assert row is not None
    assert row['status'] == 'stopped'

def test_load_local_model_preserves_advanced_load_settings(tmp_path):
    client = TestClient(app)
    model_dir = tmp_path / 'advanced-model'
    model_dir.mkdir()
    response = client.post('/api/local-models/load', json={
        'model_id': 'org/advanced-model',
        'local_path': str(model_dir),
        'port': 8225,
        'start': False,
        'api_key': 'local-server-key',
        'served_model_name': 'advanced-alias',
        'dtype': 'float16',
        'gpu_memory_utilization': 0.77,
        'max_model_len': 8192,
        'kv_cache_memory_bytes': '4G',
        'tensor_parallel_size': 2,
        'pipeline_parallel_size': 1,
        'trust_remote_code': True,
        'enable_auto_tool_choice': True,
        'tool_call_parser': 'hermes',
        'reasoning_parser': 'deepseek_r1',
        'extra_args': ['--max-num-seqs', '32'],
    })
    assert response.status_code == 200
    config = response.json()['config']
    assert config['model'] == str(model_dir)
    assert config['api_key'] == 'local-server-key'
    assert config['served_model_name'] == 'advanced-alias'
    assert config['dtype'] == 'float16'
    assert config['gpu_memory_utilization'] == 0.77
    assert config['max_model_len'] == 8192
    assert config['kv_cache_memory_bytes'] == '4G'
    assert config['tensor_parallel_size'] == 2
    assert config['pipeline_parallel_size'] == 1
    assert config['trust_remote_code'] is True
    assert config['enable_auto_tool_choice'] is True
    assert config['tool_call_parser'] == 'hermes'
    assert config['reasoning_parser'] == 'deepseek_r1'
    assert config['extra_args'] == ['--max-num-seqs', '32']

async def test_local_models_reads_metadata_from_config_and_gguf(tmp_path):
    client = TestClient(app)
    hf_dir = tmp_path / 'hf-home' / 'hub' / 'models--org--meta-model' / 'snapshots' / 'abc123'
    hf_dir.mkdir(parents=True)
    (hf_dir / 'config.json').write_text('{"architectures":["Qwen3ForCausalLM"],"max_position_embeddings":32768}')
    (hf_dir / 'model-00001-of-00002.safetensors').write_text('fake')

    gguf_dir = tmp_path / 'hf-home' / 'hub' / 'models--org--gguf-model' / 'snapshots' / 'def456'
    gguf_dir.mkdir(parents=True)
    (gguf_dir / 'model.Q4_K_M.gguf').write_text('fake')

    response = client.get('/api/local-models')
    assert response.status_code == 200
    models = {item['model_id']: item for item in response.json()['models']}
    assert models['org/meta-model']['format'] == 'Safetensors'
    assert models['org/meta-model']['architecture'] == 'Qwen3ForCausalLM'
    assert models['org/meta-model']['context_length'] == 32768
    assert models['org/gguf-model']['format'] == 'GGUF'
    assert models['org/gguf-model']['quantization'] == 'Q4-K-M'

async def test_load_local_model_reuses_running_instance_instead_of_duplicate(tmp_path):
    client = TestClient(app)
    model_dir = tmp_path / 'reuse-model'
    model_dir.mkdir()
    created = client.post('/api/instances', json={
        'name': 'reuse-model',
        'config': {'model': str(model_dir), 'port': 8330},
    })
    assert created.status_code == 200
    instance_id = created.json()['id']
    await execute("UPDATE instances SET status = 'running' WHERE id = ?", (instance_id,))

    response = client.post('/api/local-models/load', json={
        'model_id': 'org/reuse-model',
        'local_path': str(model_dir),
        'port': 8331,
        'start': True,
    })
    assert response.status_code == 200
    body = response.json()
    assert body['instance_id'] == instance_id
    assert body['reused_existing'] is True
    assert body['action'] == 'already_loaded'
    assert body['loaded'] is True

    rows = await fetchall('SELECT * FROM instances')
    assert len(rows) == 1


async def test_load_local_model_reuses_stopped_instance_and_updates_settings(tmp_path):
    client = TestClient(app)
    model_dir = tmp_path / 'stopped-reuse'
    model_dir.mkdir()
    created = client.post('/api/instances', json={
        'name': 'old-name',
        'config': {'model': str(model_dir), 'port': 8332, 'dtype': 'auto'},
    })
    assert created.status_code == 200
    instance_id = created.json()['id']

    response = client.post('/api/local-models/load', json={
        'model_id': 'org/stopped-reuse',
        'local_path': str(model_dir),
        'name': 'new-name',
        'port': 8333,
        'dtype': 'float16',
        'start': False,
    })
    assert response.status_code == 200
    body = response.json()
    assert body['instance_id'] == instance_id
    assert body['reused_existing'] is True
    assert body['action'] == 'reused_stopped'
    assert body['config']['port'] == 8333
    assert body['config']['dtype'] == 'float16'


async def test_load_local_model_force_new_allows_duplicate_when_explicit(tmp_path):
    client = TestClient(app)
    model_dir = tmp_path / 'force-new'
    model_dir.mkdir()
    first = client.post('/api/local-models/load', json={
        'model_id': 'org/force-new',
        'local_path': str(model_dir),
        'port': 8334,
        'start': False,
    })
    assert first.status_code == 200
    second = client.post('/api/local-models/load', json={
        'model_id': 'org/force-new',
        'local_path': str(model_dir),
        'port': 8335,
        'start': False,
        'force_new': True,
    })
    assert second.status_code == 200
    assert second.json()['instance_id'] != first.json()['instance_id']
    rows = await fetchall('SELECT * FROM instances')
    assert len(rows) == 2


async def test_local_models_prefers_running_instance_as_active(tmp_path):
    client = TestClient(app)
    model_dir = tmp_path / 'multi-instance'
    model_dir.mkdir()
    (model_dir / 'config.json').write_text('{}')
    created = client.post('/api/models', json={
        'model_id': 'org/multi-instance',
        'display_name': 'Multi Instance',
        'local_path': str(model_dir),
        'tags': ['local'],
    })
    assert created.status_code == 200
    stopped = client.post('/api/instances', json={
        'name': 'multi-stopped',
        'config': {'model': str(model_dir), 'port': 8336},
    })
    running = client.post('/api/instances', json={
        'name': 'multi-running',
        'config': {'model': str(model_dir), 'port': 8337},
    })
    assert stopped.status_code == 200
    assert running.status_code == 200
    running_id = running.json()['id']
    await execute("UPDATE instances SET status = 'running' WHERE id = ?", (running_id,))

    response = client.get('/api/local-models')
    assert response.status_code == 200
    models = {item['model_id']: item for item in response.json()['models']}
    record = models['org/multi-instance']
    assert record['active_instance_id'] == running_id
    assert record['active_status'] == 'running'
    assert record['loaded_instance_count'] == 1
    assert record['configured_instance_count'] == 2


def test_default_scan_roots_include_lm_studio_vllm_unsloth_and_downloads(monkeypatch, tmp_path):
    monkeypatch.delenv('HF_HOME', raising=False)
    monkeypatch.delenv('HUGGINGFACE_HUB_CACHE', raising=False)
    monkeypatch.setenv('VLLM_MODEL_DIRS', str(tmp_path / 'vllm-extra'))
    roots = {source: str(path) for path, source in local_model_library._scan_roots_with_sources([])}

    assert 'huggingface-cache' in roots
    assert 'lm-studio' in roots
    assert 'lm-studio-cache' in roots
    assert 'unsloth-cache' in roots
    assert 'downloads' in roots
    assert roots['VLLM_MODEL_DIRS'] == str(tmp_path / 'vllm-extra')

async def test_local_models_scans_configured_model_dirs_and_gguf_files(tmp_path, monkeypatch):
    client = TestClient(app)
    external = tmp_path / 'external-models'
    nested = external / 'TheBloke' / 'Tiny-Q4'
    nested.mkdir(parents=True)
    gguf = nested / 'tiny.Q4_K_M.gguf'
    gguf.write_text('fake-gguf')
    hf_snapshot = external / 'Org' / 'SafetensorsModel'
    hf_snapshot.mkdir(parents=True)
    (hf_snapshot / 'config.json').write_text('{"model_type":"llama","max_position_embeddings":4096}')
    (hf_snapshot / 'model.safetensors').write_text('fake')
    monkeypatch.setenv('VCC_MODEL_DIRS', str(external))

    response = client.get('/api/local-models')
    assert response.status_code == 200
    body = response.json()
    assert str(external) in body['scanned_paths']
    models = body['models']
    assert any(item['local_path'] == str(gguf) and item['format'] == 'GGUF' and item['quantization'] == 'Q4-K-M' for item in models)
    assert any(item['local_path'] == str(hf_snapshot) and item['architecture'] == 'llama' and item['context_length'] == 4096 for item in models)

async def test_scan_roots_can_be_added_from_app_and_discover_models(tmp_path):
    client = TestClient(app)
    external = tmp_path / 'app-added-models'
    model_dir = external / 'Org' / 'AddedModel'
    model_dir.mkdir(parents=True)
    (model_dir / 'config.json').write_text('{"model_type":"qwen2","max_position_embeddings":8192}')
    (model_dir / 'model.safetensors').write_text('fake')

    add = client.post('/api/local-models/scan-roots', json={'path': str(external)})
    assert add.status_code == 200
    assert str(external) in add.json()['user_paths']
    assert any(root['path'] == str(external) and root['exists'] and root['model_count'] >= 1 for root in add.json()['roots'])

    listed = client.get('/api/local-models')
    assert listed.status_code == 200
    assert any(item['local_path'] == str(model_dir) and item['architecture'] == 'qwen2' for item in listed.json()['models'])
    assert any(root['path'] == str(external) for root in listed.json()['scan_roots'])


async def test_scan_roots_can_be_removed_from_app(tmp_path):
    client = TestClient(app)
    external = tmp_path / 'remove-me'
    external.mkdir()
    add = client.post('/api/local-models/scan-roots', json={'path': str(external)})
    assert add.status_code == 200

    removed = client.delete('/api/local-models/scan-roots', params={'path': str(external)})
    assert removed.status_code == 200
    assert str(external) not in removed.json()['user_paths']

async def test_local_model_groups_combine_gguf_variants_from_same_folder(tmp_path):
    client = TestClient(app)
    external = tmp_path / 'grouped-models'
    model_dir = external / 'TheBloke' / 'TinyLlama-GGUF'
    model_dir.mkdir(parents=True)
    (model_dir / 'tinyllama.Q4_K_M.gguf').write_text('fake-q4')
    (model_dir / 'tinyllama.Q8_0.gguf').write_text('fake-q8')

    add = client.post('/api/local-models/scan-roots', json={'path': str(external)})
    assert add.status_code == 200

    response = client.get('/api/local-models')
    assert response.status_code == 200
    groups = response.json()['groups']
    group = next(item for item in groups if item['display_name'] == 'TinyLlama-GGUF')
    assert len(group['variants']) == 2
    assert set(group['quantizations']) == {'Q4-K-M', 'Q8-0'}
    assert all(variant['sibling_variant_count'] == 2 for variant in group['variants'])
    assert group['preferred_variant_id'] in {variant['id'] for variant in group['variants']}


async def test_local_model_groups_endpoint_returns_scan_roots(tmp_path):
    client = TestClient(app)
    external = tmp_path / 'group-endpoint-models'
    model_dir = external / 'Org' / 'SnapshotModel'
    model_dir.mkdir(parents=True)
    (model_dir / 'config.json').write_text('{"model_type":"qwen2"}')
    (model_dir / 'model.safetensors').write_text('fake')

    add = client.post('/api/local-models/scan-roots', json={'path': str(external)})
    assert add.status_code == 200

    response = client.get('/api/local-models/groups')
    assert response.status_code == 200
    body = response.json()
    assert any(group['display_name'] == 'SnapshotModel' for group in body['groups'])
    assert any(root['path'] == str(external) for root in body['scan_roots'])


async def test_v22_3_detects_real_world_hf_snapshot_metadata(tmp_path):
    client = TestClient(app)
    model_dir = tmp_path / 'hf-home' / 'hub' / 'models--org--awq-model' / 'snapshots' / 'abc123'
    model_dir.mkdir(parents=True)
    (model_dir / 'config.json').write_text(
        '{"model_type":"qwen2","torch_dtype":"bfloat16","max_position_embeddings":131072,'
        '"quantization_config":{"quant_method":"awq"}}'
    )
    (model_dir / 'tokenizer.json').write_text('{}')
    (model_dir / 'model-00001-of-00002.safetensors').write_text('fake')
    (model_dir / 'model-00002-of-00002.safetensors').write_text('fake')

    response = client.get('/api/local-models')
    assert response.status_code == 200
    model = next(item for item in response.json()['models'] if item['model_id'] == 'org/awq-model')
    assert model['format'] == 'Safetensors'
    assert model['quantization'] == 'AWQ'
    assert model['dtype_hint'] == 'BF16'
    assert model['context_length'] == 131072
    assert model['weight_file_count'] == 2
    assert model['is_multi_file'] is True
    assert model['config_present'] is True
    assert model['tokenizer_present'] is True
    assert model['compatibility_status'] == 'ready'
    assert model['suggested_load_format'] == 'Hugging Face snapshot path'
    assert any('weight shards' in reason for reason in model['compatibility_reasons'])


async def test_v22_3_flags_snapshot_missing_tokenizer_as_likely_not_silent_ready(tmp_path):
    client = TestClient(app)
    model_dir = tmp_path / 'hf-home' / 'hub' / 'models--org--no-tokenizer' / 'snapshots' / 'abc123'
    model_dir.mkdir(parents=True)
    (model_dir / 'config.json').write_text('{"model_type":"llama","torch_dtype":"float16"}')
    (model_dir / 'model.safetensors').write_text('fake')

    response = client.get('/api/local-models')
    assert response.status_code == 200
    model = next(item for item in response.json()['models'] if item['model_id'] == 'org/no-tokenizer')
    assert model['format'] == 'Safetensors'
    assert model['dtype_hint'] == 'FP16'
    assert model['compatibility_status'] == 'likely'
    assert model['compatibility_label'] == 'Likely vLLM-ready'
    assert any('tokenizer' in warning.lower() for warning in model['metadata_warnings'])


async def test_v22_3_marks_gguf_as_limited_compatibility(tmp_path, monkeypatch):
    client = TestClient(app)
    external = tmp_path / 'gguf-models'
    model_dir = external / 'TheBloke' / 'Tiny-GGUF'
    model_dir.mkdir(parents=True)
    gguf = model_dir / 'tiny.Q5_K_M.gguf'
    gguf.write_text('fake')
    monkeypatch.setenv('VCC_MODEL_DIRS', str(external))

    response = client.get('/api/local-models')
    assert response.status_code == 200
    model = next(item for item in response.json()['models'] if item['local_path'] == str(gguf))
    assert model['format'] == 'GGUF'
    assert model['quantization'] == 'Q5-K-M'
    assert model['compatibility_status'] == 'limited'
    assert model['compatibility_label'] == 'GGUF: load with care'
    assert model['suggested_load_format'] == 'GGUF file path'

async def test_v0_34_local_model_rows_keep_last_crash_reason(tmp_path):
    client = TestClient(app)
    model_dir = tmp_path / 'crashy-model'
    model_dir.mkdir()
    (model_dir / 'config.json').write_text('{"model_type":"qwen3"}')
    created = client.post('/api/models', json={
        'model_id': 'org/crashy-model',
        'display_name': 'Crashy Model',
        'local_path': str(model_dir),
        'tags': ['local'],
    })
    assert created.status_code == 200
    instance = client.post('/api/instances', json={
        'name': 'crashy-model',
        'config': {'model': str(model_dir), 'port': 8444},
    })
    assert instance.status_code == 200
    instance_id = instance.json()['id']
    await execute("UPDATE instances SET status = 'crashed', last_error = 'Insufficient GPU memory' WHERE id = ?", (instance_id,))

    response = client.get('/api/local-models')
    assert response.status_code == 200
    model = next(item for item in response.json()['models'] if item['model_id'] == 'org/crashy-model')
    assert model['active_status'] == 'crashed'
    assert model['active_last_error'] == 'Insufficient GPU memory'


async def test_v0_34_load_local_model_start_requested_is_warming_up(monkeypatch, tmp_path):
    import app.api.local_models as local_models_api

    async def fake_start(instance_id: str):
        await execute("UPDATE instances SET status = 'starting' WHERE id = ?", (instance_id,))

    monkeypatch.setattr(local_models_api.process_manager, 'start', fake_start)
    client = TestClient(app)
    model_dir = tmp_path / 'warmup-model'
    model_dir.mkdir()
    response = client.post('/api/local-models/load', json={
        'model_id': 'org/warmup-model',
        'local_path': str(model_dir),
        'port': 8445,
        'start': True,
    })
    assert response.status_code == 200
    body = response.json()
    assert body['loaded'] is False
    assert body['start_requested'] is True
    assert 'warming up' in body['message'].lower()
    assert body['instance']['status'] == 'starting'


def test_v0_36_low_vram_preset_applies_safe_load_settings(tmp_path):
    client = TestClient(app)
    model_dir = tmp_path / 'huge-local-qwen'
    model_dir.mkdir()
    (model_dir / 'config.json').write_text('{"model_type":"qwen3","max_position_embeddings":131072}')
    (model_dir / 'tokenizer.json').write_text('{}')
    (model_dir / 'model.safetensors').write_text('fake')

    response = client.post('/api/local-models/load', json={
        'model_id': 'Qwen/Qwen3.6-235B-A22B-Instruct',
        'local_path': str(model_dir),
        'port': 8450,
        'gpu_memory_utilization': 0.92,
        'start': False,
        'load_preset': 'low_vram',
    })
    assert response.status_code == 200
    body = response.json()
    assert body['applied_preset'] == 'low_vram'
    assert body['config']['model'] == str(model_dir)
    assert body['config']['gpu_memory_utilization'] == 0.8
    assert body['config']['max_model_len'] == 4096
    assert body['config']['extra_args'] == ['--max-num-seqs', '8']


async def test_v0_36_low_vram_retry_reuses_crashed_instance_and_updates_config(tmp_path):
    client = TestClient(app)
    model_dir = tmp_path / 'retry-crashed-qwen'
    model_dir.mkdir()
    created = client.post('/api/instances', json={
        'name': 'retry-crashed-qwen',
        'config': {'model': str(model_dir), 'port': 8451, 'gpu_memory_utilization': 0.92, 'max_model_len': 32768},
    })
    assert created.status_code == 200
    instance_id = created.json()['id']
    await execute("UPDATE instances SET status = 'crashed', last_error = 'Insufficient GPU memory' WHERE id = ?", (instance_id,))

    response = client.post('/api/local-models/load', json={
        'model_id': 'org/retry-crashed-qwen',
        'local_path': str(model_dir),
        'port': 8452,
        'start': False,
        'load_preset': 'low_vram',
    })
    assert response.status_code == 200
    body = response.json()
    assert body['instance_id'] == instance_id
    assert body['reused_existing'] is True
    assert body['action'] == 'reused_stopped'
    assert body['applied_preset'] == 'low_vram'
    assert body['config']['port'] == 8452
    assert body['config']['gpu_memory_utilization'] == 0.8
    assert body['config']['max_model_len'] == 4096
