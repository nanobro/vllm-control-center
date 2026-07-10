from typing import Literal

from pydantic import BaseModel, Field, field_validator

DownloadStatus = Literal['queued', 'running', 'completed', 'failed', 'cancelled']


class CreateDownloadJobRequest(BaseModel):
    model_id: str
    revision: str | None = None
    local_dir: str | None = None
    hf_token: str | None = Field(default=None, repr=False)
    hf_token_env: str | None = None
    register_model: bool = True
    dry_run: bool = False
    allow_patterns: list[str] = Field(default_factory=list)

    @field_validator('model_id')
    @classmethod
    def model_id_not_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError('model_id cannot be empty')
        return value

    @field_validator('revision', 'local_dir', 'hf_token_env')
    @classmethod
    def empty_string_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class DownloadJobRecord(BaseModel):
    id: str
    model_id: str
    revision: str | None = None
    local_dir: str | None = None
    status: DownloadStatus
    register_model: bool = True
    dry_run: bool = False
    allow_patterns: list[str] = Field(default_factory=list)
    downloaded_bytes: int | None = None
    total_bytes: int | None = None
    current_file: str | None = None
    message: str | None = None
    error: str | None = None
    registered_model_id: str | None = None
    created_at: str
    updated_at: str
    started_at: str | None = None
    completed_at: str | None = None


class CancelDownloadJobResponse(BaseModel):
    ok: bool
    status: DownloadStatus
    message: str



class RetryDownloadJobRequest(BaseModel):
    dry_run: bool | None = None
    hf_token: str | None = Field(default=None, repr=False)
    hf_token_env: str | None = None

    @field_validator('hf_token_env')
    @classmethod
    def env_name_safe(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            return None
        if not value.replace('_', '').isalnum():
            raise ValueError('hf_token_env must be an environment variable name')
        return value


class DeleteDownloadJobResponse(BaseModel):
    ok: bool
    deleted: bool
    message: str


class RetryDownloadJobResponse(BaseModel):
    ok: bool
    job: DownloadJobRecord


class ReconcileDownloadsResponse(BaseModel):
    ok: bool
    reconciled: int
    message: str
