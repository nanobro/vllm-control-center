from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings
from app.core.keychain import describe_secret_backend
from app.security import controller_auth_enabled

router = APIRouter()


class SecretBackendInfo(BaseModel):
    name: str
    status: str
    active: bool
    available: bool
    service_name: str
    message: str
    install_hint: str | None = None
    migration_required: bool = False
    controller_auth_enabled: bool
    localhost_auth_bypass_enabled: bool


@router.get('/secret-backend', response_model=SecretBackendInfo)
async def secret_backend_info() -> SecretBackendInfo:
    report = await describe_secret_backend(settings.secret_backend, settings.secret_service_name)
    return SecretBackendInfo(
        name=report.name,
        status=report.status,
        active=report.active,
        available=report.available,
        service_name=report.service_name,
        message=report.message,
        install_hint=report.install_hint,
        migration_required=report.migration_required,
        controller_auth_enabled=controller_auth_enabled(),
        localhost_auth_bypass_enabled=settings.allow_localhost_auth_bypass,
    )
