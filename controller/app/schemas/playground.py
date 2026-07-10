from typing import Any, Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal['system', 'user', 'assistant', 'tool']
    content: str


class PlaygroundChatRequest(BaseModel):
    instance_id: str
    messages: list[ChatMessage]
    temperature: float = Field(default=0.7, ge=0, le=2)
    top_p: float = Field(default=0.95, ge=0, le=1)
    max_tokens: int | None = Field(default=512, ge=1)
    model_override: str | None = None
    stream: bool = False
    extra_body: dict[str, Any] = Field(default_factory=dict)
    session_id: str | None = None


class PlaygroundChatResponse(BaseModel):
    ok: bool
    status_code: int
    latency_ms: int
    response: dict[str, Any] | None = None
    error: str | None = None
    error_type: str | None = None
    user_message: str | None = None
    next_actions: list[str] = Field(default_factory=list)
    served_model_names: list[str] = Field(default_factory=list)
    suggested_model_name: str | None = None
