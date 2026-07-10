from __future__ import annotations

import json
import time
from typing import Any
from urllib.parse import unquote, urljoin

import httpx

from app.schemas.remote import RemoteControllerPrivate, RemoteControllerProbeResult


def public_base_url(value: str) -> str:
    return value.rstrip('/')


def auth_headers(profile: RemoteControllerPrivate) -> dict[str, str]:
    if not profile.api_key:
        return {}
    return {'authorization': f'Bearer {profile.api_key}'}


async def probe_remote_controller(profile: RemoteControllerPrivate, timeout_s: float = 8.0) -> RemoteControllerProbeResult:
    started = time.perf_counter()
    base = public_base_url(profile.base_url)
    try:
        async with httpx.AsyncClient(timeout=timeout_s, headers=auth_headers(profile)) as client:
            health_response = await client.get(urljoin(base + '/', 'api/health'))
            latency_ms = (time.perf_counter() - started) * 1000
            if health_response.status_code >= 400:
                return RemoteControllerProbeResult(
                    ok=False,
                    status_code=health_response.status_code,
                    latency_ms=latency_ms,
                    error=health_response.text[:500],
                )
            doctor = None
            try:
                doctor_response = await client.get(urljoin(base + '/', 'api/system/doctor'))
                if doctor_response.status_code < 400:
                    doctor = doctor_response.json()
            except Exception:
                doctor = None
            return RemoteControllerProbeResult(
                ok=True,
                status_code=health_response.status_code,
                latency_ms=latency_ms,
                health=health_response.json(),
                doctor=doctor,
            )
    except Exception as exc:
        latency_ms = (time.perf_counter() - started) * 1000
        return RemoteControllerProbeResult(ok=False, latency_ms=latency_ms, error=str(exc))


async def forward_remote_request(
    profile: RemoteControllerPrivate,
    method: str,
    path: str,
    body: dict[str, Any] | None = None,
    timeout_s: float = 30.0,
) -> tuple[int, Any]:
    safe_path = safe_remote_api_path(path)
    base = public_base_url(profile.base_url)
    async with httpx.AsyncClient(timeout=timeout_s, headers=auth_headers(profile)) as client:
        response = await client.request(method, urljoin(base + '/', safe_path.lstrip('/')), json=body)
        content_type = response.headers.get('content-type', '')
        if 'application/json' in content_type:
            return response.status_code, response.json()
        return response.status_code, {'text': response.text}



def safe_remote_api_path(path: str) -> str:
    """Validate and normalize paths forwarded to a remote controller.

    The local controller is allowed to forward only API-relative paths to another
    vLLM Control Center controller. This intentionally blocks full URLs and path
    traversal so remote profiles cannot be abused as a generic SSRF proxy.
    """
    decoded_path = unquote(path)
    if not decoded_path.startswith('/api/'):
        raise ValueError('remote forwarded paths must start with /api/')
    if '://' in decoded_path or '..' in decoded_path or '\\' in decoded_path:
        raise ValueError('remote forwarded path must be relative and safe')
    return path


async def forward_remote_stream(
    profile: RemoteControllerPrivate,
    method: str,
    path: str,
    body: dict[str, Any] | None = None,
    timeout_s: float | None = None,
):
    """Yield raw bytes from a remote controller streaming endpoint.

    This is used for remote log SSE bridging. The generator owns the HTTP client
    lifetime so the upstream stream remains open until the caller disconnects.
    """
    safe_path = safe_remote_api_path(path)
    base = public_base_url(profile.base_url)
    async with httpx.AsyncClient(timeout=timeout_s, headers=auth_headers(profile)) as client:
        async with client.stream(method, urljoin(base + '/', safe_path.lstrip('/')), json=body) as response:
            if response.status_code >= 400:
                text = await response.aread()
                payload = json.dumps({"error": text[:500].decode("utf-8", errors="replace"), "status_code": response.status_code})
                yield f"event: error\ndata: {payload}\n\n".encode()
                return
            async for chunk in response.aiter_bytes():
                yield chunk
