import json
from time import perf_counter
from uuid import uuid4
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.db import dumps_json, execute, fetchone, loads_json
from app.schemas.instances import VllmServeConfig
from app.schemas.playground import PlaygroundChatRequest, PlaygroundChatResponse

router = APIRouter(tags=['playground'])


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _load_config(instance_id: str) -> tuple[dict, VllmServeConfig]:
    row = await fetchone('SELECT * FROM instances WHERE id = ?', (instance_id,))
    if not row:
        raise HTTPException(status_code=404, detail='instance not found')
    return row, VllmServeConfig(**loads_json(row['config_json']))




def _short_error(value: object, limit: int = 700) -> str:
    text = str(value or '').strip()
    if not text:
        return 'The quick test failed.'
    text = ' '.join(text.split())
    return text[:limit]


def _diagnose_quick_test_failure(error: object = '', status_code: int = 0, body: dict | None = None) -> dict:
    raw = _short_error(error or body or '', limit=1600)
    lowered = raw.lower()
    if status_code == 0:
        if 'connect' in lowered or 'connection refused' in lowered or 'all connection attempts failed' in lowered:
            return {
                'error_type': 'endpoint_not_reachable',
                'user_message': 'The server process is marked running, but the /v1 endpoint did not accept the test request yet.',
                'next_actions': ['Wait a moment and test again', 'Open logs', 'Restart this model'],
            }
        if 'timeout' in lowered or 'timed out' in lowered or 'readtimeout' in lowered:
            return {
                'error_type': 'quick_test_timeout',
                'user_message': 'The endpoint did not answer the quick test before the timeout. The model may still be warming up or overloaded.',
                'next_actions': ['Wait and test again', 'Open logs', 'Use Low VRAM settings if the model is memory-heavy'],
            }
        return {
            'error_type': 'network_error',
            'user_message': 'The quick test could not reach the local vLLM endpoint.',
            'next_actions': ['Check that the selected model is still running', 'Open logs', 'Restart this model'],
        }
    if status_code == 401 or status_code == 403:
        return {
            'error_type': 'auth_failed',
            'user_message': 'The endpoint rejected the quick test because the API key or auth settings do not match.',
            'next_actions': ['Check the API key', 'Open instance settings', 'Restart after changing auth settings'],
        }
    if 'model' in lowered and ('not found' in lowered or 'does not exist' in lowered or 'not served' in lowered):
        return {
            'error_type': 'served_model_name_mismatch',
            'user_message': 'The endpoint is running, but the model name used for the quick test does not match the served model name.',
            'next_actions': ['Use the suggested served model name', 'Open logs', 'Restart this model after changing served name'],
        }
    if status_code == 404:
        return {
            'error_type': 'route_not_found',
            'user_message': 'The server responded, but the OpenAI chat route was not found.',
            'next_actions': ['Confirm this is a vLLM OpenAI-compatible server', 'Open logs', 'Restart this model'],
        }
    if status_code == 400:
        if 'maximum context length' in lowered or 'context' in lowered or 'max_model_len' in lowered:
            return {
                'error_type': 'request_too_large',
                'user_message': 'The quick test request was too large for the current context settings.',
                'next_actions': ['Try fewer max tokens', 'Use Low VRAM settings', 'Open logs'],
            }
        return {
            'error_type': 'bad_request',
            'user_message': 'The endpoint rejected the quick test request.',
            'next_actions': ['Try a shorter prompt', 'Open logs', 'Check model/chat compatibility'],
        }
    if status_code in {408, 409, 425, 429, 500, 502, 503, 504}:
        if 'cuda' in lowered or 'out of memory' in lowered or 'oom' in lowered or 'memory' in lowered:
            return {
                'error_type': 'insufficient_gpu_memory',
                'user_message': 'The test hit a GPU memory problem while the server was running.',
                'next_actions': ['Use Low VRAM settings', 'Open logs', 'Pick a smaller quantization or model'],
            }
        if status_code in {502, 503, 504}:
            return {
                'error_type': 'endpoint_not_ready',
                'user_message': 'The endpoint exists, but it is not ready to answer chat requests yet.',
                'next_actions': ['Wait and test again', 'Open logs', 'Restart this model if it stays stuck'],
            }
        return {
            'error_type': 'server_error',
            'user_message': 'The running endpoint returned an internal error during the quick test.',
            'next_actions': ['Open logs', 'Try Low VRAM settings', 'Restart this model'],
        }
    return {
        'error_type': 'quick_test_failed',
        'user_message': 'The endpoint responded, but the quick test did not succeed.',
        'next_actions': ['Open logs', 'Try again', 'Pick another model if it repeats'],
    }


def _stream_error_payload(error: object = '', status_code: int = 0, body: dict | None = None) -> dict:
    diagnosis = _diagnose_quick_test_failure(error, status_code=status_code, body=body)
    return {
        'error': _short_error(error or body or diagnosis['user_message'], limit=2000),
        'status_code': status_code,
        **diagnosis,
    }


def _extract_served_model_names(body: object) -> list[str]:
    if not isinstance(body, dict):
        return []
    data = body.get('data')
    if not isinstance(data, list):
        return []
    names: list[str] = []
    for item in data:
        if isinstance(item, dict) and isinstance(item.get('id'), str) and item['id'].strip():
            names.append(item['id'].strip())
    return names


def _connect_host(host: str | None) -> str:
    if not host or host in {'0.0.0.0', '::'}:
        return '127.0.0.1'
    return host


def _endpoint_base_url(config: VllmServeConfig) -> str:
    return f'http://{_connect_host(config.host)}:{config.port}'


async def _read_served_model_names(config: VllmServeConfig) -> list[str]:
    try:
        async with httpx.AsyncClient(timeout=4) as client:
            response = await client.get(f'{_endpoint_base_url(config)}/v1/models', headers=_headers(config))
            if response.is_error:
                return []
            return _extract_served_model_names(response.json())
    except Exception:
        return []


async def _enrich_served_model_mismatch(diagnosis: dict, config: VllmServeConfig) -> dict:
    if diagnosis.get('error_type') != 'served_model_name_mismatch':
        return diagnosis
    names = await _read_served_model_names(config)
    if not names:
        return diagnosis
    expected = config.served_model_name or config.model
    suggested = names[0]
    enriched = dict(diagnosis)
    enriched['served_model_names'] = names
    enriched['suggested_model_name'] = suggested
    enriched['user_message'] = (
        f'The endpoint is alive, but the quick test used {expected!r} while vLLM is serving {suggested!r}.'
    )
    enriched['next_actions'] = [
        f'Use served model name: {suggested}',
        'Update served model name in settings',
        'Open logs if the served name looks wrong',
    ]
    return enriched


def _sse(event: str, payload: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"

def _headers(config: VllmServeConfig) -> dict[str, str]:
    if config.api_key:
        return {'Authorization': f'Bearer {config.api_key}'}
    return {}


def _payload(req: PlaygroundChatRequest, config: VllmServeConfig, stream: bool) -> dict:
    model = (req.model_override or '').strip() or config.served_model_name or config.model
    payload = {
        'model': model,
        'messages': [message.model_dump() for message in req.messages],
        'temperature': req.temperature,
        'top_p': req.top_p,
        'stream': stream,
        **req.extra_body,
    }
    if req.max_tokens is not None:
        payload['max_tokens'] = req.max_tokens
    return payload


async def _persist_chat_result(req: PlaygroundChatRequest, assistant_content: str, raw: dict | None = None) -> None:
    if not req.session_id:
        return
    session = await fetchone('SELECT id FROM chat_sessions WHERE id = ?', (req.session_id,))
    if not session:
        return
    ts = now_iso()
    for message in req.messages:
        if message.role in {'user', 'system'}:
            await execute(
                'INSERT INTO chat_messages(id, session_id, role, content, raw_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                (str(uuid4()), req.session_id, message.role, message.content, None, ts),
            )
    await execute(
        'INSERT INTO chat_messages(id, session_id, role, content, raw_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        (str(uuid4()), req.session_id, 'assistant', assistant_content, dumps_json(raw) if raw else None, now_iso()),
    )
    await execute('UPDATE chat_sessions SET updated_at = ? WHERE id = ?', (now_iso(), req.session_id))


@router.post('/chat', response_model=PlaygroundChatResponse)
async def chat(req: PlaygroundChatRequest):
    row, config = await _load_config(req.instance_id)
    if row.get('status') not in {'running', 'starting'}:
        return PlaygroundChatResponse(ok=False, status_code=0, latency_ms=0, error='instance is not running', error_type='instance_not_running', user_message='Start the selected model before running Quick test.', next_actions=['Start this model', 'Choose a running model'])
    payload = _payload(req, config, stream=False)

    start = perf_counter()
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f'{_endpoint_base_url(config)}/v1/chat/completions',
                json=payload,
                headers=_headers(config),
            )
    except Exception as exc:
        
        diagnosis = _diagnose_quick_test_failure(exc, status_code=0)
        return PlaygroundChatResponse(ok=False, status_code=0, latency_ms=int((perf_counter() - start) * 1000), error=str(exc), **diagnosis)

    latency_ms = int((perf_counter() - start) * 1000)
    try:
        body = response.json()
    except Exception:
        body = {'raw_text': response.text}
    if response.is_error:
        
        diagnosis = _diagnose_quick_test_failure(response.text[:2000], status_code=response.status_code, body=body)
        diagnosis = await _enrich_served_model_mismatch(diagnosis, config)
        return PlaygroundChatResponse(ok=False, status_code=response.status_code, latency_ms=latency_ms, response=body, error=response.text[:2000], **diagnosis)

    assistant_content = ''
    try:
        assistant_content = body['choices'][0]['message'].get('content') or ''
    except Exception:
        assistant_content = ''
    await _persist_chat_result(req, assistant_content, raw=body)
    return PlaygroundChatResponse(ok=True, status_code=response.status_code, latency_ms=latency_ms, response=body)


@router.post('/chat/stream')
async def chat_stream(req: PlaygroundChatRequest):
    row, config = await _load_config(req.instance_id)
    if row.get('status') not in {'running', 'starting'}:
        async def not_running():
            yield _sse('error', {
                'error': 'instance is not running',
                'status_code': 0,
                'error_type': 'instance_not_running',
                'user_message': 'Start the selected model before sending a streaming test chat.',
                'next_actions': ['Start this model', 'Choose a running model'],
            })
        return StreamingResponse(not_running(), media_type='text/event-stream')

    payload = _payload(req, config, stream=True)
    url = f'{_endpoint_base_url(config)}/v1/chat/completions'

    async def event_generator():
        assistant_chunks: list[str] = []
        started = perf_counter()
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream('POST', url, json=payload, headers=_headers(config)) as response:
                    if response.status_code >= 400:
                        body = await response.aread()
                        error_text = body.decode(errors='replace')[:2000]
                        payload = _stream_error_payload(error_text, status_code=response.status_code)
                        payload = await _enrich_served_model_mismatch(payload, config)
                        yield _sse('error', payload)
                        return
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        if not line.startswith('data:'):
                            continue
                        data = line[5:].strip()
                        if data == '[DONE]':
                            await _persist_chat_result(req, ''.join(assistant_chunks), raw={'streamed': True})
                            done = {'latency_ms': int((perf_counter() - started) * 1000)}
                            yield _sse('done', done)
                            return
                        try:
                            chunk = json.loads(data)
                            delta = chunk.get('choices', [{}])[0].get('delta', {})
                            content = delta.get('content') or ''
                            if content:
                                assistant_chunks.append(content)
                            out = {'delta': content, 'raw': chunk}
                            yield _sse('token', out)
                        except json.JSONDecodeError:
                            yield _sse('raw', {'line': data})
        except Exception as exc:
            yield _sse('error', _stream_error_payload(exc, status_code=0))

    return StreamingResponse(event_generator(), media_type='text/event-stream')
