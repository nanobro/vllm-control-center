# v20.6 — Load/Unload State Machine Polish

v20.6 tightens the LM Studio-style model lifecycle so users think in terms of **Load**, **Unload**, and **Eject** instead of accidentally creating duplicate vLLM instances.

## Goals

- Prefer a running instance for the selected model before any stopped/old instance.
- Reuse stopped instances by default instead of creating duplicates.
- Make duplicate creation explicit with `force_new`.
- Explain the difference between Load, Unload, and Eject in the UI and API behavior.
- Surface multiple configured instances as a warning, not a hidden footgun.

## Behavior

### Load

`POST /api/local-models/load` now accepts:

```json
{
  "model_id": "org/model",
  "local_path": "/path/to/model",
  "start": true,
  "reuse_existing": true,
  "force_new": false
}
```

Default behavior:

1. If the model is already running, return the existing running instance.
2. If there is a stopped/crashed matching instance, update its settings and reuse it.
3. Otherwise, create a new instance.

Use `force_new: true` only when the user explicitly wants another instance for the same model.

### Unload

Unload stops the vLLM instance. It does **not** delete model files and does **not** remove the instance record.

### Eject

Eject deletes a stopped/crashed instance record, logs, and metric snapshots. It does **not** delete model files.

## API response fields

`LoadLocalModelResponse` now includes:

```json
{
  "reused_existing": true,
  "action": "already_loaded | reused_stopped | started_existing | created | created_and_started",
  "message": "..."
}
```

Model Hub quick launch responses also include `reused_existing` and `action`.

## Frontend changes

- Server page chooses a running matching instance first.
- Local Models shows loaded/configured instance counts.
- Server page warns when a model has multiple configured instances.
- Create duplicate instance is explicit.
- Load existing / create-if-needed copy replaces accidental duplicate creation.

## Non-goals

- No model file deletion.
- No automatic unloading of other models.
- No multi-model scheduling or routing.
- No desktop controller lifecycle changes.
