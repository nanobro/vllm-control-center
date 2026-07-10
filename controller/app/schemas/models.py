from pydantic import BaseModel, Field, field_validator


class ModelRecord(BaseModel):
    id: str
    source: str
    model_id: str
    local_path: str | None = None
    display_name: str
    context_length: int | None = None
    dtype_hint: str | None = None
    tags: list[str] = Field(default_factory=list)
    notes: str | None = None
    created_at: str
    updated_at: str


class CreateModelRequest(BaseModel):
    source: str = 'huggingface'
    model_id: str
    local_path: str | None = None
    display_name: str | None = None
    context_length: int | None = None
    dtype_hint: str | None = None
    tags: list[str] = Field(default_factory=list)
    notes: str | None = None

    @field_validator('model_id')
    @classmethod
    def model_id_not_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError('model_id cannot be empty')
        return value


class UpdateModelRequest(BaseModel):
    display_name: str | None = None
    context_length: int | None = None
    dtype_hint: str | None = None
    tags: list[str] | None = None
    notes: str | None = None
