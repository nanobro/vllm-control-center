# v4 Agent Prompts

## Master instruction for the next coding agent

```text
Inspect this repository first. Do not rewrite it from scratch.

Continue from v4 of vLLM Control Center.

Product direction:
- This is an LM Studio-style control plane for vLLM.
- It is not another generic chat UI.
- Preserve the FastAPI controller + React/Vite frontend architecture.
- Preserve safe process execution. Never use shell=True.
- Preserve remote controller profiles and their security guardrails.
- Add tests for new backend behavior.
- Run pytest and npm build.
- Summarize changed files and manual test steps.
```

## Recommended Milestone: Hugging Face Model Download Queue

```text
Implement a Hugging Face model download queue.

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
- Run pytest and npm build.
```

## Alternative Milestone: Remote instance bridge

```text
Build a remote instance bridge so the local UI can list and manage instances from the selected remote controller.

Backend:
- Add helper endpoints that call remote /api/instances, start/stop, logs, metrics.
- Keep strict /api-only forwarding.
- Do not stream arbitrary remote URLs yet.

Frontend:
- Remote page should show remote instances.
- Start/stop remote instances from local UI.
- Add remote/local badge.
```
