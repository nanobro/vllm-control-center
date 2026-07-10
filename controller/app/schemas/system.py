from pydantic import BaseModel, Field


class CheckResult(BaseModel):
    ok: bool
    message: str
    version: str | None = None
    details: dict = Field(default_factory=dict)


class GpuInfo(BaseModel):
    index: int
    name: str
    memory_total_mb: int | None = None
    memory_used_mb: int | None = None
    utilization_percent: int | None = None
    temperature_c: int | None = None


class DoctorReport(BaseModel):
    python: CheckResult
    vllm: CheckResult
    nvidia: CheckResult
    docker: CheckResult
    hf_token: CheckResult = Field(
        default_factory=lambda: CheckResult(
            ok=False,
            message='Hugging Face token not set. Public models still work; gated/private downloads need HF_TOKEN.',
        )
    )
    gpus: list[GpuInfo] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
