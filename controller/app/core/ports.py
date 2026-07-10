from __future__ import annotations

import socket


WILDCARD_HOSTS = {'0.0.0.0', '::', ''}


def _bind_host(host: str) -> str:
    return '0.0.0.0' if host in WILDCARD_HOSTS else host


def is_port_available(host: str, port: int) -> bool:
    """Return True when a local TCP port can be bound by a new vLLM process."""
    if port < 1 or port > 65535:
        return False
    bind_host = _bind_host(host)
    family = socket.AF_INET6 if ':' in bind_host and bind_host != '127.0.0.1' else socket.AF_INET
    with socket.socket(family, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.settimeout(0.5)
        try:
            sock.bind((bind_host, port))
        except OSError:
            return False
    return True


def next_available_port(host: str, preferred_port: int, *, max_scan: int = 100) -> int | None:
    """Find the preferred port or the next nearby free port."""
    for candidate in range(preferred_port, min(65535, preferred_port + max_scan) + 1):
        if is_port_available(host, candidate):
            return candidate
    return None
