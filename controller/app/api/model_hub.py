from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query

from app.core.download_manager import create_download_job
from app.core.error_recovery import concise_error_label
from app.core.hf_catalog import catalog_record_from_model_id, discover_huggingface_models, discover_huggingface_model_variants
from app.core.model_catalog import default_instance_name, get_catalog_model, list_catalog_models
from app.core.process_manager import process_manager
from app.db import dumps_json, execute, fetchall, fetchone
from app.schemas.downloads import CreateDownloadJobRequest, DownloadJobRecord
from app.schemas.instances import VllmServeConfig
from app.schemas.model_hub import (
    CatalogDownloadRequest,
    CatalogModelRecord,
    CatalogRegisterRequest,
    HfCatalogActionRequest,
    HfCatalogSearchResponse,
    HfModelVariantsResponse,
    HfQuickLaunchRequest,
    ModelHubSummary,
    QuickLaunchRequest,
    QuickLaunchResponse,
)
from app.schemas.models import ModelRecord
from app.api.downloads import row_to_download
from app.api.models import row_to_model

router = APIRouter(tags=['model-hub'])


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _registered_ids() -> list[str]:
    rows = await fetchall('SELECT model_id FROM models ORDER BY updated_at DESC')
    return [row['model_id'] for row in rows]


async def _running_ids() -> list[str]:
    rows = await fetchall("SELECT config_json FROM instances WHERE status IN ('running', 'starting')")
    out: list[str] = []
    for row in rows:
        try:
            out.append(VllmServeConfig(**__import__('json').loads(row['config_json'])).model)
        except Exception:
            continue
    return out


async def _active_download_ids() -> list[str]:
    rows = await fetchall("SELECT model_id FROM model_download_jobs WHERE status IN ('queued', 'running')")
    return [row['model_id'] for row in rows]


async def _current_instance_config(instance_id: str, fallback: VllmServeConfig) -> VllmServeConfig:
    row = await fetchone('SELECT config_json FROM instances WHERE id = ?', (instance_id,))
    if not row:
        return fallback
    try:
        return VllmServeConfig(**__import__('json').loads(row['config_json']))
    except Exception:
        return fallback


async def _register_model(model: CatalogModelRecord, local_path: str | None = None) -> ModelRecord:
    existing = await fetchone('SELECT * FROM models WHERE model_id = ? ORDER BY updated_at DESC LIMIT 1', (model.model_id,))
    if existing:
        return row_to_model(existing)
    model_record_id = str(uuid4())
    ts = now_iso()
    await execute(
        '''
        INSERT INTO models(id, source, model_id, local_path, display_name, context_length, dtype_hint, tags_json, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (
            model_record_id,
            'huggingface',
            model.model_id,
            local_path,
            model.display_name,
            model.suggested_max_model_len,
            model.default_dtype,
            dumps_json(model.tags),
            model.notes or model.description,
            ts,
            ts,
        ),
    )
    row = await fetchone('SELECT * FROM models WHERE id = ?', (model_record_id,))
    assert row is not None
    return row_to_model(row)


async def _create_instance(model: CatalogModelRecord, req: QuickLaunchRequest) -> tuple[str, str, VllmServeConfig, bool, str]:
    config = VllmServeConfig(
        model=model.model_id,
        host=req.host,
        port=req.port,
        api_key=req.api_key,
        served_model_name=req.served_model_name,
        dtype=req.dtype or model.default_dtype,
        max_model_len=req.max_model_len if req.max_model_len is not None else model.suggested_max_model_len,
        gpu_memory_utilization=req.gpu_memory_utilization if req.gpu_memory_utilization is not None else model.suggested_gpu_memory_utilization,
        kv_cache_memory_bytes=req.kv_cache_memory_bytes,
        tensor_parallel_size=req.tensor_parallel_size,
        pipeline_parallel_size=req.pipeline_parallel_size,
        trust_remote_code=req.trust_remote_code if req.trust_remote_code is not None else model.trust_remote_code,
        enable_auto_tool_choice=bool(req.enable_auto_tool_choice),
        tool_call_parser=req.tool_call_parser,
        reasoning_parser=req.reasoning_parser,
        extra_args=req.extra_args,
    )
    instance_name = req.name or default_instance_name(model.model_id)
    ts = now_iso()
    if req.reuse_existing and not req.force_new:
        rows = await fetchall('SELECT * FROM instances ORDER BY updated_at DESC')
        matches = []
        for row in rows:
            try:
                existing_config = VllmServeConfig(**__import__('json').loads(row['config_json']))
            except Exception:
                continue
            if existing_config.model == model.model_id:
                matches.append(row)
        status_order = {'running': 0, 'starting': 1, 'stopped': 2, 'crashed': 3, 'stopping': 4}
        matches.sort(key=lambda row: (status_order.get(row['status'], 9), row['updated_at']))
        if matches:
            existing = matches[0]
            if existing['status'] in {'stopped', 'crashed'}:
                await execute(
                    'UPDATE instances SET name = ?, host = ?, port = ?, config_json = ?, updated_at = ? WHERE id = ?',
                    (instance_name, config.host, config.port, dumps_json(config.model_dump()), ts, existing['id']),
                )
                return existing['id'], instance_name, config, True, 'reused_stopped'
            existing_config = VllmServeConfig(**__import__('json').loads(existing['config_json']))
            return existing['id'], existing['name'], existing_config, True, 'already_loaded' if existing['status'] == 'running' else 'reused_existing'

    instance_id = str(uuid4())
    await execute(
        '''
        INSERT INTO instances(id, name, status, host, port, config_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (instance_id, instance_name, 'stopped', config.host, config.port, dumps_json(config.model_dump()), ts, ts),
    )
    return instance_id, instance_name, config, False, 'created'


@router.get('/catalog', response_model=ModelHubSummary)
async def catalog(query: str | None = Query(default=None), tag: str | None = Query(default=None)):
    return ModelHubSummary(
        catalog=list_catalog_models(query=query, tag=tag),
        registered_model_ids=await _registered_ids(),
        running_model_ids=await _running_ids(),
        active_download_model_ids=await _active_download_ids(),
    )


@router.get('/hf/search', response_model=HfCatalogSearchResponse)
async def hf_search(
    query: str = Query(default=''),
    limit: int = Query(default=50, ge=1, le=100),
    hf_token_env: str | None = Query(default='HF_TOKEN'),
    mode: str = Query(default='trending', pattern='^(trending|most_downloaded|most_liked|recently_updated|search)$'),
    task: str | None = Query(default='llm'),
    author: str | None = Query(default=None),
    filter: list[str] = Query(default=[]),
):
    """Discover Hugging Face models as temporary catalog records.

    Do not rely on stale example model IDs. The Server page can browse dynamic
    modes like trending, most downloaded, and recently updated. Tokens are read
    from an environment variable, never sent to the browser.
    """
    try:
        records = await discover_huggingface_models(
            query,
            limit=limit,
            hf_token_env=hf_token_env,
            mode=mode,  # type: ignore[arg-type]
            task=task,
            author=author,
            filters=filter,
        )
        error = None
        online = True
    except PermissionError as exc:
        records = []
        error = str(exc)
        online = False
    except Exception as exc:
        records = []
        error = f'Hugging Face discovery failed: {exc}'
        online = False
    return HfCatalogSearchResponse(
        query=query,
        hf_token_env=hf_token_env,
        online=online,
        error=error,
        mode=mode,
        task=task,
        author=author,
        filters=filter,
        catalog=records,
        registered_model_ids=await _registered_ids(),
        running_model_ids=await _running_ids(),
        active_download_model_ids=await _active_download_ids(),
    )



@router.get('/hf/variants', response_model=HfModelVariantsResponse)
async def hf_variants(
    model_id: str = Query(..., min_length=1),
    revision: str | None = Query(default='main'),
    hf_token_env: str | None = Query(default='HF_TOKEN'),
):
    """List downloadable file/quantization variants for a Hugging Face repo.

    This is the LM Studio-like picker layer: the catalog can identify a repo,
    while this endpoint identifies selectable files such as Q4_K_M GGUF, Q8_0
    GGUF, or the default safetensors snapshot.
    """
    try:
        variants = await discover_huggingface_model_variants(model_id, revision=revision, hf_token_env=hf_token_env)
        return HfModelVariantsResponse(model_id=model_id, revision=revision, hf_token_env=hf_token_env, online=True, variants=variants)
    except PermissionError as exc:
        return HfModelVariantsResponse(model_id=model_id, revision=revision, hf_token_env=hf_token_env, online=False, error=str(exc), variants=[])
    except Exception as exc:
        return HfModelVariantsResponse(model_id=model_id, revision=revision, hf_token_env=hf_token_env, online=False, error=f'Hugging Face variant discovery failed: {exc}', variants=[])

@router.post('/hf/register', response_model=ModelRecord)
async def register_hf_model(req: HfCatalogActionRequest):
    model = catalog_record_from_model_id(req.model_id, display_name=req.display_name, tags=req.tags or None)
    return await _register_model(model, local_path=req.local_path)


@router.post('/hf/download', response_model=DownloadJobRecord)
async def download_hf_model(req: HfCatalogActionRequest):
    model = catalog_record_from_model_id(req.model_id, display_name=req.display_name, tags=req.tags or None)
    job_id = await create_download_job(
        CreateDownloadJobRequest(
            model_id=model.model_id,
            revision=req.revision,
            local_dir=req.local_dir,
            register_model=req.register_model,
            dry_run=req.dry_run,
            hf_token_env=req.hf_token_env,
            allow_patterns=req.allow_patterns or ([req.variant_path] if req.variant_path else []),
        )
    )
    row = await fetchone('SELECT * FROM model_download_jobs WHERE id = ?', (job_id,))
    assert row is not None
    return row_to_download(row)


@router.post('/hf/quick-launch', response_model=QuickLaunchResponse)
async def quick_launch_hf_model(req: HfQuickLaunchRequest):
    model = catalog_record_from_model_id(req.model_id, display_name=req.display_name, tags=req.tags or None)
    await _register_model(model)
    instance_id, instance_name, config, reused_existing, action = await _create_instance(model, req)
    started = action == 'already_loaded'
    start_requested = False
    start_error: str | None = None
    message = 'This model is already loaded; reused the running instance.' if started else None
    if req.start and action != 'already_loaded':
        try:
            await process_manager.start(instance_id)
            start_requested = True
            action = 'started_existing' if reused_existing else 'created_and_started'
            message = 'Start requested. vLLM is warming up; the endpoint becomes ready after /v1/models responds.'
        except Exception as exc:
            start_error = concise_error_label(str(exc), fallback=str(exc) or exc.__class__.__name__)
            message = 'Instance created, but vLLM could not start. Check logs and setup.'
    config = await _current_instance_config(instance_id, config)
    return QuickLaunchResponse(instance_id=instance_id, instance_name=instance_name, started=started, start_requested=start_requested, start_error=start_error, message=message, config=config, reused_existing=reused_existing, action=action)


@router.post('/catalog/{catalog_id}/register', response_model=ModelRecord)
async def register_catalog_model(catalog_id: str, req: CatalogRegisterRequest | None = None):
    model = get_catalog_model(catalog_id)
    if model is None:
        raise HTTPException(status_code=404, detail='catalog model not found')
    return await _register_model(model, local_path=req.local_path if req else None)


@router.post('/catalog/{catalog_id}/download', response_model=DownloadJobRecord)
async def download_catalog_model(catalog_id: str, req: CatalogDownloadRequest):
    model = get_catalog_model(catalog_id)
    if model is None:
        raise HTTPException(status_code=404, detail='catalog model not found')
    job_id = await create_download_job(
        CreateDownloadJobRequest(
            model_id=model.model_id,
            revision=req.revision,
            local_dir=req.local_dir,
            register_model=req.register_model,
            dry_run=req.dry_run,
            hf_token_env=req.hf_token_env,
            allow_patterns=req.allow_patterns or ([req.variant_path] if req.variant_path else []),
        )
    )
    row = await fetchone('SELECT * FROM model_download_jobs WHERE id = ?', (job_id,))
    assert row is not None
    return row_to_download(row)


@router.post('/catalog/{catalog_id}/quick-launch', response_model=QuickLaunchResponse)
async def quick_launch_catalog_model(catalog_id: str, req: QuickLaunchRequest):
    model = get_catalog_model(catalog_id)
    if model is None:
        raise HTTPException(status_code=404, detail='catalog model not found')
    await _register_model(model)
    instance_id, instance_name, config, reused_existing, action = await _create_instance(model, req)
    started = action == 'already_loaded'
    start_requested = False
    start_error: str | None = None
    message = 'This model is already loaded; reused the running instance.' if started else None
    if req.start and action != 'already_loaded':
        try:
            await process_manager.start(instance_id)
            start_requested = True
            action = 'started_existing' if reused_existing else 'created_and_started'
            message = 'Start requested. vLLM is warming up; the endpoint becomes ready after /v1/models responds.'
        except Exception as exc:  # UI needs created instance even if vLLM is not installed yet.
            start_error = concise_error_label(str(exc), fallback=str(exc) or exc.__class__.__name__)
            message = 'Instance created, but vLLM could not start. Check logs and setup.'
    config = await _current_instance_config(instance_id, config)
    return QuickLaunchResponse(instance_id=instance_id, instance_name=instance_name, started=started, start_requested=start_requested, start_error=start_error, message=message, config=config, reused_existing=reused_existing, action=action)
