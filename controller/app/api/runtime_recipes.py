from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.api.instances import row_to_instance
from app.core.dgx_spark_recipe import (
    MODEL_ID,
    inspect_recipe,
    load_recipe_model,
    recipe_status,
    recipe_summary,
)
from app.core.recipe_ownership import eject_persisted_recipe_instance, prove_persisted_recipe_ownership

router = APIRouter(tags=["runtime-recipes"])


class RecipeLoadRequest(BaseModel):
    model: str = MODEL_ID
    port: int = Field(default=8000, ge=1, le=65535)


@router.get("/qwen36-dgx-spark")
async def get_qwen36_dgx_spark_recipe(model: str = MODEL_ID) -> dict[str, Any]:
    inspection = await inspect_recipe(model)
    active = await recipe_status()
    ownership = await prove_persisted_recipe_ownership(active) if active else {"owned": False, "reason": "no recipe record"}
    runtime = inspection.details.get("runtime")
    if isinstance(runtime, dict):
        runtime["ownership"] = ownership
        if runtime.get("matching_model") and ownership.get("owned"):
            runtime["status"] = "managed"
    return {
        "recipe": recipe_summary(),
        "inspection": {
            "ready": inspection.ready,
            "blockers": inspection.blockers,
            "warnings": inspection.warnings,
            "details": inspection.details,
        },
        "instance": row_to_instance(active).model_dump() if active else None,
    }


@router.post("/qwen36-dgx-spark/load")
async def load_qwen36_dgx_spark(req: RecipeLoadRequest) -> dict[str, Any]:
    try:
        row, inspection = await load_recipe_model(req.model, req.port)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {
        "ok": True,
        "message": "Validated DGX Spark recipe applied. The model is loading and readiness includes automatic warm-up.",
        "warnings": inspection.warnings,
        "instance": row_to_instance(row).model_dump(),
    }


@router.post("/qwen36-dgx-spark/{instance_id}/eject")
async def eject_qwen36_dgx_spark(instance_id: str) -> dict[str, Any]:
    active = await recipe_status()
    if not active or active.get("id") != instance_id:
        raise HTTPException(status_code=404, detail="Recipe instance not found.")
    try:
        await eject_persisted_recipe_instance(active)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"ok": True, "ejected": True}
