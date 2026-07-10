from __future__ import annotations

from datetime import UTC, datetime
from urllib.parse import unquote
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse

from app.config import settings
from app.core.remote_client import forward_remote_request, forward_remote_stream, probe_remote_controller
from app.core.secrets import (
    delete_secret_value,
    get_secret_value,
    has_secret_value,
    remote_profile_api_key_secret_key,
    set_secret_value,
)
from app.db import execute, fetchall, fetchone
from app.schemas.remote import (
    RemoteControllerPrivate,
    RemoteControllerProfile,
    RemoteControllerProfileCreate,
    RemoteControllerProfileUpdate,
    RemoteControllerProbeResult,
    RemoteForwardRequest,
    RemotePlaygroundChatRequest,
)

router = APIRouter(tags=['remote controllers'])


def now_iso() -> str:
    return datetime.now(UTC).isoformat().replace('+00:00', 'Z')


def _public_from_row(row: dict, api_key_configured: bool) -> RemoteControllerProfile:
    return RemoteControllerProfile(
        id=row['id'],
        name=row['name'],
        base_url=row['base_url'],
        api_key_configured=api_key_configured,
        notes=row.get('notes'),
        is_default=bool(row.get('is_default')),
        last_status=row.get('last_status'),
        last_latency_ms=row.get('last_latency_ms'),
        last_error=row.get('last_error'),
        created_at=row['created_at'],
        updated_at=row['updated_at'],
    )


async def _public(row: dict) -> RemoteControllerProfile:
    # v12 reads remote profile API key state from the secrets table. The legacy
    # api_key column is checked only for backward compatibility with databases
    # that have not yet run init_db() migration.
    key = remote_profile_api_key_secret_key(row['id'])
    configured = await has_secret_value(key) or bool(row.get('api_key'))
    return _public_from_row(row, configured)


async def _private(row: dict) -> RemoteControllerPrivate:
    public = await _public(row)
    key = remote_profile_api_key_secret_key(row['id'])
    api_key = await get_secret_value(key)
    if api_key is None:
        api_key = row.get('api_key')
    return RemoteControllerPrivate(**public.model_dump(), api_key=api_key)


async def _get_private(profile_id: str) -> RemoteControllerPrivate:
    row = await fetchone('SELECT * FROM remote_controller_profiles WHERE id = ?', (profile_id,))
    if not row:
        raise HTTPException(status_code=404, detail='Remote controller profile not found')
    return await _private(row)


async def _set_default(profile_id: str) -> None:
    await execute('UPDATE remote_controller_profiles SET is_default = 0')
    await execute('UPDATE remote_controller_profiles SET is_default = 1, updated_at = ? WHERE id = ?', (now_iso(), profile_id))


@router.get('', response_model=list[RemoteControllerProfile])
async def list_remote_profiles() -> list[RemoteControllerProfile]:
    rows = await fetchall('SELECT * FROM remote_controller_profiles ORDER BY is_default DESC, created_at DESC')
    return [await _public(row) for row in rows]


@router.post('', response_model=RemoteControllerProfile)
async def create_remote_profile(payload: RemoteControllerProfileCreate) -> RemoteControllerProfile:
    profile_id = str(uuid4())
    created = now_iso()
    if payload.is_default:
        await execute('UPDATE remote_controller_profiles SET is_default = 0')
    await execute(
        '''INSERT INTO remote_controller_profiles
           (id, name, base_url, api_key, notes, is_default, last_status, last_latency_ms, last_error, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (
            profile_id,
            payload.name,
            str(payload.base_url).rstrip('/'),
            None,
            payload.notes,
            1 if payload.is_default else 0,
            None,
            None,
            None,
            created,
            created,
        ),
    )
    if payload.api_key:
        await set_secret_value(
            remote_profile_api_key_secret_key(profile_id),
            payload.api_key,
            notes=f'API key for remote controller profile {profile_id}',
        )
    profile = await _get_private(profile_id)
    return RemoteControllerProfile(**profile.model_dump(exclude={'api_key'}))


@router.patch('/{profile_id}', response_model=RemoteControllerProfile)
async def update_remote_profile(profile_id: str, payload: RemoteControllerProfileUpdate) -> RemoteControllerProfile:
    existing = await _get_private(profile_id)
    data = payload.model_dump(exclude_unset=True)
    name = data.get('name', existing.name)
    base_url = str(data.get('base_url', existing.base_url)).rstrip('/')
    notes = data.get('notes', existing.notes)
    is_default = existing.is_default if 'is_default' not in data else bool(data['is_default'])
    if is_default:
        await execute('UPDATE remote_controller_profiles SET is_default = 0')
    await execute(
        '''UPDATE remote_controller_profiles
           SET name = ?, base_url = ?, api_key = NULL, notes = ?, is_default = ?, updated_at = ?
           WHERE id = ?''',
        (name, base_url, notes, 1 if is_default else 0, now_iso(), profile_id),
    )
    secret_key = remote_profile_api_key_secret_key(profile_id)
    if data.get('clear_api_key'):
        await delete_secret_value(secret_key)
    elif 'api_key' in data:
        await set_secret_value(secret_key, data.get('api_key'), notes=f'API key for remote controller profile {profile_id}')
    updated = await _get_private(profile_id)
    return RemoteControllerProfile(**updated.model_dump(exclude={'api_key'}))


@router.delete('/{profile_id}')
async def delete_remote_profile(profile_id: str) -> dict[str, bool]:
    await _get_private(profile_id)
    await execute('DELETE FROM remote_controller_profiles WHERE id = ?', (profile_id,))
    await delete_secret_value(remote_profile_api_key_secret_key(profile_id))
    return {'ok': True}


@router.post('/{profile_id}/set-default', response_model=RemoteControllerProfile)
async def set_default_remote_profile(profile_id: str) -> RemoteControllerProfile:
    await _get_private(profile_id)
    await _set_default(profile_id)
    updated = await _get_private(profile_id)
    return RemoteControllerProfile(**updated.model_dump(exclude={'api_key'}))


@router.post('/{profile_id}/probe', response_model=RemoteControllerProbeResult)
async def probe_remote_profile(profile_id: str) -> RemoteControllerProbeResult:
    profile = await _get_private(profile_id)
    result = await probe_remote_controller(profile)
    await execute(
        '''UPDATE remote_controller_profiles
           SET last_status = ?, last_latency_ms = ?, last_error = ?, updated_at = ?
           WHERE id = ?''',
        ('online' if result.ok else 'offline', result.latency_ms, result.error, now_iso(), profile_id),
    )
    return result


@router.post('/{profile_id}/forward')
async def forward_to_remote(profile_id: str, payload: RemoteForwardRequest) -> JSONResponse:
    if not settings.allow_remote_forwarding:
        raise HTTPException(
            status_code=403,
            detail='Generic remote forwarding is disabled. Use the dedicated remote bridge routes or set VCC_ALLOW_REMOTE_FORWARDING=true for development.',
        )
    profile = await _get_private(profile_id)
    status, content = await forward_remote_request(profile, payload.method, payload.path, payload.body)
    return JSONResponse(status_code=status, content=content)


def _remote_instance_path(instance_id: str, suffix: str = '') -> str:
    decoded_id = unquote(instance_id)
    if '/' in decoded_id or '\\' in decoded_id or '..' in decoded_id:
        raise HTTPException(status_code=400, detail='Invalid remote instance id')
    return f'/api/instances/{instance_id}{suffix}'


def _remote_playground_body(remote_instance_id: str, payload: RemotePlaygroundChatRequest, stream: bool = False) -> dict:
    # Validate the remote instance id with the same guard used by other bridge routes.
    _remote_instance_path(remote_instance_id)
    return {
        'instance_id': remote_instance_id,
        'messages': payload.messages,
        'temperature': payload.temperature,
        'top_p': payload.top_p,
        'max_tokens': payload.max_tokens,
        'model_override': payload.model_override,
        'stream': stream,
        'extra_body': payload.extra_body,
        'session_id': payload.session_id,
    }


@router.get('/{profile_id}/instances')
async def list_remote_instances(profile_id: str) -> JSONResponse:
    """List instances on the selected remote controller."""
    profile = await _get_private(profile_id)
    status, content = await forward_remote_request(profile, 'GET', '/api/instances')
    return JSONResponse(status_code=status, content=content)


@router.get('/{profile_id}/instances/{remote_instance_id}')
async def get_remote_instance(profile_id: str, remote_instance_id: str) -> JSONResponse:
    profile = await _get_private(profile_id)
    status, content = await forward_remote_request(profile, 'GET', _remote_instance_path(remote_instance_id))
    return JSONResponse(status_code=status, content=content)


@router.get('/{profile_id}/instances/{remote_instance_id}/command')
async def remote_instance_command(profile_id: str, remote_instance_id: str) -> JSONResponse:
    profile = await _get_private(profile_id)
    status, content = await forward_remote_request(profile, 'GET', _remote_instance_path(remote_instance_id, '/command'))
    return JSONResponse(status_code=status, content=content)


@router.post('/{profile_id}/instances/{remote_instance_id}/start')
async def start_remote_instance(profile_id: str, remote_instance_id: str) -> JSONResponse:
    profile = await _get_private(profile_id)
    status, content = await forward_remote_request(profile, 'POST', _remote_instance_path(remote_instance_id, '/start'))
    return JSONResponse(status_code=status, content=content)


@router.post('/{profile_id}/instances/{remote_instance_id}/stop')
async def stop_remote_instance(profile_id: str, remote_instance_id: str) -> JSONResponse:
    profile = await _get_private(profile_id)
    status, content = await forward_remote_request(profile, 'POST', _remote_instance_path(remote_instance_id, '/stop'))
    return JSONResponse(status_code=status, content=content)


@router.post('/{profile_id}/instances/{remote_instance_id}/restart')
async def restart_remote_instance(profile_id: str, remote_instance_id: str) -> JSONResponse:
    profile = await _get_private(profile_id)
    status, content = await forward_remote_request(profile, 'POST', _remote_instance_path(remote_instance_id, '/restart'))
    return JSONResponse(status_code=status, content=content)


@router.get('/{profile_id}/instances/{remote_instance_id}/metrics')
async def remote_instance_metrics(profile_id: str, remote_instance_id: str) -> JSONResponse:
    profile = await _get_private(profile_id)
    status, content = await forward_remote_request(profile, 'GET', _remote_instance_path(remote_instance_id, '/metrics'))
    return JSONResponse(status_code=status, content=content)


@router.get('/{profile_id}/instances/{remote_instance_id}/logs')
async def remote_instance_logs(profile_id: str, remote_instance_id: str, tail: int = 200) -> JSONResponse:
    profile = await _get_private(profile_id)
    safe_tail = max(1, min(int(tail), 5000))
    status, content = await forward_remote_request(profile, 'GET', _remote_instance_path(remote_instance_id, f'/logs?tail={safe_tail}'))
    return JSONResponse(status_code=status, content=content)


@router.get('/{profile_id}/instances/{remote_instance_id}/logs/stream')
async def remote_instance_log_stream(profile_id: str, remote_instance_id: str, after_id: int = 0) -> StreamingResponse:
    profile = await _get_private(profile_id)
    safe_after = max(0, int(after_id))
    path = _remote_instance_path(remote_instance_id, f'/logs/stream?after_id={safe_after}')
    return StreamingResponse(forward_remote_stream(profile, 'GET', path), media_type='text/event-stream')


@router.post('/{profile_id}/instances/{remote_instance_id}/playground/chat')
async def remote_instance_playground_chat(
    profile_id: str,
    remote_instance_id: str,
    payload: RemotePlaygroundChatRequest,
) -> JSONResponse:
    profile = await _get_private(profile_id)
    body = _remote_playground_body(remote_instance_id, payload, stream=False)
    status, content = await forward_remote_request(profile, 'POST', '/api/playground/chat', body, timeout_s=180.0)
    return JSONResponse(status_code=status, content=content)


@router.post('/{profile_id}/instances/{remote_instance_id}/playground/chat/stream')
async def remote_instance_playground_chat_stream(
    profile_id: str,
    remote_instance_id: str,
    payload: RemotePlaygroundChatRequest,
) -> StreamingResponse:
    profile = await _get_private(profile_id)
    body = _remote_playground_body(remote_instance_id, payload, stream=True)
    stream = forward_remote_stream(profile, 'POST', '/api/playground/chat/stream', body=body, timeout_s=None)
    return StreamingResponse(stream, media_type='text/event-stream')
