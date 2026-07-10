# v0.58 — Playground Served Name Auto-Retry Pass

## Goal

Make Playground recover from the same served-model-name mismatch that Run Model already handles. A model can be loaded and reachable, but `/v1/chat/completions` can fail if the request uses the configured alias while vLLM reports a different model id from `/v1/models`.

## What changed

- Playground detects `served_model_name_mismatch` errors from local streaming tests.
- If the controller suggests an actual served model name, Playground retries once with that name.
- Non-streaming tests perform the same one-shot retry.
- A compact notice explains that Playground retried with the served model name.
- The loaded/warming instance selector from v0.57 remains the source of truth.

## Product guardrails

- No new Daily mode cards.
- No dashboard clutter.
- No operator-heavy main-path copy.
- No size-only blocking for Qwen3.6 or large Qwen text-generation models.
- The app version badge still comes from package metadata.

## Verification

Required checks:

- `./scripts/check.sh`
- `npm --prefix frontend run build`
- backend tests and lint
- `./scripts/version-scheme-check.sh`
- `./scripts/release-freeze-check.sh`
- `./scripts/bug-bash-check.sh`
- `./scripts/smoke.sh`
- `./scripts/launch-check.sh`
- `./scripts/check-screenshots.sh`
- desktop shell check
