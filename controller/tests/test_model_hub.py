import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.db import fetchall, fetchone, init_db
from app.main import app


@pytest.fixture(autouse=True)
async def temp_database(tmp_path):
    original = settings.database_path
    settings.database_path = tmp_path / 'controller.db'
    await init_db()
    yield
    settings.database_path = original


def test_model_hub_catalog_exposes_starter_models():
    client = TestClient(app)
    response = client.get('/api/model-hub/catalog')
    assert response.status_code == 200
    body = response.json()
    assert body['catalog']
    assert any(item['model_id'] == 'Qwen/Qwen3-0.6B' for item in body['catalog'])
    assert body['registered_model_ids'] == []


def test_model_hub_register_is_idempotent():
    client = TestClient(app)
    first = client.post('/api/model-hub/catalog/qwen3-0_6b/register', json={})
    second = client.post('/api/model-hub/catalog/qwen3-0_6b/register', json={})
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()['id'] == second.json()['id']


async def test_model_hub_quick_launch_creates_instance_without_starting():
    client = TestClient(app)
    response = client.post('/api/model-hub/catalog/qwen3-0_6b/quick-launch', json={'port': 8123, 'start': False})
    assert response.status_code == 200
    body = response.json()
    assert body['started'] is False
    assert body['config']['model'] == 'Qwen/Qwen3-0.6B'

    instance = await fetchone('SELECT * FROM instances WHERE id = ?', (body['instance_id'],))
    assert instance is not None
    assert instance['port'] == 8123
    models = await fetchall('SELECT * FROM models WHERE model_id = ?', ('Qwen/Qwen3-0.6B',))
    assert len(models) == 1


def test_model_hub_download_queues_catalog_model():
    client = TestClient(app)
    response = client.post('/api/model-hub/catalog/qwen3-0_6b/download', json={'dry_run': True, 'register_model': True})
    assert response.status_code == 200
    body = response.json()
    assert body['model_id'] == 'Qwen/Qwen3-0.6B'
    assert body['status'] in {'queued', 'running', 'completed'}


def test_model_hub_catalog_supports_tag_filter_for_server_picker():
    client = TestClient(app)
    response = client.get('/api/model-hub/catalog?tag=dgx')
    assert response.status_code == 200
    body = response.json()
    assert body['catalog']
    assert all('dgx' in item['tags'] for item in body['catalog'])
    assert any(item['model_id'] == 'Qwen/Qwen3-32B' for item in body['catalog'])


def test_model_hub_hf_discovery_uses_huggingface_bridge(monkeypatch):
    from app.schemas.model_hub import CatalogModelRecord
    import app.api.model_hub as model_hub_api

    async def fake_discover(query: str = '', *, limit: int = 20, hf_token_env: str | None = 'HF_TOKEN', mode: str = 'trending', task: str | None = 'llm', author: str | None = None, filters: list[str] | None = None):
        assert query == 'qwen coder'
        assert hf_token_env == 'MY_HF_TOKEN'
        assert mode == 'search'
        assert task == 'llm'
        return [
            CatalogModelRecord(
                id='hf-qwen-qwen2-5-coder-32b-instruct',
                source='huggingface',
                model_id='Qwen/Qwen2.5-Coder-32B-Instruct',
                display_name='Qwen2.5-Coder-32B-Instruct',
                description='fake HF search result',
                tags=['huggingface', 'qwen', 'coding', 'dgx'],
                size_label='32B',
                parameter_count_b=32,
                downloads=1234,
            )
        ]

    monkeypatch.setattr(model_hub_api, 'discover_huggingface_models', fake_discover)
    client = TestClient(app)
    response = client.get('/api/model-hub/hf/search?query=qwen%20coder&hf_token_env=MY_HF_TOKEN&mode=search')
    assert response.status_code == 200
    body = response.json()
    assert body['online'] is True
    assert body['catalog'][0]['source'] == 'huggingface'
    assert body['catalog'][0]['model_id'] == 'Qwen/Qwen2.5-Coder-32B-Instruct'


async def test_model_hub_register_download_quick_launch_hf_model():
    client = TestClient(app)
    payload = {'model_id': 'Qwen/Qwen3-14B', 'display_name': 'Qwen3 14B', 'tags': ['qwen', 'dgx']}

    register = client.post('/api/model-hub/hf/register', json=payload)
    assert register.status_code == 200
    assert register.json()['model_id'] == 'Qwen/Qwen3-14B'

    download = client.post('/api/model-hub/hf/download', json={**payload, 'dry_run': True, 'register_model': True})
    assert download.status_code == 200
    assert download.json()['model_id'] == 'Qwen/Qwen3-14B'

    launch = client.post('/api/model-hub/hf/quick-launch', json={**payload, 'port': 8131, 'start': False})
    assert launch.status_code == 200
    assert launch.json()['config']['model'] == 'Qwen/Qwen3-14B'


def test_model_hub_hf_trending_discovery_does_not_require_stale_example_query(monkeypatch):
    from app.schemas.model_hub import CatalogModelRecord
    import app.api.model_hub as model_hub_api

    async def fake_discover(query: str = '', *, limit: int = 20, hf_token_env: str | None = 'HF_TOKEN', mode: str = 'trending', task: str | None = 'llm', author: str | None = None, filters: list[str] | None = None):
        assert query == ''
        assert mode == 'trending'
        assert task == 'llm'
        return [
            CatalogModelRecord(
                id='hf-fresh-model',
                source='huggingface',
                model_id='fresh-org/fresh-daily-model',
                display_name='fresh-daily-model',
                description='fresh trending HF result',
                tags=['huggingface', 'text-generation'],
                downloads=99,
                likes=7,
                last_modified='2026-07-01T00:00:00.000Z',
            )
        ]

    monkeypatch.setattr(model_hub_api, 'discover_huggingface_models', fake_discover)
    client = TestClient(app)
    response = client.get('/api/model-hub/hf/search?mode=trending&task=llm')
    assert response.status_code == 200
    body = response.json()
    assert body['mode'] == 'trending'
    assert body['catalog'][0]['model_id'] == 'fresh-org/fresh-daily-model'
    assert body['catalog'][0]['last_modified'].startswith('2026-07-01')


def test_hf_variant_tree_detects_quantized_gguf_and_safetensors():
    from app.core.hf_catalog import tree_items_to_variants

    variants = tree_items_to_variants(
        'example/model-7b-gguf',
        [
            {'type': 'file', 'path': 'model.Q4_K_M.gguf', 'size': 4_200_000_000},
            {'type': 'file', 'path': 'model.Q8_0.gguf', 'size': 7_900_000_000},
            {'type': 'file', 'path': 'model-00001-of-00002.safetensors', 'size': 1_000},
            {'type': 'file', 'path': 'model.safetensors.index.json', 'size': 100},
        ],
    )
    assert any(v.format == 'GGUF' and v.quantization == 'Q4-K-M' and v.allow_patterns == ['model.Q4_K_M.gguf'] for v in variants)
    assert any(v.format == 'Safetensors' and '*.safetensors' in v.allow_patterns for v in variants)


def test_model_hub_hf_variants_endpoint(monkeypatch):
    from app.schemas.model_hub import HfModelVariant
    import app.api.model_hub as model_hub_api

    async def fake_variants(model_id: str, *, revision: str | None = 'main', hf_token_env: str | None = 'HF_TOKEN'):
        assert model_id == 'fresh-org/fresh-model-gguf'
        assert revision == 'main'
        assert hf_token_env == 'HF_TOKEN'
        return [
            HfModelVariant(
                id='hf-fresh-q4',
                model_id=model_id,
                filename='fresh-model.Q4_K_M.gguf',
                path='fresh-model.Q4_K_M.gguf',
                format='GGUF',
                quantization='Q4-K-M',
                size_bytes=123,
                size_label='123 B',
                recommended=True,
                allow_patterns=['fresh-model.Q4_K_M.gguf'],
            )
        ]

    monkeypatch.setattr(model_hub_api, 'discover_huggingface_model_variants', fake_variants)
    client = TestClient(app)
    response = client.get('/api/model-hub/hf/variants?model_id=fresh-org%2Ffresh-model-gguf')
    assert response.status_code == 200
    body = response.json()
    assert body['online'] is True
    assert body['variants'][0]['quantization'] == 'Q4-K-M'
    assert body['variants'][0]['allow_patterns'] == ['fresh-model.Q4_K_M.gguf']


async def test_hf_download_preserves_selected_variant_allow_patterns():
    client = TestClient(app)
    response = client.post('/api/model-hub/hf/download', json={
        'model_id': 'fresh-org/fresh-model-gguf',
        'display_name': 'fresh-model-gguf',
        'dry_run': True,
        'register_model': True,
        'variant_path': 'fresh-model.Q4_K_M.gguf',
        'variant_format': 'GGUF',
        'quantization': 'Q4_K_M',
        'allow_patterns': ['fresh-model.Q4_K_M.gguf'],
    })
    assert response.status_code == 200
    body = response.json()
    assert body['allow_patterns'] == ['fresh-model.Q4_K_M.gguf']
    row = await fetchone('SELECT * FROM model_download_jobs WHERE id = ?', (body['id'],))
    assert row is not None
    assert 'fresh-model.Q4_K_M.gguf' in row['allow_patterns_json']

async def test_quick_launch_persists_load_settings_from_server_page():
    client = TestClient(app)
    response = client.post('/api/model-hub/catalog/qwen3-0_6b/quick-launch', json={
        'port': 8142,
        'start': False,
        'api_key': 'server-key',
        'served_model_name': 'qwen-small',
        'dtype': 'bfloat16',
        'gpu_memory_utilization': 0.81,
        'max_model_len': 16384,
        'kv_cache_memory_bytes': '8G',
        'tensor_parallel_size': 2,
        'pipeline_parallel_size': 1,
        'trust_remote_code': True,
        'enable_auto_tool_choice': True,
        'tool_call_parser': 'hermes',
        'reasoning_parser': 'deepseek_r1',
        'extra_args': ['--enable-prefix-caching'],
    })
    assert response.status_code == 200
    config = response.json()['config']
    assert config['api_key'] == 'server-key'
    assert config['served_model_name'] == 'qwen-small'
    assert config['dtype'] == 'bfloat16'
    assert config['gpu_memory_utilization'] == 0.81
    assert config['max_model_len'] == 16384
    assert config['kv_cache_memory_bytes'] == '8G'
    assert config['tensor_parallel_size'] == 2
    assert config['pipeline_parallel_size'] == 1
    assert config['trust_remote_code'] is True
    assert config['enable_auto_tool_choice'] is True
    assert config['tool_call_parser'] == 'hermes'
    assert config['reasoning_parser'] == 'deepseek_r1'
    assert config['extra_args'] == ['--enable-prefix-caching']

async def test_catalog_quick_launch_reuses_stopped_instance_by_default():
    client = TestClient(app)
    first = client.post('/api/model-hub/catalog/qwen3-0_6b/quick-launch', json={'port': 8150, 'start': False})
    assert first.status_code == 200
    instance_id = first.json()['instance_id']
    second = client.post('/api/model-hub/catalog/qwen3-0_6b/quick-launch', json={'port': 8151, 'dtype': 'float16', 'start': False})
    assert second.status_code == 200
    body = second.json()
    assert body['instance_id'] == instance_id
    assert body['reused_existing'] is True
    assert body['action'] == 'reused_stopped'
    assert body['config']['port'] == 8151
    assert body['config']['dtype'] == 'float16'
    rows = await fetchall('SELECT * FROM instances')
    assert len(rows) == 1


async def test_catalog_quick_launch_force_new_allows_duplicate():
    client = TestClient(app)
    first = client.post('/api/model-hub/catalog/qwen3-0_6b/quick-launch', json={'port': 8152, 'start': False})
    assert first.status_code == 200
    second = client.post('/api/model-hub/catalog/qwen3-0_6b/quick-launch', json={'port': 8153, 'start': False, 'force_new': True})
    assert second.status_code == 200
    assert second.json()['instance_id'] != first.json()['instance_id']
    rows = await fetchall('SELECT * FROM instances')
    assert len(rows) == 2

async def test_v0_34_quick_launch_reports_start_requested_not_ready(monkeypatch):
    import app.api.model_hub as model_hub_api
    from app.db import execute

    async def fake_start(instance_id: str):
        await execute("UPDATE instances SET status = 'starting' WHERE id = ?", (instance_id,))

    monkeypatch.setattr(model_hub_api.process_manager, 'start', fake_start)
    client = TestClient(app)
    response = client.post('/api/model-hub/catalog/qwen3-0_6b/quick-launch', json={'port': 8446, 'start': True})
    assert response.status_code == 200
    body = response.json()
    assert body['started'] is False
    assert body['start_requested'] is True
    assert 'warming up' in body['message'].lower()
