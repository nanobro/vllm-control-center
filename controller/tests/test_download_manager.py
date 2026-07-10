import asyncio

import pytest

from app.config import settings
from app.core.download_manager import (
    DownloadResult,
    cancel_download_job,
    create_download_job,
    set_downloader_for_tests,
    wait_for_job,
)
from app.db import fetchall, fetchone, init_db
from app.schemas.downloads import CreateDownloadJobRequest, RetryDownloadJobRequest


@pytest.fixture(autouse=True)
async def temp_database(tmp_path):
    original = settings.database_path
    settings.database_path = tmp_path / 'controller.db'
    await init_db()
    set_downloader_for_tests(None)
    yield
    set_downloader_for_tests(None)
    settings.database_path = original


async def test_dry_run_download_lifecycle_registers_model():
    job_id = await create_download_job(
        CreateDownloadJobRequest(model_id='Qwen/Qwen3-0.6B', dry_run=True, register_model=True)
    )
    await wait_for_job(job_id)

    job = await fetchone('SELECT * FROM model_download_jobs WHERE id = ?', (job_id,))
    assert job is not None
    assert job['status'] == 'completed'
    assert job['downloaded_bytes'] == job['total_bytes']
    assert job['registered_model_id'] is not None

    models = await fetchall('SELECT * FROM models')
    assert len(models) == 1
    assert models[0]['model_id'] == 'Qwen/Qwen3-0.6B'


class SlowDownloader:
    async def download(self, job_id: str, request: CreateDownloadJobRequest) -> DownloadResult:
        await asyncio.sleep(5)
        return DownloadResult(local_path='./models/slow', message='done')


async def test_cancel_download_job():
    set_downloader_for_tests(SlowDownloader())
    job_id = await create_download_job(
        CreateDownloadJobRequest(model_id='Qwen/Slow', dry_run=False, register_model=False)
    )
    status, _ = await cancel_download_job(job_id)
    assert status == 'cancelled'
    await asyncio.sleep(0)

    job = await fetchone('SELECT * FROM model_download_jobs WHERE id = ?', (job_id,))
    assert job is not None
    assert job['status'] == 'cancelled'


async def test_missing_huggingface_hub_reports_setup_instruction(monkeypatch):
    import app.core.download_manager as dm

    monkeypatch.setattr(dm.importlib.util, 'find_spec', lambda name: None)
    job_id = await create_download_job(
        CreateDownloadJobRequest(model_id='Qwen/Qwen3-0.6B', dry_run=False, register_model=False)
    )
    await wait_for_job(job_id)

    job = await fetchone('SELECT * FROM model_download_jobs WHERE id = ?', (job_id,))
    assert job is not None
    assert job['status'] == 'failed'
    assert 'pip install huggingface_hub' in job['error']


class FailingDownloader:
    async def download(self, job_id: str, request: CreateDownloadJobRequest) -> DownloadResult:
        raise RuntimeError('boom')


async def test_retry_failed_download_creates_new_job():
    from app.core.download_manager import retry_download_job

    set_downloader_for_tests(FailingDownloader())
    job_id = await create_download_job(CreateDownloadJobRequest(model_id='Qwen/RetryMe', register_model=False))
    await wait_for_job(job_id)
    failed = await fetchone('SELECT * FROM model_download_jobs WHERE id = ?', (job_id,))
    assert failed is not None
    assert failed['status'] == 'failed'

    set_downloader_for_tests(None)
    new_job_id = await retry_download_job(job_id, RetryDownloadJobRequest(dry_run=True))
    assert new_job_id != job_id
    await wait_for_job(new_job_id)
    retried = await fetchone('SELECT * FROM model_download_jobs WHERE id = ?', (new_job_id,))
    assert retried is not None
    assert retried['status'] == 'completed'


async def test_delete_terminal_download_job():
    from app.core.download_manager import delete_download_job

    job_id = await create_download_job(
        CreateDownloadJobRequest(model_id='Qwen/DeleteMe', dry_run=True, register_model=False)
    )
    await wait_for_job(job_id)
    deleted, message = await delete_download_job(job_id)
    assert deleted is True
    assert message == 'Job deleted'
    assert await fetchone('SELECT * FROM model_download_jobs WHERE id = ?', (job_id,)) is None


async def test_reconcile_stale_download_jobs_marks_active_jobs_failed():
    from app.core.download_manager import reconcile_stale_download_jobs

    await init_db()
    await create_download_job(CreateDownloadJobRequest(model_id='Qwen/Stale', dry_run=True))
    count = await reconcile_stale_download_jobs()
    assert count == 1
    jobs = await fetchall('SELECT * FROM model_download_jobs')
    assert jobs[0]['status'] == 'failed'
    assert 'Retry' in jobs[0]['error']


async def test_duplicate_download_registration_reuses_model_record():
    first = await create_download_job(
        CreateDownloadJobRequest(model_id='Qwen/Duplicate', dry_run=True, register_model=True)
    )
    await wait_for_job(first)
    second = await create_download_job(
        CreateDownloadJobRequest(model_id='Qwen/Duplicate', dry_run=True, register_model=True)
    )
    await wait_for_job(second)

    models = await fetchall('SELECT * FROM models WHERE model_id = ?', ('Qwen/Duplicate',))
    jobs = await fetchall('SELECT * FROM model_download_jobs ORDER BY created_at ASC')
    assert len(models) == 1
    assert jobs[0]['registered_model_id'] == jobs[1]['registered_model_id']
