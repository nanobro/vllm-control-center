from __future__ import annotations

from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.core.secrets import constant_time_equals, secret_configured

PUBLIC_PATHS = {
    '/api/health',
}


def controller_auth_enabled() -> bool:
    return secret_configured(settings.controller_api_key)


def _extract_token(request: Request) -> str | None:
    authorization = request.headers.get('authorization')
    if authorization and authorization.lower().startswith('bearer '):
        return authorization.split(' ', 1)[1].strip()
    header_token = request.headers.get('x-vcc-api-key')
    if header_token:
        return header_token.strip()
    # EventSource cannot set custom headers, so protected SSE endpoints may pass
    # a token query parameter. This should only be used over trusted localhost or HTTPS.
    query_token = request.query_params.get('api_key') or request.query_params.get('token')
    if query_token:
        return query_token.strip()
    return None


def _is_loopback_client(request: Request) -> bool:
    host = request.client.host if request.client else ''
    return host in {'127.0.0.1', '::1', 'localhost', 'testclient'}


class ControllerAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        if request.method == 'OPTIONS':
            return await call_next(request)
        if not request.url.path.startswith('/api/'):
            return await call_next(request)
        if request.url.path in PUBLIC_PATHS:
            return await call_next(request)
        if not controller_auth_enabled():
            return await call_next(request)
        if settings.allow_localhost_auth_bypass and _is_loopback_client(request):
            return await call_next(request)
        token = _extract_token(request)
        if not constant_time_equals(token, settings.controller_api_key):
            return JSONResponse(status_code=401, content={'detail': 'Controller API key required'})
        return await call_next(request)
