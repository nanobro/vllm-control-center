import json
from pathlib import Path
from typing import Any

import aiosqlite

from app.config import settings


SCHEMA = """

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS instances (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  config_json TEXT NOT NULL,
  pid INTEGER,
  command_json TEXT,
  started_at TEXT,
  stopped_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  instance_id TEXT NOT NULL,
  stream TEXT NOT NULL,
  line TEXT NOT NULL,
  created_at TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS metrics_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  instance_id TEXT NOT NULL,
  metrics_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  model_id TEXT NOT NULL,
  local_path TEXT,
  display_name TEXT NOT NULL,
  context_length INTEGER,
  dtype_hint TEXT,
  tags_json TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS model_download_jobs (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL,
  revision TEXT,
  local_dir TEXT,
  status TEXT NOT NULL,
  register_model INTEGER NOT NULL DEFAULT 1,
  dry_run INTEGER NOT NULL DEFAULT 0,
  allow_patterns_json TEXT,
  downloaded_bytes INTEGER,
  total_bytes INTEGER,
  current_file TEXT,
  message TEXT,
  error TEXT,
  registered_model_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preset_type TEXT NOT NULL,
  config_json TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  instance_id TEXT,
  model TEXT,
  sampling_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS remote_controller_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key TEXT,
  notes TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  last_status TEXT,
  last_latency_ms REAL,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  raw_json TEXT,
  created_at TEXT NOT NULL
);
"""


async def init_db() -> None:
    db_path = Path(settings.database_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(db_path) as db:
        await db.executescript(SCHEMA)
        await ensure_added_columns(db)
        await migrate_legacy_remote_profile_api_keys(db)
        await db.commit()


async def ensure_added_columns(db: aiosqlite.Connection) -> None:
    db.row_factory = aiosqlite.Row
    cur = await db.execute("PRAGMA table_info(model_download_jobs)")
    columns = {row['name'] for row in await cur.fetchall()}
    if 'allow_patterns_json' not in columns:
        await db.execute('ALTER TABLE model_download_jobs ADD COLUMN allow_patterns_json TEXT')


async def migrate_legacy_remote_profile_api_keys(db: aiosqlite.Connection) -> None:
    """Move legacy remote profile API keys into the secrets table.

    v11 stored remote controller API keys directly in
    remote_controller_profiles.api_key. v12 keeps that column only for backward
    compatibility with existing databases, migrates values into secrets, then
    clears the plaintext profile column so public/domain rows no longer carry
    secret material.
    """
    db.row_factory = aiosqlite.Row
    cur = await db.execute(
        "SELECT id, api_key FROM remote_controller_profiles WHERE api_key IS NOT NULL AND TRIM(api_key) != ''"
    )
    rows = await cur.fetchall()
    for row in rows:
        secret_key = f"remote_profile:{row['id']}:api_key"
        existing = await db.execute("SELECT key FROM secrets WHERE key = ?", (secret_key,))
        if not await existing.fetchone():
            now = __import__('datetime').datetime.now(__import__('datetime').UTC).isoformat().replace('+00:00', 'Z')
            await db.execute(
                'INSERT INTO secrets (key, value, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                (secret_key, row['api_key'], 'Migrated from remote_controller_profiles.api_key', now, now),
            )
    await db.execute("UPDATE remote_controller_profiles SET api_key = NULL WHERE api_key IS NOT NULL")


async def execute(query: str, params: tuple[Any, ...] = ()) -> None:
    async with aiosqlite.connect(settings.database_path) as db:
        await db.execute(query, params)
        await db.commit()


async def fetchone(query: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    async with aiosqlite.connect(settings.database_path) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(query, params)
        row = await cur.fetchone()
        return dict(row) if row else None


async def fetchall(query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    async with aiosqlite.connect(settings.database_path) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(query, params)
        rows = await cur.fetchall()
        return [dict(row) for row in rows]


def dumps_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


def loads_json(value: str) -> Any:
    return json.loads(value)
