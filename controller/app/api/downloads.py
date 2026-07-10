import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.core.error_recovery import build_error_recovery_advice, join_error_sources
from app.core.download_manager import (
    cancel_download_job,
    create_download_job,
    delete_download_job,
    reconcile_stale_download_jobs,
    retry_download_job,
    stream_download_events,
)
from app.db import fetchall, fetchone
from app.schemas.error_recovery import ErrorRecoveryAdvice
from app.schemas.downloads import (
    CancelDownloadJobResponse,
    CreateDownloadJobRequest,
    DeleteDownloadJobResponse,
    DownloadJobRecord,
    ReconcileDownloadsResponse,
    RetryDownloadJobRequest,
    RetryDownloadJobResponse,
)

router = APIRouter(tags=['downloads'])


def row_to_download(row: dict) -> DownloadJobRecord:
    return DownloadJobRecord(
        id=row['id'],
        model_id=row['model_id'],
        revision=row.get('revision'),
        local_dir=row.get('local_dir'),
        status=row['status'],
        register_model=bool(row['register_model']),
        dry_run=bool(row['dry_run']),
        allow_patterns=json.loads(row.get('allow_patterns_json') or '[]'),
        downloaded_bytes=row.get('downloaded_bytes'),
        total_bytes=row.get('total_bytes'),
        current_file=row.get('current_file'),
        message=row.get('message'),
        error=row.get('error'),
        registered_model_id=row.get('registered_model_id'),
        created_at=row['created_at'],
        updated_at=row['updated_at'],
        started_at=row.get('started_at'),
        completed_at=row.get('completed_at'),
    )


async def _sse(generator):
    async for payload in generator:
        yield f"event: downloads\ndata: {json.dumps(payload)}\n\n"


@router.get('', response_model=list[DownloadJobRecord])
async def list_downloads():
    rows = await fetchall('SELECT * FROM model_download_jobs ORDER BY created_at DESC')
    return [row_to_download(row) for row in rows]


@router.post('', response_model=DownloadJobRecord)
async def create_download(req: CreateDownloadJobRequest):
    job_id = await create_download_job(req)
    row = await fetchone('SELECT * FROM model_download_jobs WHERE id = ?', (job_id,))
    assert row is not None
    return row_to_download(row)


@router.get('/stream')
async def stream_downloads():
    return StreamingResponse(_sse(stream_download_events()), media_type='text/event-stream')


@router.post('/reconcile', response_model=ReconcileDownloadsResponse)
async def reconcile_downloads():
    count = await reconcile_stale_download_jobs()
    return ReconcileDownloadsResponse(ok=True, reconciled=count, message=f'Reconciled {count} stale jobs')


@router.get('/{job_id}', response_model=DownloadJobRecord)
async def get_download(job_id: str):
    row = await fetchone('SELECT * FROM model_download_jobs WHERE id = ?', (job_id,))
    if row is None:
        raise HTTPException(status_code=404, detail='download job not found')
    return row_to_download(row)


@router.get('/{job_id}/stream')
async def stream_download(job_id: str):
    if await fetchone('SELECT id FROM model_download_jobs WHERE id = ?', (job_id,)) is None:
        raise HTTPException(status_code=404, detail='download job not found')
    return StreamingResponse(_sse(stream_download_events(job_id)), media_type='text/event-stream')


@router.post('/{job_id}/cancel', response_model=CancelDownloadJobResponse)
async def cancel_download(job_id: str):
    try:
        status, message = await cancel_download_job(job_id)
    except KeyError:
        raise HTTPException(status_code=404, detail='download job not found') from None
    return CancelDownloadJobResponse(ok=True, status=status, message=message)


@router.post('/{job_id}/retry', response_model=RetryDownloadJobResponse)
async def retry_download(job_id: str, req: RetryDownloadJobRequest | None = None):
    try:
        new_job_id = await retry_download_job(job_id, req)
    except KeyError:
        raise HTTPException(status_code=404, detail='download job not found') from None
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from None
    row = await fetchone('SELECT * FROM model_download_jobs WHERE id = ?', (new_job_id,))
    assert row is not None
    return RetryDownloadJobResponse(ok=True, job=row_to_download(row))


@router.get('/{job_id}/recovery', response_model=ErrorRecoveryAdvice)
async def download_recovery(job_id: str):
    row = await fetchone('SELECT * FROM model_download_jobs WHERE id = ?', (job_id,))
    if row is None:
        raise HTTPException(status_code=404, detail='download job not found')
    raw = join_error_sources([row.get('error'), row.get('message'), row.get('current_file')])
    return build_error_recovery_advice(raw, context='download')


@router.delete('/{job_id}', response_model=DeleteDownloadJobResponse)
async def delete_download(job_id: str):
    try:
        deleted, message = await delete_download_job(job_id)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from None
    if not deleted:
        raise HTTPException(status_code=404, detail=message)
    return DeleteDownloadJobResponse(ok=True, deleted=True, message=message)
