# v8 Agent Prompts

Use v8 as the new baseline. Do not mix it with earlier zip files.

## General instruction

```text
Inspect this repository first. Do not rewrite it from scratch.

Continue from v8 of vLLM Control Center.

Product direction:
- This is an LM Studio-style control plane for vLLM.
- It is not another generic chat UI.
- The project is intended to be open source.
- Preserve FastAPI controller + React/Vite frontend architecture.
- Preserve safe subprocess execution. Never use shell=True.
- Preserve remote controller profile security guardrails.
- Preserve the v8 Hugging Face download queue.
- Add backend tests for new behavior.
- Run pytest, ruff, and npm build.
- Summarize changed files and manual test steps.
```

## Recommended v9 milestone — Download Queue Hardening

```text
Improve the Hugging Face Model Download Queue.

Backend requirements:
1. Add SSE stream for download job updates:
   GET /api/downloads/{id}/stream
2. Add queue worker that can process one job at a time with clear state transitions.
3. Add retry support for failed jobs:
   POST /api/downloads/{id}/retry
4. Add delete job endpoint:
   DELETE /api/downloads/{id}
5. Move HF token handling toward environment/secret reference instead of plain request body.
6. Add startup reconciliation: jobs stuck in running should become failed with a restart message.
7. Improve model registry integration to avoid duplicate model records.

Frontend requirements:
1. Downloads page should stream job updates instead of polling.
2. Add retry and delete buttons.
3. Add duplicate model warning.
4. Add install hint when huggingface_hub is missing.

Quality:
- Tests for stuck-job reconciliation.
- Tests for duplicate model registration handling.
- Run pytest, ruff, and npm build.
```
