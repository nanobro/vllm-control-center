from __future__ import annotations

import hmac
import re
from datetime import UTC, datetime
from typing import Iterable

from app.db import execute, fetchone

REDACTED = '<redacted>'

_SECRET_PATTERNS = [
    re.compile(r'(authorization:\s*bearer\s+)([^\s]+)', re.IGNORECASE),
    re.compile(r'(--api-key\s+)([^\s]+)', re.IGNORECASE),
    re.compile(r'((?:api[_-]?key|hf[_-]?token|token)\s*[=:]\s*)([^\s,;]+)', re.IGNORECASE),
]


def constant_time_equals(left: str | None, right: str | None) -> bool:
    if left is None or right is None:
        return False
    return hmac.compare_digest(left.encode('utf-8'), right.encode('utf-8'))


def mask_secret(secret: str | None, visible: int = 4) -> str | None:
    if not secret:
        return None
    if len(secret) <= visible * 2:
        return '*' * len(secret)
    return f'{secret[:visible]}...{secret[-visible:]}'


def redact_secret_text(text: str, extra_secrets: Iterable[str | None] = ()) -> str:
    redacted = text
    for pattern in _SECRET_PATTERNS:
        redacted = pattern.sub(lambda match: f'{match.group(1)}{REDACTED}', redacted)
    for secret in extra_secrets:
        if secret:
            redacted = redacted.replace(secret, REDACTED)
    return redacted


def secret_configured(secret: str | None) -> bool:
    return bool(secret and secret.strip())


# Database-backed secret helpers. These are intentionally simple for the
# local-first controller: secrets are separated from public/domain tables and
# never returned by public response schemas. v12 still uses local SQLite as the
# backing store, so the database file must be treated as sensitive.


def remote_profile_api_key_secret_key(profile_id: str) -> str:
    return f'remote_profile:{profile_id}:api_key'


async def set_secret_value(key: str, value: str | None, notes: str | None = None) -> None:
    if value is None or not value.strip():
        await delete_secret_value(key)
        return
    now = datetime.now(UTC).isoformat().replace('+00:00', 'Z')
    existing = await fetchone('SELECT key FROM secrets WHERE key = ?', (key,))
    if existing:
        await execute(
            'UPDATE secrets SET value = ?, notes = COALESCE(?, notes), updated_at = ? WHERE key = ?',
            (value, notes, now, key),
        )
    else:
        await execute(
            'INSERT INTO secrets (key, value, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            (key, value, notes, now, now),
        )


async def get_secret_value(key: str) -> str | None:
    row = await fetchone('SELECT value FROM secrets WHERE key = ?', (key,))
    if not row:
        return None
    return row.get('value')


async def delete_secret_value(key: str) -> None:
    await execute('DELETE FROM secrets WHERE key = ?', (key,))


async def has_secret_value(key: str) -> bool:
    value = await get_secret_value(key)
    return secret_configured(value)
