from pydantic import BaseModel, Field

from app.schemas.instances import VllmServeConfig


class HfModelVariant(BaseModel):
    id: str
    model_id: str
    filename: str
    path: str
    format: str
    quantization: str | None = None
    size_bytes: int | None = None
    size_label: str | None = None
    recommended: bool = False
    notes: str | None = None
    allow_patterns: list[str] = Field(default_factory=list)
    extra_args: list[str] = Field(default_factory=list)


class HfModelVariantsResponse(BaseModel):
    model_id: str
    revision: str | None = None
    hf_token_env: str | None = None
    online: bool = True
    error: str | None = None
    variants: list[HfModelVariant] = Field(default_factory=list)


class CatalogModelRecord(BaseModel):
    id: str
    source: str = 'builtin'
    model_id: str
    display_name: str
    description: str
    tags: list[str] = Field(default_factory=list)
    size_label: str | None = None
    parameter_count_b: float | None = None
    default_dtype: str = 'auto'
    suggested_max_model_len: int | None = None
    suggested_gpu_memory_utilization: float = 0.92
    gated: bool = False
    trust_remote_code: bool = False
    notes: str | None = None
    downloads: int | None = None
    likes: int | None = None
    pipeline_tag: str | None = None
    last_modified: str | None = None
    trending_score: int | None = None


class ModelHubSummary(BaseModel):
    catalog: list[CatalogModelRecord]
    registered_model_ids: list[str]
    running_model_ids: list[str]
    active_download_model_ids: list[str]


class CatalogDownloadRequest(BaseModel):
    dry_run: bool = True
    register_model: bool = True
    local_dir: str | None = None
    revision: str | None = None
    hf_token_env: str | None = 'HF_TOKEN'
    variant_path: str | None = None
    variant_format: str | None = None
    quantization: str | None = None
    allow_patterns: list[str] = Field(default_factory=list)


class CatalogRegisterRequest(BaseModel):
    local_path: str | None = None


class QuickLaunchRequest(BaseModel):
    name: str | None = None
    host: str = '127.0.0.1'
    port: int = 8000
    api_key: str | None = None
    served_model_name: str | None = None
    dtype: str = 'auto'
    gpu_memory_utilization: float | None = None
    max_model_len: int | None = None
    kv_cache_memory_bytes: str | None = None
    tensor_parallel_size: int | None = None
    pipeline_parallel_size: int | None = None
    trust_remote_code: bool | None = None
    enable_auto_tool_choice: bool | None = None
    tool_call_parser: str | None = None
    reasoning_parser: str | None = None
    extra_args: list[str] = Field(default_factory=list)
    start: bool = False
    reuse_existing: bool = True
    force_new: bool = False




class HfCatalogSearchResponse(ModelHubSummary):
    query: str = ''
    hf_token_env: str | None = None
    online: bool = True
    error: str | None = None
    mode: str = 'trending'
    task: str | None = 'llm'
    author: str | None = None
    filters: list[str] = Field(default_factory=list)


class HfCatalogActionRequest(BaseModel):
    model_id: str
    display_name: str | None = None
    tags: list[str] = Field(default_factory=list)
    local_path: str | None = None
    revision: str | None = None
    local_dir: str | None = None
    dry_run: bool = True
    register_model: bool = True
    hf_token_env: str | None = 'HF_TOKEN'
    variant_path: str | None = None
    variant_format: str | None = None
    quantization: str | None = None
    allow_patterns: list[str] = Field(default_factory=list)


class HfQuickLaunchRequest(QuickLaunchRequest):
    model_id: str
    display_name: str | None = None
    tags: list[str] = Field(default_factory=list)
    variant_path: str | None = None
    variant_format: str | None = None
    quantization: str | None = None
    allow_patterns: list[str] = Field(default_factory=list)


class QuickLaunchResponse(BaseModel):
    instance_id: str
    instance_name: str
    started: bool
    start_requested: bool = False
    start_error: str | None = None
    message: str | None = None
    config: VllmServeConfig
    reused_existing: bool = False
    action: str = 'created'
