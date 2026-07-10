from __future__ import annotations

import asyncio
import importlib.util
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import AsyncIterator, Protocol
from uuid import uuid4

from app.db import dumps_json, loads_json, execute, fetchall, fetchone
from app.schemas.downloads import CreateDownloadJobRequest, RetryDownloadJobRequest


TERMINAL_STATUSES = {'completed', 'failed', 'cancelled'}
ACTIVE_STATUSES = {'queued', 'running'}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _public_error(error: BaseException) -> str:
    text = str(error) or error.__class__.__name__
    sensitive_markers = ['hf_', 'Bearer ', 'authorization', 'token=', 'huggingface_hub_token']
    if any(marker.lower() in text.lower() for marker in sensitive_markers):
        return 'Download failed. See controller logs for details; a secret was redacted from this message.'
    return text


def _resolve_hf_token(request: CreateDownloadJobRequest) -> str | None:
    if request.hf_token:
        return request.hf_token
    if request.hf_token_env:
        return os.environ.get(request.hf_token_env)
    return os.environ.get('HF_TOKEN') or os.environ.get('HUGGING_FACE_HUB_TOKEN')


@dataclass
class DownloadResult:
    local_path: str | None
    message: str


class Downloader(Protocol):
    async def download(self, job_id: str, request: CreateDownloadJobRequest) -> DownloadResult: ...


class DryRunDownloader:
    async def download(self, job_id: str, request: CreateDownloadJobRequest) -> DownloadResult:
        total = 3_000_000
        steps = [
            ('config.json', 500_000),
            ('tokenizer.json', 1_200_000),
            ('model.safetensors', total),
        ]
        await _mark_running(job_id, total_bytes=total, message='Dry-run download started')
        for filename, downloaded in steps:
            if await is_cancelled(job_id):
                raise asyncio.CancelledError()
            await asyncio.sleep(0.01)
            await _update_progress(
                job_id,
                downloaded_bytes=downloaded,
                total_bytes=total,
                current_file=filename,
                message=f'Dry-run fetched {filename}',
            )
        local_dir = request.local_dir or f'./models/{request.model_id.replace("/", "--")}'
        return DownloadResult(local_path=local_dir, message='Dry-run completed; no files were downloaded')


class HuggingFaceDownloader:
    async def download(self, job_id: str, request: CreateDownloadJobRequest) -> DownloadResult:
        if importlib.util.find_spec('huggingface_hub') is None:
            raise RuntimeError(
                'huggingface_hub is not installed. Install it in the controller environment with: '
                'pip install huggingface_hub'
            )

        from huggingface_hub import snapshot_download  # type: ignore

        await _mark_running(job_id, message='Starting Hugging Face snapshot_download')

        def run_download() -> str:
            token = _resolve_hf_token(request)
            kwargs: dict[str, object] = {
                'repo_id': request.model_id,
                'revision': request.revision,
                'local_dir': request.local_dir,
                'token': token,
                'local_dir_use_symlinks': False,
                'allow_patterns': request.allow_patterns or None,
            }
            cleaned = {key: value for key, value in kwargs.items() if value is not None}
            return snapshot_download(**cleaned)

        path = await asyncio.to_thread(run_download)
        return DownloadResult(local_path=path, message='Hugging Face download completed')


_download_tasks: dict[str, asyncio.Task[None]] = {}
_downloader_override: Downloader | None = None
_download_event = asyncio.Event()


def set_downloader_for_tests(downloader: Downloader | None) -> None:
    global _downloader_override
    _downloader_override = downloader


def choose_downloader(request: CreateDownloadJobRequest) -> Downloader:
    if _downloader_override is not None:
        return _downloader_override
    if request.dry_run:
        return DryRunDownloader()
    return HuggingFaceDownloader()


async def _notify_download_event() -> None:
    _download_event.set()


async def stream_download_events(job_id: str | None = None) -> AsyncIterator[dict]:
    """Yield download job snapshots whenever the queue changes.

    This intentionally uses a lightweight in-process event instead of a message broker. If a browser reconnects,
    the first yielded event is always the current database state.
    """
    last_payload = object()
    while True:
        payload = await _download_snapshot(job_id)
        if payload != last_payload:
            yield payload
            last_payload = payload
        _download_event.clear()
        try:
            await asyncio.wait_for(_download_event.wait(), timeout=15)
        except asyncio.TimeoutError:
            continue


async def _download_snapshot(job_id: str | None) -> dict:
    if job_id is None:
        rows = await fetchall('SELECT * FROM model_download_jobs ORDER BY created_at DESC')
        return {'type': 'downloads', 'jobs': [dict(row) for row in rows]}
    row = await fetchone('SELECT * FROM model_download_jobs WHERE id = ?', (job_id,))
    return {'type': 'download', 'job': dict(row) if row else None}


async def create_download_job(request: CreateDownloadJobRequest) -> str:
    job_id = str(uuid4())
    ts = now_iso()
    await execute(
        '''
        INSERT INTO model_download_jobs(
          id, model_id, revision, local_dir, status, register_model, dry_run, allow_patterns_json,
          downloaded_bytes, total_bytes, current_file, message, error,
          registered_model_id, created_at, updated_at, started_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (
            job_id,
            request.model_id,
            request.revision,
            request.local_dir,
            'queued',
            1 if request.register_model else 0,
            1 if request.dry_run else 0,
            dumps_json(request.allow_patterns or []),
            None,
            None,
            None,
            'Queued',
            None,
            None,
            ts,
            ts,
            None,
            None,
        ),
    )
    await _notify_download_event()
    task = asyncio.create_task(_run_job(job_id, request))
    _download_tasks[job_id] = task
    return job_id


async def cancel_download_job(job_id: str) -> tuple[str, str]:
    row = await fetchone('SELECT status FROM model_download_jobs WHERE id = ?', (job_id,))
    if row is None:
        raise KeyError(job_id)
    status = row['status']
    if status in TERMINAL_STATUSES:
        return status, f'Job is already {status}'
    await execute(
        '''
        UPDATE model_download_jobs
        SET status = ?, message = ?, updated_at = ?, completed_at = COALESCE(completed_at, ?)
        WHERE id = ?
        ''',
        ('cancelled', 'Cancellation requested', now_iso(), now_iso(), job_id),
    )
    await _notify_download_event()
    task = _download_tasks.get(job_id)
    if task and not task.done():
        task.cancel()
    return 'cancelled', 'Cancellation requested'


async def retry_download_job(job_id: str, request: RetryDownloadJobRequest | None = None) -> str:
    row = await fetchone('SELECT * FROM model_download_jobs WHERE id = ?', (job_id,))
    if row is None:
        raise KeyError(job_id)
    if row['status'] not in {'failed', 'cancelled'}:
        raise ValueError('Only failed or cancelled download jobs can be retried')
    retry_request = CreateDownloadJobRequest(
        model_id=row['model_id'],
        revision=row.get('revision'),
        local_dir=row.get('local_dir'),
        register_model=bool(row['register_model']),
        dry_run=bool(row['dry_run']) if request is None or request.dry_run is None else request.dry_run,
        hf_token=None if request is None else request.hf_token,
        hf_token_env=None if request is None else request.hf_token_env,
        allow_patterns=loads_json(row.get('allow_patterns_json') or '[]'),
    )
    return await create_download_job(retry_request)


async def delete_download_job(job_id: str) -> tuple[bool, str]:
    row = await fetchone('SELECT status FROM model_download_jobs WHERE id = ?', (job_id,))
    if row is None:
        return False, 'Job not found'
    if row['status'] in ACTIVE_STATUSES:
        raise ValueError('Cannot delete an active download job. Cancel it first.')
    await execute('DELETE FROM model_download_jobs WHERE id = ?', (job_id,))
    await _notify_download_event()
    return True, 'Job deleted'


async def reconcile_stale_download_jobs() -> int:
    """Mark queued/running jobs as failed after controller restart.

    In-memory asyncio tasks do not survive process restarts. This prevents stale jobs from appearing alive forever.
    """
    rows = await fetchall(
        "SELECT id FROM model_download_jobs WHERE status IN ('queued', 'running') ORDER BY created_at ASC"
    )
    if not rows:
        return 0
    ts = now_iso()
    for row in rows:
        await execute(
            '''
            UPDATE model_download_jobs
            SET status = ?, message = ?, error = ?, updated_at = ?, completed_at = ?
            WHERE id = ?
            ''',
            (
                'failed',
                'Download reconciled after controller restart',
                'The controller restarted while this download was active. Retry the job to start it again.',
                ts,
                ts,
                row['id'],
            ),
        )
    await _notify_download_event()
    return len(rows)


async def _run_job(job_id: str, request: CreateDownloadJobRequest) -> None:
    downloader = choose_downloader(request)
    try:
        await _mark_running(job_id, message='Starting download')
        result = await downloader.download(job_id, request)
        if await is_cancelled(job_id):
            return
        registered_model_id = None
        if request.register_model:
            registered_model_id = await _register_downloaded_model(request, result.local_path)
        await execute(
            '''
            UPDATE model_download_jobs
            SET status = ?, local_dir = COALESCE(?, local_dir), downloaded_bytes = COALESCE(total_bytes, downloaded_bytes),
                current_file = NULL, message = ?, error = NULL, registered_model_id = ?, updated_at = ?, completed_at = ?
            WHERE id = ? AND status != 'cancelled'
            ''',
            ('completed', result.local_path, result.message, registered_model_id, now_iso(), now_iso(), job_id),
        )
        await _notify_download_event()
    except asyncio.CancelledError:
        await execute(
            '''
            UPDATE model_download_jobs
            SET status = ?, message = ?, updated_at = ?, completed_at = COALESCE(completed_at, ?)
            WHERE id = ?
            ''',
            ('cancelled', 'Download cancelled', now_iso(), now_iso(), job_id),
        )
        await _notify_download_event()
    except BaseException as error:
        await execute(
            '''
            UPDATE model_download_jobs
            SET status = ?, message = ?, error = ?, updated_at = ?, completed_at = ?
            WHERE id = ? AND status != 'cancelled'
            ''',
            ('failed', 'Download failed', _public_error(error), now_iso(), now_iso(), job_id),
        )
        await _notify_download_event()
    finally:
        _download_tasks.pop(job_id, None)


async def _mark_running(job_id: str, total_bytes: int | None = None, message: str | None = None) -> None:
    await execute(
        '''
        UPDATE model_download_jobs
        SET status = CASE WHEN status = 'queued' THEN 'running' ELSE status END,
            total_bytes = COALESCE(?, total_bytes), message = COALESCE(?, message),
            started_at = COALESCE(started_at, ?), updated_at = ?
        WHERE id = ? AND status != 'cancelled'
        ''',
        (total_bytes, message, now_iso(), now_iso(), job_id),
    )
    await _notify_download_event()


async def _update_progress(
    job_id: str,
    *,
    downloaded_bytes: int | None = None,
    total_bytes: int | None = None,
    current_file: str | None = None,
    message: str | None = None,
) -> None:
    await execute(
        '''
        UPDATE model_download_jobs
        SET downloaded_bytes = COALESCE(?, downloaded_bytes), total_bytes = COALESCE(?, total_bytes),
            current_file = COALESCE(?, current_file), message = COALESCE(?, message), updated_at = ?
        WHERE id = ? AND status != 'cancelled'
        ''',
        (downloaded_bytes, total_bytes, current_file, message, now_iso(), job_id),
    )
    await _notify_download_event()


async def is_cancelled(job_id: str) -> bool:
    row = await fetchone('SELECT status FROM model_download_jobs WHERE id = ?', (job_id,))
    return bool(row and row['status'] == 'cancelled')


async def _register_downloaded_model(request: CreateDownloadJobRequest, local_path: str | None) -> str:
    existing = await fetchone(
        'SELECT id FROM models WHERE source = ? AND model_id = ? AND COALESCE(local_path, ?) = COALESCE(?, ?)',
        ('huggingface', request.model_id, '', local_path, ''),
    )
    if existing is not None:
        return existing['id']

    model_record_id = str(uuid4())
    ts = now_iso()
    display_name = request.model_id.split('/')[-1]
    tags_json = '["downloaded"' + (', "dry-run"' if request.dry_run else '') + ']'
    await execute(
        '''
        INSERT INTO models(id, source, model_id, local_path, display_name, context_length, dtype_hint, tags_json, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (
            model_record_id,
            'huggingface',
            request.model_id,
            local_path,
            display_name,
            None,
            None,
            tags_json,
            'Registered automatically from the download queue.',
            ts,
            ts,
        ),
    )
    return model_record_id


async def wait_for_job(job_id: str, timeout: float = 2.0) -> None:
    task = _download_tasks.get(job_id)
    if task is not None:
        await asyncio.wait_for(asyncio.shield(task), timeout=timeout)
