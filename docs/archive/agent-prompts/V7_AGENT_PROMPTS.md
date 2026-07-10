# v7 Agent Prompts

Use these prompts after v7. Give agents the latest repo only.

## General instruction for every agent

```text
Inspect this repository first. Do not rewrite it from scratch.

Continue from v7 of vLLM Control Center.

Product direction:
- This is an LM Studio-style control plane for vLLM.
- It is not another generic chat UI.
- The project is intended to be open source.
- Preserve FastAPI controller + React/Vite frontend architecture.
- Preserve safe subprocess execution. Never use shell=True.
- Preserve remote controller profile security guardrails.
- Add backend tests for new behavior.
- Run ./scripts/check.sh if possible, otherwise run pytest and npm build manually.
- Summarize changed files and manual test steps.
```

## Next milestone: Hugging Face Model Download Queue

```text
Implement Hugging Face Model Download Queue.

Backend requirements:
1. Add SQLite table model_download_jobs.
2. Add schemas for download job create/list/status/cancel.
3. Add API routes:
   - GET /api/downloads
   - POST /api/downloads
   - GET /api/downloads/{id}
   - POST /api/downloads/{id}/cancel
4. Use huggingface_hub if installed, but gracefully report setup instructions if not installed.
5. Support dry-run job mode for tests.
6. Track status: queued, running, completed, failed, cancelled.
7. Track progress fields when available:
   - downloaded_bytes
   - total_bytes
   - current_file
   - message
8. Do not require downloading during tests; use a fake downloader.
9. Add tests for job lifecycle.

Frontend requirements:
1. Add Downloads page.
2. Add form for model_id, revision, local_dir.
3. Show queue and status cards.
4. Add cancel button.
5. Add guidance for private/gated models and HF token.

Quality:
- Preserve existing model registry.
- Successful download should optionally register the model.
- Run tests and frontend build.
```
