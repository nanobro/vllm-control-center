from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.db import dumps_json, execute, fetchall, fetchone, loads_json
from app.schemas.chat import AddChatMessageRequest, ChatMessageRecord, ChatSessionRecord, CreateChatSessionRequest

router = APIRouter(tags=['chat-history'])


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def row_to_session(row: dict) -> ChatSessionRecord:
    return ChatSessionRecord(
        id=row['id'],
        title=row['title'],
        instance_id=row.get('instance_id'),
        model=row.get('model'),
        sampling=loads_json(row['sampling_json']),
        created_at=row['created_at'],
        updated_at=row['updated_at'],
    )


def row_to_message(row: dict) -> ChatMessageRecord:
    return ChatMessageRecord(
        id=row['id'],
        session_id=row['session_id'],
        role=row['role'],
        content=row['content'],
        raw=loads_json(row['raw_json']) if row.get('raw_json') else None,
        created_at=row['created_at'],
    )


@router.get('/sessions', response_model=list[ChatSessionRecord])
async def list_sessions():
    rows = await fetchall('SELECT * FROM chat_sessions ORDER BY updated_at DESC')
    return [row_to_session(row) for row in rows]


@router.post('/sessions', response_model=ChatSessionRecord)
async def create_session(req: CreateChatSessionRequest):
    session_id = str(uuid4())
    ts = now_iso()
    await execute(
        '''
        INSERT INTO chat_sessions(id, title, instance_id, model, sampling_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''',
        (session_id, req.title, req.instance_id, req.model, dumps_json(req.sampling), ts, ts),
    )
    row = await fetchone('SELECT * FROM chat_sessions WHERE id = ?', (session_id,))
    assert row is not None
    return row_to_session(row)


@router.get('/sessions/{session_id}/messages', response_model=list[ChatMessageRecord])
async def list_messages(session_id: str):
    session = await fetchone('SELECT id FROM chat_sessions WHERE id = ?', (session_id,))
    if not session:
        raise HTTPException(status_code=404, detail='session not found')
    rows = await fetchall('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC', (session_id,))
    return [row_to_message(row) for row in rows]


@router.post('/sessions/{session_id}/messages', response_model=ChatMessageRecord)
async def add_message(session_id: str, req: AddChatMessageRequest):
    session = await fetchone('SELECT id FROM chat_sessions WHERE id = ?', (session_id,))
    if not session:
        raise HTTPException(status_code=404, detail='session not found')
    message_id = str(uuid4())
    ts = now_iso()
    await execute(
        '''
        INSERT INTO chat_messages(id, session_id, role, content, raw_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ''',
        (message_id, session_id, req.role, req.content, dumps_json(req.raw) if req.raw is not None else None, ts),
    )
    await execute('UPDATE chat_sessions SET updated_at = ? WHERE id = ?', (ts, session_id))
    row = await fetchone('SELECT * FROM chat_messages WHERE id = ?', (message_id,))
    assert row is not None
    return row_to_message(row)


@router.delete('/sessions/{session_id}')
async def delete_session(session_id: str):
    row = await fetchone('SELECT id FROM chat_sessions WHERE id = ?', (session_id,))
    if not row:
        raise HTTPException(status_code=404, detail='session not found')
    await execute('DELETE FROM chat_messages WHERE session_id = ?', (session_id,))
    await execute('DELETE FROM chat_sessions WHERE id = ?', (session_id,))
    return {'ok': True}
