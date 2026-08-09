from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.api.instances import row_to_instance
from app.core.dgx_spark_recipe import (
    MODEL_ID,
    eject_recipe_instance,
    inspect_recipe,
    load_recipe_model,
    recipe_status,
    recipe_summary,
)

router = APIRouter(tags=["runtime-recipes"])


class RecipeLoadRequest(BaseModel):
    model: str = MODEL_ID
    port: int = Field(default=8000, ge=1, le=65535)


@router.get("/qwen36-dgx-spark")
async def get_qwen36_dgx_spark_recipe(model: str = MODEL_ID) -> dict[str, Any]:
    inspection = await inspect_recipe(model)
    active = await recipe_status()
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
        "message": (
            "Experimental DGX Spark recipe applied. Hardware validation is pending; "
            "the model is loading and readiness includes automatic warm-up."
        ),
        "warnings": inspection.warnings,
        "instance": row_to_instance(row).model_dump(),
    }


@router.post("/qwen36-dgx-spark/{instance_id}/eject")
async def eject_qwen36_dgx_spark(instance_id: str) -> dict[str, Any]:
    try:
        await eject_recipe_instance(instance_id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"ok": True, "ejected": True}
