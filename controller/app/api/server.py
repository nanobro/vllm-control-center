from __future__ import annotations

from fastapi import APIRouter

from app.core.doctor import run_doctor
from app.core.local_model_library import list_local_model_records
from app.db import fetchall
from app.schemas.server import ServerQaCheck, ServerQaSummary

router = APIRouter(tags=['server'])


def _check(check_id: str, title: str, status: str, message: str, action: str | None = None) -> ServerQaCheck:
    return ServerQaCheck(id=check_id, title=title, status=status, message=message, action=action)


@router.get('/qa', response_model=ServerQaSummary)
async def server_qa() -> ServerQaSummary:
    """Return an LM Studio-style readiness summary for the Server page.

    This endpoint intentionally aggregates lightweight state that real installs
    need on one page: vLLM availability, GPU visibility, download queue status,
    local model discovery, and instance status. It does not start processes or
    mutate local files.
    """
    doctor = await run_doctor()
    local_models, scanned_paths, local_warnings = await list_local_model_records()
    downloads = await fetchall('SELECT status FROM model_download_jobs')
    instances = await fetchall('SELECT status FROM instances')

    active_downloads = sum(1 for row in downloads if row['status'] in {'queued', 'running'})
    completed_downloads = sum(1 for row in downloads if row['status'] == 'completed')
    running_instances = sum(1 for row in instances if row['status'] == 'running')
    stopped_instances = sum(1 for row in instances if row['status'] in {'stopped', 'crashed'})

    checks: list[ServerQaCheck] = []
    checks.append(
        _check(
            'vllm-cli',
            'vLLM CLI',
            'ok' if doctor.vllm.ok else 'warning',
            doctor.vllm.message,
            None if doctor.vllm.ok else 'Install vLLM inside the controller Python environment, then rerun Setup Doctor.',
        )
    )
    checks.append(
        _check(
            'gpu',
            'GPU visibility',
            'ok' if doctor.nvidia.ok else 'warning',
            doctor.nvidia.message,
            None if doctor.nvidia.ok else 'Check NVIDIA driver/CUDA visibility on the machine running the controller.',
        )
    )
    checks.append(
        _check(
            'hf-token',
            'Hugging Face token',
            'ok' if doctor.hf_token.ok else 'info',
            doctor.hf_token.message,
            None if doctor.hf_token.ok else 'Optional: set HF_TOKEN only for gated/private model downloads.',
        )
    )
    if active_downloads:
        checks.append(
            _check(
                'downloads-active',
                'Download queue',
                'info',
                f'{active_downloads} model download job(s) are still queued/running.',
                'Open Downloads to watch progress before loading a newly downloaded model.',
            )
        )
    elif completed_downloads:
        checks.append(
            _check('downloads-complete', 'Download queue', 'ok', f'{completed_downloads} completed download job(s) found.', None)
        )
    else:
        checks.append(
            _check('downloads-empty', 'Download queue', 'info', 'No completed download jobs yet.', 'Use Hugging Face discovery or a built-in catalog model to queue a download.')
        )

    if local_models:
        checks.append(_check('local-models', 'Local models', 'ok', f'{len(local_models)} local/on-device model record(s) found.', None))
    else:
        checks.append(
            _check(
                'local-models',
                'Local models',
                'info',
                'No local/on-device models detected yet.',
                'Download a Hugging Face model or register a local path, then refresh Local Models.',
            )
        )

    for warning in local_warnings[:3]:
        checks.append(_check('local-model-warning', 'Local model scan', 'warning', warning, 'Check cache/model directory permissions.'))

    checks.append(
        _check(
            'instances',
            'Loaded instances',
            'ok' if running_instances else 'info',
            f'{running_instances} running instance(s), {stopped_instances} stopped/crashed instance(s).',
            'Use Load Model to start a server, or Unload Model to stop it.',
        )
    )

    ready_to_load = doctor.vllm.ok and (bool(local_models) or completed_downloads > 0 or active_downloads == 0)
    return ServerQaSummary(
        ready_to_load=ready_to_load,
        checks=checks,
        active_downloads=active_downloads,
        completed_downloads=completed_downloads,
        local_model_count=len(local_models),
        running_instances=running_instances,
        stopped_instances=stopped_instances,
        scanned_paths=scanned_paths,
    )
