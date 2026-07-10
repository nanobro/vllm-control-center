from __future__ import annotations

from datetime import UTC, datetime

import httpx
from fastapi import APIRouter, HTTPException

from app.core.gpu import get_nvidia_gpus
from app.core.metrics_parser import metric_sum, parse_prometheus_text
from app.db import dumps_json, execute, fetchall, fetchone, loads_json
from app.schemas.instances import VllmServeConfig
from app.schemas.metrics import (
    GpuSnapshot,
    MetricsAlert,
    MetricsHistoryPoint,
    MetricsHistoryResponse,
    VllmMetricsSummary,
)

router = APIRouter(tags=['metrics'])


@router.get('/{instance_id}/metrics', response_model=VllmMetricsSummary)
async def instance_metrics(instance_id: str):
    summary = await collect_instance_metrics(instance_id)
    await store_metrics_snapshot(summary)
    return summary


@router.get('/{instance_id}/metrics/history', response_model=MetricsHistoryResponse)
async def instance_metrics_history(instance_id: str, limit: int = 60):
    row = await fetchone('SELECT id FROM instances WHERE id = ?', (instance_id,))
    if not row:
        raise HTTPException(status_code=404, detail='instance not found')
    safe_limit = max(1, min(limit, 300))
    rows = await fetchall(
        'SELECT metrics_json, created_at FROM metrics_snapshots WHERE instance_id = ? ORDER BY id DESC LIMIT ?',
        (instance_id, safe_limit),
    )
    points: list[MetricsHistoryPoint] = []
    for item in reversed(rows):
        payload = loads_json(item['metrics_json'])
        points.append(
            MetricsHistoryPoint(
                created_at=item['created_at'],
                available=bool(payload.get('available')),
                kv_cache_usage_perc=payload.get('kv_cache_usage_perc'),
                requests_running=payload.get('requests_running'),
                requests_waiting=payload.get('requests_waiting'),
                prompt_tokens_total=payload.get('prompt_tokens_total'),
                generation_tokens_total=payload.get('generation_tokens_total'),
                prompt_tokens_per_sec=payload.get('prompt_tokens_per_sec'),
                generation_tokens_per_sec=payload.get('generation_tokens_per_sec'),
                e2e_latency_avg_ms=payload.get('e2e_latency_avg_ms'),
                inter_token_latency_avg_ms=payload.get('inter_token_latency_avg_ms'),
            )
        )
    return MetricsHistoryResponse(instance_id=instance_id, points=points)


async def collect_instance_metrics(instance_id: str) -> VllmMetricsSummary:
    row = await fetchone('SELECT * FROM instances WHERE id = ?', (instance_id,))
    if not row:
        raise HTTPException(status_code=404, detail='instance not found')
    config = VllmServeConfig(**loads_json(row['config_json']))
    gpus = normalize_gpu_snapshots([GpuSnapshot(**gpu.model_dump()) for gpu in await get_nvidia_gpus()])
    url = f'http://{config.host}:{config.port}/metrics'
    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            response = await client.get(url)
            response.raise_for_status()
    except Exception as exc:
        summary = VllmMetricsSummary(
            instance_id=instance_id,
            available=False,
            error=str(exc),
            gpus=gpus,
        )
        summary.alerts = build_alerts(summary)
        return summary

    samples = parse_prometheus_text(response.text)
    summary = VllmMetricsSummary(
        instance_id=instance_id,
        available=True,
        kv_cache_usage_perc=metric_sum(samples, 'vllm:kv_cache_usage_perc'),
        requests_running=metric_sum(samples, 'vllm:num_requests_running'),
        requests_waiting=metric_sum(samples, 'vllm:num_requests_waiting'),
        prompt_tokens_total=metric_sum(samples, 'vllm:prompt_tokens'),
        generation_tokens_total=metric_sum(samples, 'vllm:generation_tokens'),
        request_success_total=metric_sum(samples, 'vllm:request_success'),
        e2e_latency_count=metric_sum(samples, 'vllm:e2e_request_latency_seconds_count'),
        e2e_latency_sum=metric_sum(samples, 'vllm:e2e_request_latency_seconds_sum'),
        inter_token_latency_count=metric_sum(samples, 'vllm:inter_token_latency_seconds_count'),
        inter_token_latency_sum=metric_sum(samples, 'vllm:inter_token_latency_seconds_sum'),
        raw_metrics_count=len(samples),
        gpus=gpus,
    )
    summary.e2e_latency_avg_ms = average_ms(summary.e2e_latency_sum, summary.e2e_latency_count)
    summary.inter_token_latency_avg_ms = average_ms(summary.inter_token_latency_sum, summary.inter_token_latency_count)
    previous = await latest_metrics_snapshot(instance_id)
    if previous:
        summary.prompt_tokens_per_sec = counter_rate(previous, 'prompt_tokens_total', summary.prompt_tokens_total)
        summary.generation_tokens_per_sec = counter_rate(previous, 'generation_tokens_total', summary.generation_tokens_total)
    summary.alerts = build_alerts(summary)
    return summary


def normalize_gpu_snapshots(gpus: list[GpuSnapshot]) -> list[GpuSnapshot]:
    for gpu in gpus:
        if gpu.memory_total_mb and gpu.memory_used_mb is not None and gpu.memory_total_mb > 0:
            gpu.memory_used_percent = round((gpu.memory_used_mb / gpu.memory_total_mb) * 100, 2)
    return gpus


def average_ms(total_seconds: float | None, count: float | None) -> float | None:
    if total_seconds is None or count is None or count <= 0:
        return None
    return round((total_seconds / count) * 1000, 2)


async def latest_metrics_snapshot(instance_id: str) -> dict | None:
    row = await fetchone(
        'SELECT metrics_json, created_at FROM metrics_snapshots WHERE instance_id = ? ORDER BY id DESC LIMIT 1',
        (instance_id,),
    )
    if not row:
        return None
    payload = loads_json(row['metrics_json'])
    payload['_created_at'] = row['created_at']
    return payload


def counter_rate(previous: dict, key: str, current_value: float | None) -> float | None:
    if current_value is None or previous.get(key) is None or previous.get('_created_at') is None:
        return None
    try:
        previous_value = float(previous[key])
        previous_time = parse_zulu(previous['_created_at'])
    except Exception:
        return None
    delta = current_value - previous_value
    seconds = (datetime.now(UTC) - previous_time).total_seconds()
    if delta < 0 or seconds <= 0:
        return None
    return round(delta / seconds, 2)


def parse_zulu(value: str) -> datetime:
    return datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(UTC)


def build_alerts(summary: VllmMetricsSummary) -> list[MetricsAlert]:
    alerts: list[MetricsAlert] = []
    if not summary.available:
        alerts.append(MetricsAlert(severity='warning', title='Metrics unavailable', message=summary.error or 'Could not scrape vLLM /metrics.'))
    if summary.kv_cache_usage_perc is not None:
        if summary.kv_cache_usage_perc >= 90:
            alerts.append(MetricsAlert(severity='critical', title='KV cache pressure is high', message='KV cache usage is above 90%. Reduce context, concurrency, or max sequences.'))
        elif summary.kv_cache_usage_perc >= 75:
            alerts.append(MetricsAlert(severity='warning', title='KV cache pressure is rising', message='KV cache usage is above 75%. Watch waiting requests and latency.'))
    if summary.requests_waiting is not None and summary.requests_waiting > 0:
        alerts.append(MetricsAlert(severity='warning', title='Requests are waiting', message='vLLM has queued requests. Throughput or memory may be saturated.'))
    for gpu in summary.gpus:
        if gpu.memory_used_percent is not None:
            if gpu.memory_used_percent >= 95:
                alerts.append(MetricsAlert(severity='critical', title=f'GPU {gpu.index} VRAM almost full', message=f'{gpu.name} is using {gpu.memory_used_percent}% of VRAM.'))
            elif gpu.memory_used_percent >= 85:
                alerts.append(MetricsAlert(severity='warning', title=f'GPU {gpu.index} VRAM pressure', message=f'{gpu.name} is using {gpu.memory_used_percent}% of VRAM.'))
        if gpu.temperature_c is not None and gpu.temperature_c >= 85:
            alerts.append(MetricsAlert(severity='warning', title=f'GPU {gpu.index} temperature high', message=f'{gpu.name} is at {gpu.temperature_c} C.'))
    return alerts


async def store_metrics_snapshot(summary: VllmMetricsSummary) -> None:
    now = datetime.now(UTC).isoformat().replace('+00:00', 'Z')
    payload = summary.model_dump(exclude={'gpus', 'alerts'})
    await execute(
        'INSERT INTO metrics_snapshots (instance_id, metrics_json, created_at) VALUES (?, ?, ?)',
        (summary.instance_id, dumps_json(payload), now),
    )
