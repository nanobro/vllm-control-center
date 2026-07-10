# v13 — Advisor Accuracy and UX

v13 improves the Model Compatibility Advisor without changing the core product direction.

## Why this milestone exists

The original plan calls for a control center that helps users launch vLLM safely instead of memorizing CLI flags. The Compatibility Advisor is the pre-launch guardrail for that workflow: it should warn users before they try to launch a model that is likely to run out of memory.

## Added

- Architecture presets:
  - `auto`
  - `qwen`
  - `llama`
  - `mistral`
  - `mixtral`
  - `deepseek`
  - `custom`
- Better KV cache estimates using:
  - layers
  - attention heads
  - KV heads
  - head dimension
  - expected concurrency
  - cache dtype
- Cache dtype estimate support:
  - `auto`
  - `float16`
  - `bfloat16`
  - `fp8`
  - `fp8_e4m3`
  - `fp8_e5m2`
- Suggested vLLM settings returned by the API.
- Copyable vLLM args returned by the API.
- Recommendation patches with optional vLLM args.
- Frontend controls for architecture, quantization bits, KV cache dtype, expected concurrency, and manual architecture overrides.
- "Use detected GPU" flow.
- Model Registry selector on the Compatibility page.
- Recipe creation now preserves KV cache dtype as extra args when selected.

## Notes

The advisor remains heuristic. It is meant to help users avoid obviously bad launches, not guarantee that a model will fit. Real vLLM memory behavior depends on the exact model config, quantization backend, GPU driver/runtime, attention implementation, scheduler settings, and concurrency.

## Verification

```text
Backend tests: 43 passed
Backend lint: passed
Frontend build: passed
```
