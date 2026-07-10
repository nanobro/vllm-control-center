# v0.60 — Playground Stop and First-Token Timeout Pass

## Goal

Make Playground recover from the scary state where a model looks loaded but the streaming test sits on `Waiting for first token…` forever.

## What changed

- Added a **Stop test** button during local Playground streaming tests.
- Added a first-token timeout for streams that never produce a token.
- Added an inactivity timeout for streams that begin but stop producing tokens.
- Timeout messages include clear next actions: try non-streaming test, open logs, or restart the model if it stays stuck.
- Kept the loaded/warming model selector from v0.57.
- Kept served-name auto-retry from v0.58.
- Kept wildcard-host loopback connection handling from v0.59.

## Product guardrails

- No generic chat UI expansion.
- No new dashboard panels.
- No extra Daily mode clutter.
- Full diagnostics stay in details/logs.
- Qwen3.6 and large Qwen text-generation models remain runnable.

## Verification

- Frontend build must pass.
- Backend tests and lint must pass.
- Release/version/bug-bash checks must pass.
- The visible beta badge must read from package metadata.
