# v12 — Secret Storage Hardening

v12 moves remote controller API keys out of the public/domain remote profile row and into the local `secrets` table.

## Why this milestone exists

v11 added controller auth and foundational secret utilities, but remote profile API keys were still stored directly on `remote_controller_profiles.api_key`. That made them easier to accidentally expose through future list/debug/export surfaces.

v12 separates normal profile metadata from secret material.

## What changed

- Added database-backed secret helpers in `controller/app/core/secrets.py`.
- Added deterministic remote profile secret keys:
  - `remote_profile:<profile_id>:api_key`
- Remote profile create/update/clear/delete now uses secret helpers.
- Public API responses still return only `api_key_configured`.
- `RemoteControllerPrivate` still receives the real key internally for forwarding/probing.
- `init_db()` migrates legacy `remote_controller_profiles.api_key` values into `secrets` and clears the legacy column.

## Backward compatibility

The `api_key` column remains in `remote_controller_profiles` for existing SQLite databases created before v12.

During database initialization:

1. rows with non-empty `remote_controller_profiles.api_key` are found;
2. each key is inserted into `secrets` if no matching secret exists;
3. the legacy profile-row value is cleared.

This lets older local databases continue working while reducing future accidental exposure.

## Security model

v12 is a meaningful hardening step, but it is not encryption.

The local SQLite database still contains secrets. Treat it as sensitive:

- do not commit it;
- do not sync it to public/shared storage;
- prefer private network controls for remote profiles;
- consider OS keychain integration as a future milestone.

## Tests added

v12 adds coverage for:

- creating a remote profile with an API key;
- confirming the profile row does not retain the raw key;
- reading the key internally from `secrets`;
- updating the key;
- clearing the key;
- deleting a profile and removing its secret;
- migrating legacy profile-row keys into `secrets`.

## Verification

```text
Backend tests: 40 passed
Backend lint: passed
Frontend build: passed
```

## Future work

Possible next hardening steps:

- OS keychain provider;
- encrypted file-backed secret provider;
- SQLite file-permission checks in Setup Doctor;
- warnings when database path appears to be in synced/cloud folders;
- migration version table instead of inline schema/migration routines.
