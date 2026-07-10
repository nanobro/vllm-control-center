from typing import Literal

from pydantic import BaseModel, Field, field_validator

InstanceStatus = Literal["stopped", "starting", "running", "stopping", "crashed"]


class VllmServeConfig(BaseModel):
    model: str
    host: str = "127.0.0.1"
    port: int = 8000
    api_key: str | None = None
    served_model_name: str | None = None
    dtype: str = "auto"
    max_model_len: int | None = None
    gpu_memory_utilization: float = 0.92
    kv_cache_memory_bytes: str | None = None
    tensor_parallel_size: int | None = None
    pipeline_parallel_size: int | None = None
    data_parallel_size: int | None = None
    device_ids: list[int] | None = None
    trust_remote_code: bool = False
    enable_auto_tool_choice: bool = False
    tool_call_parser: str | None = None
    reasoning_parser: str | None = None
    extra_args: list[str] = Field(default_factory=list)

    @field_validator("model")
    @classmethod
    def model_not_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("model cannot be empty")
        return value

    @field_validator("port")
    @classmethod
    def valid_port(cls, value: int) -> int:
        if value < 1 or value > 65535:
            raise ValueError("port must be between 1 and 65535")
        return value

    @field_validator("gpu_memory_utilization")
    @classmethod
    def valid_gpu_memory_utilization(cls, value: float) -> float:
        if value <= 0 or value > 1:
            raise ValueError("gpu_memory_utilization must be > 0 and <= 1")
        return value

    @field_validator("extra_args")
    @classmethod
    def no_shell_separators(cls, value: list[str]) -> list[str]:
        bad = [";", "&&", "||", "|", "`", "$("]
        for arg in value:
            if any(token in arg for token in bad):
                raise ValueError(f"extra arg contains unsafe shell token: {arg}")
        return value


class CreateInstanceRequest(BaseModel):
    name: str
    config: VllmServeConfig


class InstanceRecord(BaseModel):
    id: str
    name: str
    status: InstanceStatus
    host: str
    port: int
    config: VllmServeConfig
    pid: int | None = None
    started_at: str | None = None
    stopped_at: str | None = None
    last_error: str | None = None
    created_at: str
    updated_at: str


class CommandPreview(BaseModel):
    argv: list[str]
    redacted_command: str
    yaml_config: str
    docker_command: str
    docker_compose: str


class LogLine(BaseModel):
    id: int
    instance_id: str
    stream: str
    line: str
    created_at: str
