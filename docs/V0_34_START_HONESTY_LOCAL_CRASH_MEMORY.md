# v0.34 — Start Honesty & Local Crash Memory Pass

## Why this exists

v0.33 fixed the biggest trust problem: a spawned `vllm serve` process is not treated as endpoint-ready until `/v1/models` or `/health` responds.

v0.34 fixes the next layer of confusion:

- API responses still sounded like a model was loaded immediately after a start request.
- Local model rows could show CRASHED without preserving the useful plain-English reason near the row.
- The UI could recommend a recently crashed local variant as the “best local pick,” which felt like the app was ignoring the failure.

## Product rule

Keep Daily mode simple:

```text
Pick model -> Start -> Test -> Copy OpenAI base URL
```

Do not add more dashboard clutter. Keep exact paths, raw logs, and tracebacks in details/logs. Keep Qwen3.6 and large Qwen text-generation models runnable; size alone is not incompatibility.

## What changed

- Local-load responses now include `start_requested` and a warm-up message when vLLM was launched but the endpoint is not ready yet.
- Quick-launch responses now include `start_requested` and a warm-up message for the same reason.
- Quick-launch responses reload instance config before returning, so backend next-free-port selection is reflected in the response.
- Local model records include `active_last_error`, allowing the UI to show the last crash reason beside retryable rows.
- Run Model local picker labels can show `CRASHED: <reason>` for local variants that failed recently.
- Local Models rows show the recent failed-load reason without exposing noisy full paths.
- Recommended local model ranking penalizes recently crashed variants so a cleaner candidate is preferred when available.

## Non-goals

- No generic chat UI.
- No new Daily mode dashboard cards.
- No signed desktop installer promise.
- No model-size-only blocking.
- No claim that every Hugging Face model or quantization is vLLM-compatible.

## Verification

Required checks for this pass:

```bash
./scripts/version-scheme-check.sh
./scripts/release-freeze-check.sh
./scripts/bug-bash-check.sh
./scripts/check-screenshots.sh
./scripts/smoke.sh
./scripts/launch-check.sh
./scripts/check.sh
```

A real vLLM-capable manual run is still needed before claiming public model-load success on a release page.
