# v19 — Server Page Real-World Polish

v19 continues the LM Studio-style correction started in v17 and v18. The goal is to make the Server page feel like the primary place to operate vLLM, not a thin wrapper around separate admin pages.

## Why this milestone exists

Real LM Studio usage is centered on one obvious flow:

```text
choose model -> download/register -> start server -> copy endpoint -> test -> inspect logs/metrics
```

Earlier versions had the backend pieces, but users still had to jump between Model Hub, Downloads, Instances, Logs, Metrics, and Playground. v18 combined the flow; v18.1 fixed basic friction. v19 adds the practical polish needed after comparing against LM Studio screenshots and real install feedback.

## Added

- Server-page catalog tag filtering and quick tag chips.
- More visible selected-model status pills: registered, running, gated, downloading.
- Download status panel next to the selected model, including progress when available.
- First-run guidance for the primary flow.
- vLLM CLI readiness guidance via Setup Doctor on the Server page.
- Inline quick test prompt for a running local instance.
- Richer model inspector payload, including catalog metadata, instance metadata, download status, and runtime defaults.
- More helpful error guidance for common launch/download failures: missing vLLM CLI, port conflicts, CUDA OOM, and gated/private Hugging Face models.
- Additional DGX/high-memory catalog entries and a backend test for tag filtering.

## Not added

- No controller lifecycle auto-start yet.
- No local Hugging Face cache scanner yet.
- No desktop packaging changes.
- No inference engine changes. vLLM remains the engine.

## Manual test flow

1. Open the Server page.
2. Filter by tag such as `dgx`, `coding`, or `qwen`.
3. Select a model.
4. Register or Download it.
5. Create + Start an instance.
6. Copy the endpoint.
7. Run the inline test prompt after the server is running.
8. Check live logs, model inspector, command preview, and metrics shortcut.

## Verification

```text
Backend tests: 60 passed
Backend lint: passed
Frontend build: passed
Desktop shell check: passed
```
