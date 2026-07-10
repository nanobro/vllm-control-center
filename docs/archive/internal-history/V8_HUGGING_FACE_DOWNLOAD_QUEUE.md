# v8 — Hugging Face Model Download Queue

v8 adds a first-pass download workflow for Hugging Face models.

## What changed

- Added `model_download_jobs` SQLite table.
- Added backend schemas and routes under `/api/downloads`.
- Added an async download manager with:
  - queued / running / completed / failed / cancelled lifecycle states
  - dry-run jobs for tests and demos
  - optional Hugging Face `snapshot_download` integration
  - cancellation support
  - optional model registry integration
- Added a frontend Downloads page with:
  - model ID / revision / local directory form
  - dry-run toggle
  - register-on-success toggle
  - job cards
  - progress fields
  - cancel button
  - private/gated model guidance

## API

```text
GET  /api/downloads
POST /api/downloads
GET  /api/downloads/{id}
POST /api/downloads/{id}/cancel
```

## Real downloads

Real downloads use `huggingface_hub.snapshot_download` when the package is installed in the controller environment.

```bash
cd controller
source .venv/bin/activate
pip install huggingface_hub
```

Private/gated repos may require an HF token and license acceptance on Hugging Face.

## Dry-run mode

Dry-run mode simulates progress and completion without touching the network. It is useful for tests, UI development, and demos.

## Known limitations

- Real Hugging Face progress is currently coarse. The job lifecycle is tracked, but per-file byte progress is best-effort.
- Download jobs are in-process tasks. A future milestone should make the queue resumable across controller restarts.
- Secrets should be moved to a dedicated secret store before adding a public desktop release.
