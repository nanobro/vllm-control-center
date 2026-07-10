# Agent Handoff

Current package: v0.48 Endpoint Handoff Bundle Copy Pass

Current product direction:

- Default to Daily mode.
- Keep the main path calm: Pick model -> Start -> Test -> Copy OpenAI base URL.
- Keep setup, logs, release checks, metrics, and operator pages in Advanced mode.
- Avoid reintroducing stacked helper cards or milestone/version labels into the live UI.
- Keep Electron preview-only and web-first beta.

Latest change:

v0.48 keeps the local readiness, crash-memory, remote handoff, Low VRAM retry, test-before-copy, endpoint-label, restart-safe handoff, streaming guidance, mismatch detection, auto served-name retry, and tested model-name clarity intact. It adds a one-click handoff bundle so the tested `/v1` base URL and exact tested model name can be copied together. Qwen/Qwen3.6 text-generation models remain runnable; size alone is not incompatibility.

Recommended next work:

v0.49 — Next beta fixes from real feedback only. Do not add new Daily mode surfaces.
