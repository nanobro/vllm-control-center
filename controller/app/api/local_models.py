from fastapi import APIRouter, HTTPException, Query

from app.api.instances import row_to_instance
from app.core.error_recovery import concise_error_label
from app.core.local_model_library import add_user_scan_root, create_instance_for_local_model, group_local_model_records, list_local_model_records, list_scan_roots_summary, remove_user_scan_root
from app.core.process_manager import process_manager
from app.db import fetchone
from app.schemas.local_models import AddLocalModelScanRootRequest, LoadLocalModelRequest, LoadLocalModelResponse, LocalModelGroupsSummary, LocalModelScanRootsSummary, LocalModelsSummary

router = APIRouter(tags=['local-models'])


@router.get('', response_model=LocalModelsSummary)
async def list_local_models():
    models, scanned_paths, warnings = await list_local_model_records()
    scan_roots, _user_paths, scan_warnings = await list_scan_roots_summary()
    loaded_ids = [model.active_instance_id for model in models if model.active_instance_id and model.active_status == 'running']
    return LocalModelsSummary(
        models=models,
        groups=group_local_model_records(models),
        loaded_instance_ids=[mid for mid in loaded_ids if mid],
        scanned_paths=scanned_paths,
        warnings=warnings + scan_warnings,
        scan_roots=scan_roots,
    )


@router.get('/groups', response_model=LocalModelGroupsSummary)
async def list_local_model_groups():
    models, scanned_paths, warnings = await list_local_model_records()
    scan_roots, _user_paths, scan_warnings = await list_scan_roots_summary()
    return LocalModelGroupsSummary(
        groups=group_local_model_records(models),
        scanned_paths=scanned_paths,
        warnings=warnings + scan_warnings,
        scan_roots=scan_roots,
    )


@router.get('/scan-roots', response_model=LocalModelScanRootsSummary)
async def list_scan_roots():
    roots, user_paths, warnings = await list_scan_roots_summary()
    return LocalModelScanRootsSummary(roots=roots, user_paths=user_paths, warnings=warnings)


@router.post('/scan-roots', response_model=LocalModelScanRootsSummary)
async def add_scan_root(req: AddLocalModelScanRootRequest):
    try:
        await add_user_scan_root(req.path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    roots, user_paths, warnings = await list_scan_roots_summary()
    return LocalModelScanRootsSummary(roots=roots, user_paths=user_paths, warnings=warnings)


@router.delete('/scan-roots', response_model=LocalModelScanRootsSummary)
async def delete_scan_root(path: str = Query(...)):
    await remove_user_scan_root(path)
    roots, user_paths, warnings = await list_scan_roots_summary()
    return LocalModelScanRootsSummary(roots=roots, user_paths=user_paths, warnings=warnings)


@router.post('/load', response_model=LoadLocalModelResponse)
async def load_local_model(req: LoadLocalModelRequest):
    instance_id, reused_existing, action = await create_instance_for_local_model(req)
    loaded = action == 'already_loaded'
    start_requested = False
    start_error = None
    message = None
    if req.start and action != 'already_loaded':
        try:
            await process_manager.start(instance_id)
            start_requested = True
            action = 'started_existing' if reused_existing else 'created_and_started'
            message = 'Start requested with Low VRAM settings. vLLM is warming up; the endpoint becomes ready after /v1/models responds.' if req.load_preset == 'low_vram' else 'Start requested. vLLM is warming up; the endpoint becomes ready after /v1/models responds.'
        except Exception as exc:  # noqa: BLE001 - API returns a safe, user-facing start error.
            start_error = concise_error_label(str(exc), fallback=str(exc) or exc.__class__.__name__)
            message = 'Instance is available but could not be started. Check logs and vLLM setup.'
    elif action == 'already_loaded':
        message = 'This model is already loaded; reused the running instance.'
    elif reused_existing:
        message = 'Reused an existing stopped instance with Low VRAM settings.' if req.load_preset == 'low_vram' else 'Reused an existing stopped instance instead of creating a duplicate.'
    row = await fetchone('SELECT * FROM instances WHERE id = ?', (instance_id,))
    if not row:
        raise HTTPException(status_code=500, detail='instance was not available')
    instance = row_to_instance(row)
    return LoadLocalModelResponse(
        instance_id=instance_id,
        instance_name=instance.name,
        loaded=loaded,
        start_requested=start_requested,
        start_error=start_error,
        config=instance.config,
        instance=instance,
        reused_existing=reused_existing,
        action=action,
        message=message,
        applied_preset=req.load_preset if req.load_preset != 'balanced' else None,
    )


@router.post('/{instance_id}/unload')
async def unload_local_model(instance_id: str):
    try:
        await process_manager.stop(instance_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {'ok': True, 'unloaded': True}
