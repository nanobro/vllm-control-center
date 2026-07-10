from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.instances import InstanceRecord, VllmServeConfig


class LocalModelRecord(BaseModel):
    id: str
    model_id: str
    display_name: str
    source: str
    local_path: str | None = None
    size_bytes: int | None = None
    size_label: str | None = None
    tags: list[str] = Field(default_factory=list)
    format: str | None = None
    quantization: str | None = None
    architecture: str | None = None
    context_length: int | None = None
    parameter_count_b: float | None = None
    variant_count: int | None = None
    file_count: int | None = None
    weight_file_count: int | None = None
    is_multi_file: bool = False
    config_present: bool = False
    tokenizer_present: bool | None = None
    dtype_hint: str | None = None
    compatibility_status: str = 'unknown'
    compatibility_label: str | None = None
    compatibility_reasons: list[str] = Field(default_factory=list)
    suggested_load_format: str | None = None
    metadata_warnings: list[str] = Field(default_factory=list)
    registered_model_id: str | None = None
    download_job_id: str | None = None
    download_status: str | None = None
    active_instance_id: str | None = None
    active_status: str | None = None
    active_last_error: str | None = None
    matching_instance_ids: list[str] = Field(default_factory=list)
    running_instance_ids: list[str] = Field(default_factory=list)
    stopped_instance_ids: list[str] = Field(default_factory=list)
    loaded_instance_count: int = 0
    configured_instance_count: int = 0
    last_modified: str | None = None
    group_id: str | None = None
    group_name: str | None = None
    variant_label: str | None = None
    variant_rank: int = 100
    sibling_variant_count: int = 1
    notes: str | None = None


class LocalModelVariantGroup(BaseModel):
    id: str
    name: str
    model_id: str
    display_name: str
    variants: list[LocalModelRecord] = Field(default_factory=list)
    preferred_variant_id: str | None = None
    loaded_variant_id: str | None = None
    loaded_instance_count: int = 0
    configured_instance_count: int = 0
    total_size_bytes: int | None = None
    total_size_label: str | None = None
    sources: list[str] = Field(default_factory=list)
    formats: list[str] = Field(default_factory=list)
    quantizations: list[str] = Field(default_factory=list)
    local_paths: list[str] = Field(default_factory=list)


class LocalModelScanRoot(BaseModel):
    path: str
    source: str
    exists: bool
    model_count: int = 0
    warnings: list[str] = Field(default_factory=list)


class LocalModelScanRootsSummary(BaseModel):
    roots: list[LocalModelScanRoot]
    user_paths: list[str]
    warnings: list[str] = Field(default_factory=list)


class AddLocalModelScanRootRequest(BaseModel):
    path: str


class LocalModelsSummary(BaseModel):
    models: list[LocalModelRecord]
    groups: list[LocalModelVariantGroup] = Field(default_factory=list)
    loaded_instance_ids: list[str]
    scanned_paths: list[str]
    warnings: list[str] = Field(default_factory=list)
    scan_roots: list[LocalModelScanRoot] = Field(default_factory=list)


class LocalModelGroupsSummary(BaseModel):
    groups: list[LocalModelVariantGroup]
    scanned_paths: list[str]
    warnings: list[str] = Field(default_factory=list)
    scan_roots: list[LocalModelScanRoot] = Field(default_factory=list)


class LoadLocalModelRequest(BaseModel):
    model_id: str
    local_path: str | None = None
    name: str | None = None
    host: str = '127.0.0.1'
    port: int = 8000
    api_key: str | None = None
    served_model_name: str | None = None
    dtype: str = 'auto'
    gpu_memory_utilization: float = 0.92
    max_model_len: int | None = None
    kv_cache_memory_bytes: str | None = None
    tensor_parallel_size: int | None = None
    pipeline_parallel_size: int | None = None
    trust_remote_code: bool = False
    enable_auto_tool_choice: bool = False
    tool_call_parser: str | None = None
    reasoning_parser: str | None = None
    extra_args: list[str] = Field(default_factory=list)
    start: bool = True
    reuse_existing: bool = True
    force_new: bool = False
    load_preset: Literal['balanced', 'low_vram'] = 'balanced'


class LoadLocalModelResponse(BaseModel):
    instance_id: str
    instance_name: str
    loaded: bool
    start_requested: bool = False
    start_error: str | None = None
    config: VllmServeConfig
    instance: InstanceRecord
    reused_existing: bool = False
    action: str = 'created'
    message: str | None = None
    applied_preset: str | None = None
