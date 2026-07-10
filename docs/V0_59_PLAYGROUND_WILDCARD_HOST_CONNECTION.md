# v0.59 — Playground Wildcard Host Connection Pass

## Why

A tester can load a local model successfully, then open Playground and still see the test path fail or hang. One common cause is a local vLLM server bound to a wildcard address such as `0.0.0.0` or `::`. That bind address is correct for serving, but it is not the best address for the controller to use when it makes a local test request.

## What changed

- Local Playground backend requests now normalize wildcard bind hosts to `127.0.0.1`.
- The Playground selected-model summary displays wildcard-bound local endpoints as `localhost`.
- The behavior now matches readiness probing and other endpoint handoff surfaces.
- Served-name auto-retry from v0.58 remains intact.
- The loaded/warming model selector from v0.57 remains intact.

## Product guardrails

- No new dashboard panels.
- No generic chat product expansion.
- Daily mode remains Pick model → Start → Test → Copy OpenAI base URL.
- Qwen3.6 and large Qwen text-generation models remain runnable.
- Size alone is not incompatibility.

## Verification

Required checks:

- `scripts/check.sh`
- frontend build
- backend tests
- backend lint
- desktop shell check
- version scheme check
- release freeze check
- bug-bash check
- screenshot check
- smoke check
- launch check
