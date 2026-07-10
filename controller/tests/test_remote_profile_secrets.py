import aiosqlite
import pytest

from app.api.remote_profiles import create_remote_profile, delete_remote_profile, update_remote_profile, _get_private
from app.config import settings
from app.core.secrets import get_secret_value, remote_profile_api_key_secret_key
from app.db import fetchone, init_db
from app.schemas.remote import RemoteControllerProfileCreate, RemoteControllerProfileUpdate


@pytest.fixture(autouse=True)
async def temp_database(tmp_path):
    original = settings.database_path
    settings.database_path = tmp_path / 'controller.db'
    await init_db()
    yield
    settings.database_path = original


async def test_remote_profile_api_key_is_stored_in_secrets_table_not_profile_row():
    public = await create_remote_profile(
        RemoteControllerProfileCreate(name='gpu', base_url='http://gpu.local:8787', api_key='first')
    )
    private = await _get_private(public.id)
    assert private.api_key == 'first'
    assert public.api_key_configured is True

    row = await fetchone('SELECT api_key FROM remote_controller_profiles WHERE id = ?', (public.id,))
    assert row is not None
    assert row['api_key'] is None
    assert await get_secret_value(remote_profile_api_key_secret_key(public.id)) == 'first'

    updated = await update_remote_profile(public.id, RemoteControllerProfileUpdate(api_key='second'))
    assert updated.api_key_configured is True
    private = await _get_private(public.id)
    assert private.api_key == 'second'
    assert await get_secret_value(remote_profile_api_key_secret_key(public.id)) == 'second'

    cleared = await update_remote_profile(public.id, RemoteControllerProfileUpdate(clear_api_key=True))
    assert cleared.api_key_configured is False
    private = await _get_private(public.id)
    assert private.api_key is None
    assert await get_secret_value(remote_profile_api_key_secret_key(public.id)) is None


async def test_remote_profile_delete_removes_secret():
    public = await create_remote_profile(
        RemoteControllerProfileCreate(name='gpu', base_url='http://gpu.local:8787', api_key='delete-me')
    )
    secret_key = remote_profile_api_key_secret_key(public.id)
    assert await get_secret_value(secret_key) == 'delete-me'

    result = await delete_remote_profile(public.id)
    assert result == {'ok': True}
    assert await get_secret_value(secret_key) is None


async def test_legacy_remote_profile_api_keys_are_migrated_to_secrets(tmp_path):
    original = settings.database_path
    settings.database_path = tmp_path / 'legacy.db'
    await init_db()
    async with aiosqlite.connect(settings.database_path) as db:
        await db.execute(
            '''INSERT INTO remote_controller_profiles
               (id, name, base_url, api_key, notes, is_default, last_status, last_latency_ms, last_error, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            ('legacy-id', 'legacy', 'http://gpu.local:8787', 'legacy-secret', None, 0, None, None, None, 'now', 'now'),
        )
        await db.commit()

    await init_db()
    try:
        row = await fetchone('SELECT api_key FROM remote_controller_profiles WHERE id = ?', ('legacy-id',))
        assert row is not None
        assert row['api_key'] is None
        assert await get_secret_value(remote_profile_api_key_secret_key('legacy-id')) == 'legacy-secret'
    finally:
        settings.database_path = original
