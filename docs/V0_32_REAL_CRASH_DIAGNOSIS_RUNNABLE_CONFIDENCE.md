# v0.32 — Real Crash Diagnosis & Runnable Model Confidence Pass

v0.32 keeps the beta web-first and keeps Daily mode focused on the main path:

```text
Pick model -> Start -> Test -> Copy OpenAI base URL
```

This release fixes the next real feedback issue: too many models appeared as **CRASHED** without a useful reason. The app should not make a runnable model feel impossible just because the first attempt failed.

## Product rules for this pass

- Keep Qwen3.6 and large Qwen text-generation models runnable.
- Do not block models just because they are large.
- Treat size as a capacity/settings question, not incompatibility.
- Keep exact paths, raw logs, and tracebacks in details/logs.
- Keep the main rows calm: show a short failure reason and clear next actions.

## Failure types now separated

- Port already used
- vLLM not installed or running in the wrong Python environment
- Unsupported architecture
- Missing tokenizer files
- Missing config.json
- Bad Hugging Face cache/snapshot path
- Insufficient GPU memory
- Wrong model type, such as image/audio/diffusion
- Unknown vLLM crash

## User-facing recovery actions

- Retry, including retrying on a different/free port where possible
- Open logs
- Use Low VRAM / safer settings
- Pick another model
- Recheck model discovery

## UI behavior

Run Model and Models now show the short reason beside failed/CRASHED state. The raw detail stays in the recovery helper, logs, and model detail drawer. The model picker remains scrollable.

## Verification target

Before publishing v0.32, run:

```bash
./scripts/check.sh
./scripts/version-scheme-check.sh
./scripts/release-freeze-check.sh
./scripts/bug-bash-check.sh
./scripts/check-screenshots.sh
./scripts/smoke.sh
./scripts/launch-check.sh
```

The Electron shell remains preview-only.
