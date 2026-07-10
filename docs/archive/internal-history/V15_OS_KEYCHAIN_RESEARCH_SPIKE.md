# v15 — OS Keychain Research Spike

v15 is a focused security architecture spike. It does **not** migrate production secret storage away from SQLite yet. Instead, it documents the path and adds a small adapter boundary so a future milestone can move selected secrets into OS-backed credential stores safely.

## Why this exists

v12 moved remote controller API keys out of public remote profile rows and into the local `secrets` table. That reduced accidental exposure in API responses, but the SQLite database still contains secret material.

For a public open-source project that controls local and remote GPU machines, the next mature step is to prepare for platform-backed secret storage:

- macOS Keychain
- Windows Credential Manager
- Linux Secret Service / libsecret compatible backends

## What v15 adds

Backend:

- `controller/app/core/keychain.py`
  - secret backend report model
  - optional keyring availability detection
  - prototype `KeyringSecretBackend` adapter
- `controller/app/api/security_info.py`
  - `GET /api/security/secret-backend`
- Config settings:
  - `VCC_SECRET_BACKEND`
  - `VCC_SECRET_SERVICE_NAME`
- Optional Python extra:
  - `pip install -e .[keychain]`
- Tests for backend reporting and adapter shape

Frontend:

- Settings page now displays secret backend status.
- Settings page explains that SQLite remains active in v15.

Docs:

- This document
- CHANGELOG update
- SECURITY update
- dev tracking updates
- next-agent prompt

## Current behavior

Default:

```bash
VCC_SECRET_BACKEND=sqlite
```

This keeps the current v12+ behavior:

- remote profile API keys are stored in the SQLite `secrets` table
- public API responses expose only `api_key_configured`
- the SQLite DB must be treated as sensitive

Optional research mode:

```bash
VCC_SECRET_BACKEND=keyring
pip install -e .[keychain]
```

In v15, this reports keyring availability but does not activate keyring for production secret reads/writes.

## Why not migrate immediately?

Immediate migration would add platform-specific behavior and failure modes:

- Linux desktop/headless servers may not have a Secret Service daemon.
- Remote controllers may run over SSH/systemd without an unlocked user session.
- Windows and macOS packaging may require different prompts and permissions.
- CI environments usually lack an OS keychain.

So v15 intentionally creates the boundary first and keeps SQLite as the stable active backend.

## Future migration plan

A future milestone should:

1. Add a `SecretStore` interface used by `set_secret_value`, `get_secret_value`, and `delete_secret_value`.
2. Implement `SQLiteSecretStore` and `KeyringSecretStore`.
3. Add a one-way migration helper from SQLite to keyring.
4. Add a fallback policy when keyring is unavailable.
5. Add clear UI warnings for headless Linux.
6. Add tests with a fake keyring backend, not a real OS credential store.
7. Keep public APIs unchanged.

## Security note

Until that migration exists, treat the local controller database as sensitive.
