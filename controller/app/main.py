from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.security import ControllerAuthMiddleware

from app.api import (
    chat_history,
    compatibility,
    downloads,
    exports,
    health,
    instances,
    local_models,
    metrics,
    model_hub,
    models,
    playground,
    recipes,
    remote_profiles,
    runtime_recipes,
    security_info,
    server,
    system,
)
from app.core.download_manager import reconcile_stale_download_jobs
from app.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await reconcile_stale_download_jobs()
    yield


app = FastAPI(
    title="vLLM Control Center Controller",
    version="0.79.0",
    lifespan=lifespan,
)

app.add_middleware(ControllerAuthMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(system.router, prefix="/api/system")
app.include_router(security_info.router, prefix="/api/security")
app.include_router(server.router, prefix="/api/server")
app.include_router(instances.router, prefix="/api/instances")
app.include_router(metrics.router, prefix="/api/instances")
app.include_router(playground.router, prefix="/api/playground")
app.include_router(exports.router, prefix="/api/exports")
app.include_router(downloads.router, prefix="/api/downloads")
app.include_router(compatibility.router, prefix="/api/compatibility")
app.include_router(models.router, prefix="/api/models")
app.include_router(local_models.router, prefix="/api/local-models")
app.include_router(model_hub.router, prefix="/api/model-hub")
app.include_router(runtime_recipes.router, prefix="/api/runtime-recipes")
app.include_router(recipes.router, prefix="/api/recipes")
app.include_router(remote_profiles.router, prefix="/api/remote-profiles")
app.include_router(chat_history.router, prefix="/api/chat")
