from __future__ import annotations

from pydantic import BaseModel, Field


class ServerQaCheck(BaseModel):
    id: str
    title: str
    status: str
    message: str
    action: str | None = None


class ServerQaSummary(BaseModel):
    ready_to_load: bool
    checks: list[ServerQaCheck] = Field(default_factory=list)
    active_downloads: int = 0
    completed_downloads: int = 0
    local_model_count: int = 0
    running_instances: int = 0
    stopped_instances: int = 0
    scanned_paths: list[str] = Field(default_factory=list)
