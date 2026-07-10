# v0.30 Agent Prompt — LM Studio Familiarity & Auto-Detect Fix Pass

Use this package as the base for future work. Public versions are v0.x. Do not return to v24.x or v25.0 numbering.

## What changed in v0.30

- Fixed long model/path overflow in Run Model and model details.
- Made daily Run Model wording closer to LM Studio: pick model, Start, Test, Copy base URL.
- Added automatic scan roots for LM Studio, Hugging Face cache, vLLM cache, Unsloth, Downloads, home/project models, and related env vars.

## Guardrails

- Keep Daily mode frozen.
- Keep beta web-first.
- Keep Electron preview-only.
- Next version should be v0.31.
- Do not add new product surfaces unless replacing/removing confusion.
