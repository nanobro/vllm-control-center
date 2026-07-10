from typing import Literal

from pydantic import BaseModel, Field, field_validator

CompatibilityVerdict = Literal['likely_fits', 'borderline', 'unlikely', 'unknown']
DtypeChoice = Literal['auto', 'float16', 'bfloat16', 'float32', 'int8', 'int4']
CacheDtypeChoice = Literal['auto', 'float16', 'bfloat16', 'fp8', 'fp8_e4m3', 'fp8_e5m2']
ArchitecturePreset = Literal['auto', 'qwen', 'llama', 'mistral', 'mixtral', 'deepseek', 'custom']


class CompatibilityRequest(BaseModel):
    model_id: str
    parameter_count_b: float | None = Field(default=None, ge=0)
    architecture: ArchitecturePreset = 'auto'
    dtype: DtypeChoice = 'auto'
    quantization_bits: int | None = Field(default=None, ge=2, le=16)
    cache_dtype: CacheDtypeChoice = 'auto'
    max_model_len: int = Field(default=32768, ge=1)
    expected_concurrency: int = Field(default=1, ge=1, le=256)
    gpu_memory_total_mb: int | None = Field(default=None, ge=1)
    gpu_memory_free_mb: int | None = Field(default=None, ge=1)
    gpu_memory_utilization: float = Field(default=0.92, gt=0, le=1)
    tensor_parallel_size: int = Field(default=1, ge=1)
    hidden_size: int | None = Field(default=None, ge=1)
    num_layers: int | None = Field(default=None, ge=1)
    num_attention_heads: int | None = Field(default=None, ge=1)
    num_kv_heads: int | None = Field(default=None, ge=1)
    head_dim: int | None = Field(default=None, ge=1)
    safety_margin_percent: float = Field(default=12, ge=0, le=50)

    @field_validator('model_id')
    @classmethod
    def model_id_not_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError('model_id cannot be empty')
        return value


class CompatibilityEstimate(BaseModel):
    model_weights_mb: int | None
    kv_cache_mb: int | None
    overhead_mb: int | None
    safety_margin_mb: int | None
    estimated_required_mb: int | None
    usable_gpu_memory_mb: int | None
    memory_gap_mb: int | None


class CompatibilityRecommendation(BaseModel):
    title: str
    description: str
    config_patch: dict[str, object]
    vllm_args: list[str] = Field(default_factory=list)


class CompatibilityResponse(BaseModel):
    verdict: CompatibilityVerdict
    confidence: Literal['high', 'medium', 'low']
    summary: str
    estimate: CompatibilityEstimate
    assumptions: list[str]
    warnings: list[str]
    recommendations: list[CompatibilityRecommendation]
    suggested_vllm_settings: dict[str, object]
    copyable_vllm_args: list[str]
    architecture_used: dict[str, object]


class CreateRecipeFromCompatibilityRequest(BaseModel):
    name: str
    model_id: str
    dtype: str = 'auto'
    max_model_len: int | None = None
    gpu_memory_utilization: float = Field(default=0.92, gt=0, le=1)
    tensor_parallel_size: int | None = None
    quantization_bits: int | None = Field(default=None, ge=2, le=16)
    cache_dtype: CacheDtypeChoice = 'auto'
    extra_args: list[str] = Field(default_factory=list)
