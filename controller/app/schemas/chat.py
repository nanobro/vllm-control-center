from typing import Any, Literal

from pydantic import BaseModel, Field


class ChatSessionRecord(BaseModel):
    id: str
    title: str
    instance_id: str | None = None
    model: str | None = None
    sampling: dict[str, Any] = Field(default_factory=dict)
    created_at: str
    updated_at: str


class ChatMessageRecord(BaseModel):
    id: str
    session_id: str
    role: Literal['system', 'user', 'assistant', 'tool']
    content: str
    raw: dict[str, Any] | None = None
    created_at: str


class CreateChatSessionRequest(BaseModel):
    title: str = 'New chat'
    instance_id: str | None = None
    model: str | None = None
    sampling: dict[str, Any] = Field(default_factory=dict)


class AddChatMessageRequest(BaseModel):
    role: Literal['system', 'user', 'assistant', 'tool']
    content: str
    raw: dict[str, Any] | None = None
