from datetime import UTC, datetime, timedelta

import pytest

from app.api.metrics import average_ms, build_alerts, counter_rate, normalize_gpu_snapshots, store_metrics_snapshot
from app.config import settings
from app.db import fetchall, init_db
from app.schemas.metrics import GpuSnapshot, VllmMetricsSummary


@pytest.fixture()
async def temp_db(tmp_path):
    original = settings.database_path
    settings.database_path = tmp_path / 'metrics.db'
    await init_db()
    try:
        yield
    finally:
        settings.database_path = original


def test_average_ms():
    assert average_ms(2.0, 4) == 500
    assert average_ms(None, 4) is None
    assert average_ms(1.0, 0) is None


def test_gpu_snapshot_adds_memory_percent():
    [gpu] = normalize_gpu_snapshots([GpuSnapshot(index=0, name='RTX', memory_total_mb=1000, memory_used_mb=875)])
    assert gpu.memory_used_percent == 87.5


def test_build_alerts_for_pressure_conditions():
    summary = VllmMetricsSummary(
        instance_id='i1',
        available=True,
        kv_cache_usage_perc=92,
        requests_waiting=3,
        gpus=[GpuSnapshot(index=0, name='RTX', memory_total_mb=1000, memory_used_mb=970, memory_used_percent=97)],
    )
    alerts = build_alerts(summary)
    titles = {alert.title for alert in alerts}
    assert 'KV cache pressure is high' in titles
    assert 'Requests are waiting' in titles
    assert 'GPU 0 VRAM almost full' in titles


def test_counter_rate_uses_previous_snapshot_timestamp():
    previous = {
        'generation_tokens_total': 100,
        '_created_at': (datetime.now(UTC) - timedelta(seconds=10)).isoformat().replace('+00:00', 'Z'),
    }
    rate = counter_rate(previous, 'generation_tokens_total', 160)
    assert rate is not None
    assert 5 <= rate <= 7


@pytest.mark.asyncio
async def test_store_metrics_snapshot(temp_db):
    summary = VllmMetricsSummary(instance_id='i1', available=True, generation_tokens_total=42, alerts=[])
    await store_metrics_snapshot(summary)
    rows = await fetchall('SELECT * FROM metrics_snapshots WHERE instance_id = ?', ('i1',))
    assert len(rows) == 1
    assert 'generation_tokens_total' in rows[0]['metrics_json']
