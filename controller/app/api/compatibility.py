from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter

from app.core.compatibility import estimate_compatibility
from app.db import dumps_json, execute, fetchone
from app.schemas.compatibility import CompatibilityRequest, CompatibilityResponse, CreateRecipeFromCompatibilityRequest
from app.schemas.instances import VllmServeConfig
from app.schemas.recipes import RecipeRecord
from app.api.recipes import row_to_recipe

router = APIRouter(tags=['compatibility'])


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post('/estimate', response_model=CompatibilityResponse)
async def estimate(req: CompatibilityRequest):
    return estimate_compatibility(req)


@router.post('/recipe', response_model=RecipeRecord)
async def create_recipe_from_compatibility(req: CreateRecipeFromCompatibilityRequest):
    recipe_id = str(uuid4())
    ts = now_iso()
    extra_args = list(req.extra_args)
    if req.cache_dtype != 'auto' and '--kv-cache-dtype' not in extra_args:
        extra_args.extend(['--kv-cache-dtype', req.cache_dtype])
    config = VllmServeConfig(
        model=req.model_id,
        dtype=req.dtype,
        max_model_len=req.max_model_len,
        gpu_memory_utilization=req.gpu_memory_utilization,
        tensor_parallel_size=req.tensor_parallel_size,
        extra_args=extra_args,
    )
    await execute(
        '''
        INSERT INTO recipes(id, name, description, preset_type, config_json, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (
            recipe_id,
            req.name,
            'Created from Model Compatibility Advisor.',
            'compatibility_advisor',
            dumps_json(config.model_dump()),
            'system',
            ts,
            ts,
        ),
    )
    row = await fetchone('SELECT * FROM recipes WHERE id = ?', (recipe_id,))
    assert row is not None
    return row_to_recipe(row)
