import pytest
from fastapi import HTTPException

from app.api.remote_profiles import _remote_instance_path, _remote_playground_body
from app.core.remote_client import auth_headers, public_base_url, safe_remote_api_path
from app.schemas.remote import (
    RemoteControllerPrivate,
    RemoteForwardRequest,
    RemotePlaygroundChatRequest,
)


def test_remote_auth_header_redacts_to_bearer():
    profile = RemoteControllerPrivate(id='1', name='gpu', base_url='http://gpu:8787', api_key='secret', api_key_configured=True)
    assert auth_headers(profile) == {'authorization': 'Bearer secret'}


def test_public_base_url_strips_trailing_slash():
    assert public_base_url('http://gpu:8787///') == 'http://gpu:8787'


def test_forward_request_requires_api_relative_path():
    with pytest.raises(ValueError):
        RemoteForwardRequest(path='http://evil.test/api/health')
    with pytest.raises(ValueError):
        RemoteForwardRequest(path='/not-api/health')
    assert RemoteForwardRequest(path='/api/health').path == '/api/health'


def test_safe_remote_api_path_blocks_non_api_and_urls():
    assert safe_remote_api_path('/api/instances') == '/api/instances'
    assert safe_remote_api_path('/api/instances/abc/logs?tail=10') == '/api/instances/abc/logs?tail=10'
    with pytest.raises(ValueError):
        safe_remote_api_path('/metrics')
    with pytest.raises(ValueError):
        safe_remote_api_path('https://evil.test/api/instances')
    with pytest.raises(ValueError):
        safe_remote_api_path('/api/../secret')


def test_remote_instance_path_rejects_path_traversal():
    assert _remote_instance_path('abc123', '/start') == '/api/instances/abc123/start'
    with pytest.raises(HTTPException):
        _remote_instance_path('../abc')
    with pytest.raises(HTTPException):
        _remote_instance_path('a/b')


def test_remote_playground_body_injects_remote_instance_id():
    payload = RemotePlaygroundChatRequest(
        messages=[{'role': 'user', 'content': 'hello'}],
        temperature=0.2,
        top_p=0.9,
        max_tokens=128,
        extra_body={'seed': 42},
    )
    body = _remote_playground_body('remote-123', payload, stream=True)
    assert body['instance_id'] == 'remote-123'
    assert body['stream'] is True
    assert body['messages'][0]['content'] == 'hello'
    assert body['extra_body'] == {'seed': 42}


def test_remote_playground_body_rejects_bad_instance_id():
    payload = RemotePlaygroundChatRequest(messages=[{'role': 'user', 'content': 'hello'}])
    with pytest.raises(HTTPException):
        _remote_playground_body('../bad', payload, stream=False)


def test_safe_remote_api_path_rejects_encoded_traversal_and_backslash():
    with pytest.raises(ValueError):
        safe_remote_api_path('/api/%2e%2e/secret')
    with pytest.raises(ValueError):
        safe_remote_api_path('/api/instances\\secret')


def test_remote_instance_path_rejects_encoded_slash_and_traversal():
    with pytest.raises(HTTPException):
        _remote_instance_path('abc%2Fdef')
    with pytest.raises(HTTPException):
        _remote_instance_path('%2e%2e')


def test_remote_instance_path_allows_safe_query_suffix_only_from_callers():
    # The helper is intentionally narrow: callers provide known suffixes while
    # untrusted input is limited to the remote instance id.
    assert _remote_instance_path('abc123', '/logs?tail=10') == '/api/instances/abc123/logs?tail=10'


async def test_generic_remote_forwarding_is_disabled_by_default():
    from app.api.remote_profiles import forward_to_remote
    from app.config import settings

    original = settings.allow_remote_forwarding
    settings.allow_remote_forwarding = False
    try:
        with pytest.raises(HTTPException) as exc:
            await forward_to_remote('missing-profile-is-not-loaded', RemoteForwardRequest(path='/api/health'))
        assert exc.value.status_code == 403
    finally:
        settings.allow_remote_forwarding = original
