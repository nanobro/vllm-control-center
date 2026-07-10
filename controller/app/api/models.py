from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.db import dumps_json, execute, fetchall, fetchone, loads_json
from app.schemas.models import CreateModelRequest, ModelRecord, UpdateModelRequest

router = APIRouter(tags=['models'])


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def row_to_model(row: dict) -> ModelRecord:
    return ModelRecord(
        id=row['id'],
        source=row['source'],
        model_id=row['model_id'],
        local_path=row.get('local_path'),
        display_name=row['display_name'],
        context_length=row.get('context_length'),
        dtype_hint=row.get('dtype_hint'),
        tags=loads_json(row['tags_json']),
        notes=row.get('notes'),
        created_at=row['created_at'],
        updated_at=row['updated_at'],
    )


@router.get('', response_model=list[ModelRecord])
async def list_models():
    rows = await fetchall('SELECT * FROM models ORDER BY updated_at DESC')
    return [row_to_model(row) for row in rows]


@router.post('', response_model=ModelRecord)
async def create_model(req: CreateModelRequest):
    model_id = str(uuid4())
    ts = now_iso()
    display_name = req.display_name or req.model_id.split('/')[-1]
    await execute(
        '''
        INSERT INTO models(id, source, model_id, local_path, display_name, context_length, dtype_hint, tags_json, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (model_id, req.source, req.model_id, req.local_path, display_name, req.context_length, req.dtype_hint, dumps_json(req.tags), req.notes, ts, ts),
    )
    row = await fetchone('SELECT * FROM models WHERE id = ?', (model_id,))
    assert row is not None
    return row_to_model(row)


@router.patch('/{model_record_id}', response_model=ModelRecord)
async def update_model(model_record_id: str, req: UpdateModelRequest):
    row = await fetchone('SELECT * FROM models WHERE id = ?', (model_record_id,))
    if not row:
        raise HTTPException(status_code=404, detail='model not found')
    current = row_to_model(row)
    display_name = req.display_name if req.display_name is not None else current.display_name
    context_length = req.context_length if req.context_length is not None else current.context_length
    dtype_hint = req.dtype_hint if req.dtype_hint is not None else current.dtype_hint
    tags = req.tags if req.tags is not None else current.tags
    notes = req.notes if req.notes is not None else current.notes
    await execute(
        '''
        UPDATE models SET display_name = ?, context_length = ?, dtype_hint = ?, tags_json = ?, notes = ?, updated_at = ?
        WHERE id = ?
        ''',
        (display_name, context_length, dtype_hint, dumps_json(tags), notes, now_iso(), model_record_id),
    )
    updated = await fetchone('SELECT * FROM models WHERE id = ?', (model_record_id,))
    assert updated is not None
    return row_to_model(updated)


@router.delete('/{model_record_id}')
async def delete_model(model_record_id: str):
    row = await fetchone('SELECT id FROM models WHERE id = ?', (model_record_id,))
    if not row:
        raise HTTPException(status_code=404, detail='model not found')
    await execute('DELETE FROM models WHERE id = ?', (model_record_id,))
    return {'ok': True}
