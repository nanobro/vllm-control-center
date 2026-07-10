# v20 Agent Prompts — Local Model Library + Load/Unload UX

Use v20 only. Do not rewrite from scratch.

## Current focus

The app now has an LM Studio-like local model library:

- `GET /api/local-models`
- `POST /api/local-models/load`
- `POST /api/local-models/{instance_id}/unload`
- `Local Models` page
- Server page uses Load/Unload terminology

## Rules

- Preserve FastAPI + React/Vite.
- Never use `shell=True`.
- Do not delete model files from disk unless a future task explicitly designs that flow.
- Keep local model discovery read-only.
- Add tests for backend behavior.
- Run backend tests, backend lint, frontend build, and desktop shell check.

## Suggested next milestone

v20.1 — Local Model Metadata Polish

- Parse `config.json` for local HF snapshot metadata.
- Detect GGUF files in local folders.
- Show quantization/file format where possible.
- Add local model search/filter improvements.
- Add first-run guidance for setting `HF_HOME` or `HUGGINGFACE_HUB_CACHE`.
