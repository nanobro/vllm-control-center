# v21 — On-device Scanner QA

v21 focuses on making the local-model path feel closer to LM Studio: the app can discover models already on the machine and the user can add scan folders from the UI instead of setting every path through environment variables.

## What changed

- Added scan-root management APIs:
  - `GET /api/local-models/scan-roots`
  - `POST /api/local-models/scan-roots`
  - `DELETE /api/local-models/scan-roots?path=...`
- User-added scan roots are persisted in the controller SQLite `settings` table under `local_model_scan_roots`.
- `/api/local-models` now includes `scan_roots` with per-root status:
  - source
  - exists
  - model count
  - warnings
- Server Simple Mode now includes an on-device scan path panel when `This device` is selected:
  - Add folder path such as `/data/models`, `/mnt/models`, or `~/models`
  - Rescan
  - See detected root status and model counts
  - Remove app-added scan paths
- Local discovery remains read-only. It never mutates model files or the Hugging Face cache.

## Why this matters

Before v21, users could set `VCC_MODEL_DIRS`, but that still felt like a developer workflow. v21 lets the app behave more like a model launcher: point it at a model folder, see models as a list, then click Load.

## Verification

- Backend tests: `83 passed`
- Backend lint: `ruff check .` passed
- Frontend build: passed
- Desktop shell check: passed
