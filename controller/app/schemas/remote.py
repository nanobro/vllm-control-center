from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field, HttpUrl, field_validator


def now_iso() -> str:
    return datetime.now(UTC).isoformat().replace('+00:00', 'Z')


class RemoteControllerProfileCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    base_url: HttpUrl
    api_key: str | None = None
    notes: str | None = None
    is_default: bool = False

    @field_validator('base_url')
    @classmethod
    def strip_trailing_slash(cls, value: HttpUrl) -> HttpUrl:
        return value


class RemoteControllerProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    base_url: HttpUrl | None = None
    api_key: str | None = None
    clear_api_key: bool = False
    notes: str | None = None
    is_default: bool | None = None


class RemoteControllerProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    base_url: str
    api_key_configured: bool = False
    notes: str | None = None
    is_default: bool = False
    last_status: str | None = None
    last_latency_ms: float | None = None
    last_error: str | None = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class RemoteControllerPrivate(RemoteControllerProfile):
    api_key: str | None = None


class RemoteControllerProbeResult(BaseModel):
    ok: bool
    status_code: int | None = None
    latency_ms: float | None = None
    health: dict[str, Any] | None = None
    doctor: dict[str, Any] | None = None
    error: str | None = None


class RemoteForwardRequest(BaseModel):
    method: str = Field(default='GET', pattern='^(GET|POST|PUT|PATCH|DELETE)$')
    path: str = Field(min_length=1)
    body: dict[str, Any] | None = None

    @field_validator('path')
    @classmethod
    def validate_path(cls, value: str) -> str:
        if not value.startswith('/api/'):
            raise ValueError('remote forwarded paths must start with /api/')
        if '://' in value or '..' in value:
            raise ValueError('remote forwarded path must be relative and safe')
        return value


class RemotePlaygroundChatRequest(BaseModel):
    messages: list[dict[str, str]] = Field(default_factory=list)
    temperature: float = Field(default=0.7, ge=0, le=2)
    top_p: float = Field(default=0.95, ge=0, le=1)
    max_tokens: int | None = Field(default=512, ge=1)
    model_override: str | None = None
    extra_body: dict[str, Any] = Field(default_factory=dict)
    session_id: str | None = None

