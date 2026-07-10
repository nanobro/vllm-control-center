# V6 Agent Prompts

## Continue from V6

```text
Inspect this repository first. Do not rewrite it from scratch.

Continue from v6 of vLLM Control Center.

Product direction:
- This is an LM Studio-style control plane for vLLM.
- It is not another generic chat UI.
- The project is intended to be open source.
- Preserve FastAPI controller + React/Vite frontend architecture.
- Preserve safe subprocess execution. Never use shell=True.
- Preserve remote controller profile security guardrails.
- Add backend tests for new behavior.
- Run pytest and npm build.
- Summarize changed files and manual test steps.
```

## V7 Milestone: Hugging Face Model Download Queue

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
- Run pytest and npm build.
```

## V8 Milestone: Public Demo Polish

```text
Prepare the project for a public GitHub README demo.

Requirements:
- Add screenshots placeholders or docs/screenshots/README.md with exact shots needed.
- Add docs/QUICKSTART_REMOTE_DGX.md.
- Add docs/CONFIG_EXAMPLES.md with local, LAN, and remote examples.
- Add a public-facing README section: Why not just Open WebUI / LM Studio / vLLM Playground?
- Add badges for CI, license, Python, Node.
- Keep claims accurate and conservative.
```
