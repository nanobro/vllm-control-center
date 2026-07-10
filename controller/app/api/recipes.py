from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.db import dumps_json, execute, fetchall, fetchone, loads_json
from app.schemas.instances import CreateInstanceRequest, VllmServeConfig
from app.schemas.recipes import CreateRecipeRequest, RecipeRecord, UpdateRecipeRequest

router = APIRouter(tags=['recipes'])


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def row_to_recipe(row: dict) -> RecipeRecord:
    return RecipeRecord(
        id=row['id'],
        name=row['name'],
        description=row.get('description'),
        preset_type=row['preset_type'],
        config=VllmServeConfig(**loads_json(row['config_json'])),
        created_by=row['created_by'],
        created_at=row['created_at'],
        updated_at=row['updated_at'],
    )


@router.get('', response_model=list[RecipeRecord])
async def list_recipes():
    rows = await fetchall('SELECT * FROM recipes ORDER BY updated_at DESC')
    return [row_to_recipe(row) for row in rows]


@router.post('', response_model=RecipeRecord)
async def create_recipe(req: CreateRecipeRequest):
    recipe_id = str(uuid4())
    ts = now_iso()
    await execute(
        '''
        INSERT INTO recipes(id, name, description, preset_type, config_json, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (recipe_id, req.name, req.description, req.preset_type, dumps_json(req.config.model_dump()), 'user', ts, ts),
    )
    row = await fetchone('SELECT * FROM recipes WHERE id = ?', (recipe_id,))
    assert row is not None
    return row_to_recipe(row)


@router.patch('/{recipe_id}', response_model=RecipeRecord)
async def update_recipe(recipe_id: str, req: UpdateRecipeRequest):
    row = await fetchone('SELECT * FROM recipes WHERE id = ?', (recipe_id,))
    if not row:
        raise HTTPException(status_code=404, detail='recipe not found')
    current = row_to_recipe(row)
    await execute(
        '''
        UPDATE recipes SET name = ?, description = ?, preset_type = ?, config_json = ?, updated_at = ?
        WHERE id = ?
        ''',
        (
            req.name if req.name is not None else current.name,
            req.description if req.description is not None else current.description,
            req.preset_type if req.preset_type is not None else current.preset_type,
            dumps_json((req.config or current.config).model_dump()),
            now_iso(),
            recipe_id,
        ),
    )
    updated = await fetchone('SELECT * FROM recipes WHERE id = ?', (recipe_id,))
    assert updated is not None
    return row_to_recipe(updated)


@router.post('/{recipe_id}/create-instance')
async def create_instance_from_recipe(recipe_id: str, name: str | None = None):
    from app.api.instances import create_instance

    row = await fetchone('SELECT * FROM recipes WHERE id = ?', (recipe_id,))
    if not row:
        raise HTTPException(status_code=404, detail='recipe not found')
    recipe = row_to_recipe(row)
    return await create_instance(CreateInstanceRequest(name=name or recipe.name, config=recipe.config))


@router.delete('/{recipe_id}')
async def delete_recipe(recipe_id: str):
    row = await fetchone('SELECT id FROM recipes WHERE id = ?', (recipe_id,))
    if not row:
        raise HTTPException(status_code=404, detail='recipe not found')
    await execute('DELETE FROM recipes WHERE id = ?', (recipe_id,))
    return {'ok': True}
