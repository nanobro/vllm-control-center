from pydantic import BaseModel, Field


class MetricSample(BaseModel):
    name: str
    labels: dict[str, str] = Field(default_factory=dict)
    value: float


class GpuSnapshot(BaseModel):
    index: int
    name: str
    memory_total_mb: int | None = None
    memory_used_mb: int | None = None
    utilization_percent: int | None = None
    temperature_c: int | None = None
    memory_used_percent: float | None = None


class MetricsAlert(BaseModel):
    severity: str
    title: str
    message: str


class VllmMetricsSummary(BaseModel):
    instance_id: str
    available: bool
    error: str | None = None
    kv_cache_usage_perc: float | None = None
    requests_running: float | None = None
    requests_waiting: float | None = None
    prompt_tokens_total: float | None = None
    generation_tokens_total: float | None = None
    request_success_total: float | None = None
    e2e_latency_count: float | None = None
    e2e_latency_sum: float | None = None
    inter_token_latency_count: float | None = None
    inter_token_latency_sum: float | None = None
    e2e_latency_avg_ms: float | None = None
    inter_token_latency_avg_ms: float | None = None
    prompt_tokens_per_sec: float | None = None
    generation_tokens_per_sec: float | None = None
    raw_metrics_count: int = 0
    gpus: list[GpuSnapshot] = Field(default_factory=list)
    alerts: list[MetricsAlert] = Field(default_factory=list)


class MetricsHistoryPoint(BaseModel):
    created_at: str
    available: bool
    kv_cache_usage_perc: float | None = None
    requests_running: float | None = None
    requests_waiting: float | None = None
    prompt_tokens_total: float | None = None
    generation_tokens_total: float | None = None
    prompt_tokens_per_sec: float | None = None
    generation_tokens_per_sec: float | None = None
    e2e_latency_avg_ms: float | None = None
    inter_token_latency_avg_ms: float | None = None


class MetricsHistoryResponse(BaseModel):
    instance_id: str
    points: list[MetricsHistoryPoint]
