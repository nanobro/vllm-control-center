from pydantic import BaseModel, field_validator

from app.schemas.instances import VllmServeConfig


class RecipeRecord(BaseModel):
    id: str
    name: str
    description: str | None = None
    preset_type: str = 'custom'
    config: VllmServeConfig
    created_by: str = 'user'
    created_at: str
    updated_at: str


class CreateRecipeRequest(BaseModel):
    name: str
    description: str | None = None
    preset_type: str = 'custom'
    config: VllmServeConfig

    @field_validator('name')
    @classmethod
    def name_not_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError('name cannot be empty')
        return value


class UpdateRecipeRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    preset_type: str | None = None
    config: VllmServeConfig | None = None
