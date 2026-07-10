# v9 — Download Queue Hardening

v9 makes the Hugging Face download queue more reliable for real local/remote controller usage.

## Added

- Live download queue updates over Server-Sent Events
- Per-job download stream endpoint
- Retry failed/cancelled jobs
- Delete terminal jobs
- Manual reconciliation endpoint for stale queued/running jobs
- Startup reconciliation so jobs active during a controller restart are marked failed with retry guidance
- Duplicate model registration detection when auto-registering completed jobs
- HF token environment-variable support (`HF_TOKEN`, `HUGGING_FACE_HUB_TOKEN`, or explicit `hf_token_env`)
- Downloads page controls for live updates, retry, delete, and stale-job reconciliation

## New API routes

```text
GET    /api/downloads/stream
GET    /api/downloads/{job_id}/stream
POST   /api/downloads/{job_id}/retry
DELETE /api/downloads/{job_id}
POST   /api/downloads/reconcile
```

Existing v8 routes remain:

```text
GET  /api/downloads
POST /api/downloads
GET  /api/downloads/{job_id}
POST /api/downloads/{job_id}/cancel
```

## Token handling

For gated/private Hugging Face models, prefer environment variables instead of passing tokens in request bodies:

```bash
export HF_TOKEN=hf_...
```

or use a custom environment variable name in the UI/API:

```json
{
  "model_id": "org/private-model",
  "hf_token_env": "MY_HF_TOKEN",
  "dry_run": false
}
```

The downloader resolves tokens in this order:

1. `hf_token` request field
2. `hf_token_env` request field
3. `HF_TOKEN`
4. `HUGGING_FACE_HUB_TOKEN`

Secrets are not included in download job records or exports.

## Reconciliation behavior

Download tasks are in-memory asyncio jobs. If the controller restarts while jobs are queued/running, those tasks are gone. During startup, v9 marks stale active jobs as `failed` with a clear retry message.

Manual reconciliation is also available:

```bash
curl -X POST http://localhost:8787/api/downloads/reconcile
```

## Retry behavior

Retry creates a new job copied from the failed/cancelled job. This keeps the original job as history and makes auditing easier.

## Duplicate model registration

If two completed download jobs point to the same Hugging Face `model_id` and `local_path`, v9 reuses the existing model registry record instead of creating duplicates.
