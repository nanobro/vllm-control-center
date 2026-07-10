# v20.4 Agent Prompts

## Next recommended milestone: v20.5 — Server Page Real QA Fixes

Inspect this repository first. Do not rewrite it from scratch.

Continue from v20.4 only.

Product direction:
- This is an LM Studio-style control plane for vLLM.
- The primary user flow is Server → Local Models → Downloads.
- Keep Advanced tools available but secondary.
- Preserve FastAPI + React/Vite architecture.
- Never use shell=True.
- Add tests when changing backend behavior.
- Run backend tests, backend lint, frontend build, and desktop shell check.

Focus:
- Real QA of Server page on DGX/local machine.
- Fix actual friction found during model discovery, variant download, local model load/unload, and endpoint test.
- Do not add big new features unless required to unblock the primary flow.

Suggested tasks:
1. Validate HF discovery and variant picker against several current HF repos.
2. Validate downloads with HF_TOKEN provided in controller environment.
3. Validate Local Models shows completed downloads correctly.
4. Validate Load Model creates a correct vLLM command.
5. Validate port conflict and missing vLLM guidance.
6. Capture screenshots for docs/screenshots.
