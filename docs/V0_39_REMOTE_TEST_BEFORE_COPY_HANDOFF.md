# v0.39 — Remote Test-before-Copy Handoff Pass

v0.39 extends the tested-endpoint handoff rule to Remote.

## Goal

Keep the LM Studio-style remote path honest without adding dashboard clutter:

```text
Pick remote model -> Start -> Test -> Copy OpenAI base URL
```

## Changes

- The selected remote model remains the source of truth for the visible `/v1` endpoint.
- Copy base URL is disabled until the selected remote model is running and its Quick test has passed.
- Switching remote profile, selected model, or instance status resets test/copy state.
- Untested remote endpoints explain the next action in plain English: run Quick test first.
- Stopped, starting, crashed, disconnected, and missing remote selections keep clear blocked reasons.

## Guardrails

- Do not add more Daily mode cards.
- Do not hide exact logs; keep them one click away.
- Do not block Qwen3.6 or large Qwen text-generation models because of size alone.
- Keep Electron preview-only and beta web-first.
