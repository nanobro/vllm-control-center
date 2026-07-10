# v0.44 — Served Model Name Mismatch Guidance Pass

v0.44 focuses on one common real-world vLLM confusion: the server is alive, but `/v1/chat/completions` fails because the request uses a model name that does not match the model name currently served by vLLM.

## What changed

- Quick test failure diagnosis now treats served model name mismatch as a first-class failure type across 400 and 404-style OpenAI-compatible errors.
- When mismatch is detected, the controller tries `/v1/models` and extracts served model IDs when available.
- Local Quick test, local streaming test, and remote forwarded test responses can include:
  - `served_model_names`
  - `suggested_model_name`
- Run Model and Remote GPU pages show the suggested served model name as a small copyable hint instead of dumping raw `/v1/models` JSON into the main path.

## Product guardrails

- Daily mode stays Pick → Start → Test → Copy.
- Copy still requires a successful Quick test for the exact selected run.
- Qwen3.6 and large Qwen text-generation models remain runnable.
- Size alone is not incompatibility.
- Exact raw errors remain available in logs/details.
