from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Protocol


class SecretBackendName(StrEnum):
    SQLITE = 'sqlite'
    KEYRING = 'keyring'


class SecretBackendStatus(StrEnum):
    ACTIVE = 'active'
    AVAILABLE = 'available'
    UNAVAILABLE = 'unavailable'
    NOT_CONFIGURED = 'not_configured'


@dataclass(frozen=True)
class SecretBackendReport:
    name: str
    status: str
    active: bool
    available: bool
    service_name: str
    message: str
    install_hint: str | None = None
    migration_required: bool = False


class SecretBackend(Protocol):
    name: str

    async def get(self, key: str) -> str | None: ...

    async def set(self, key: str, value: str) -> None: ...

    async def delete(self, key: str) -> None: ...

    async def available(self) -> bool: ...


def keyring_library_available() -> bool:
    try:
        import keyring  # noqa: F401
    except Exception:
        return False
    return True


def get_keyring_backend_name() -> str | None:
    try:
        import keyring

        backend = keyring.get_keyring()
        return backend.__class__.__module__ + '.' + backend.__class__.__name__
    except Exception:
        return None


async def describe_secret_backend(
    requested_backend: str = 'sqlite',
    service_name: str = 'vllm-control-center',
) -> SecretBackendReport:
    requested = (requested_backend or 'sqlite').strip().lower()
    if requested not in {SecretBackendName.SQLITE.value, SecretBackendName.KEYRING.value}:
        return SecretBackendReport(
            name=requested,
            status=SecretBackendStatus.UNAVAILABLE.value,
            active=False,
            available=False,
            service_name=service_name,
            message=f'Unsupported secret backend: {requested}',
            install_hint='Use VCC_SECRET_BACKEND=sqlite for now, or keyring after installing the keyring extra.',
        )

    if requested == SecretBackendName.SQLITE.value:
        return SecretBackendReport(
            name=SecretBackendName.SQLITE.value,
            status=SecretBackendStatus.ACTIVE.value,
            active=True,
            available=True,
            service_name=service_name,
            message='SQLite secrets table is active. Treat the local database file as sensitive.',
            migration_required=False,
        )

    if not keyring_library_available():
        return SecretBackendReport(
            name=SecretBackendName.KEYRING.value,
            status=SecretBackendStatus.UNAVAILABLE.value,
            active=False,
            available=False,
            service_name=service_name,
            message='Python keyring package is not installed, so OS keychain storage is not available yet.',
            install_hint='Install the optional extra later with: pip install -e .[keychain]',
            migration_required=True,
        )

    backend_name = get_keyring_backend_name() or 'unknown keyring backend'
    return SecretBackendReport(
        name=SecretBackendName.KEYRING.value,
        status=SecretBackendStatus.AVAILABLE.value,
        active=False,
        available=True,
        service_name=service_name,
        message=f'OS keychain library is available via {backend_name}, but v15 keeps SQLite as the active backend.',
        install_hint=None,
        migration_required=True,
    )


class KeyringSecretBackend:
    """Prototype adapter for a future OS keychain-backed secret store.

    v15 intentionally does not wire this into production secret reads/writes. The
    adapter defines the boundary and is covered by lightweight tests so a future
    milestone can switch selected secret classes from SQLite to keyring without
    changing call sites.
    """

    name = SecretBackendName.KEYRING.value

    def __init__(self, service_name: str = 'vllm-control-center') -> None:
        self.service_name = service_name

    async def available(self) -> bool:
        return keyring_library_available()

    async def get(self, key: str) -> str | None:
        import keyring

        return keyring.get_password(self.service_name, key)

    async def set(self, key: str, value: str) -> None:
        import keyring

        keyring.set_password(self.service_name, key, value)

    async def delete(self, key: str) -> None:
        import keyring
        from keyring.errors import PasswordDeleteError

        try:
            keyring.delete_password(self.service_name, key)
        except PasswordDeleteError:
            return
