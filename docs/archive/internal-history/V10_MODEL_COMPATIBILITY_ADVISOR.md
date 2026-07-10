# v10 — Model Compatibility Advisor

v10 adds a planning layer before users launch vLLM: a best-effort memory compatibility advisor.

The goal is not to guarantee exact fit for every architecture. The goal is to prevent obvious failures, teach users which settings matter, and create a launch recipe from a reasonable starting point.

## What it estimates

The advisor combines:

- model parameter count, entered manually or inferred from names like `Qwen3-32B`
- dtype / quantization bit assumptions
- max model length
- rough KV cache estimate
- GPU total/free memory
- `gpu_memory_utilization`
- tensor parallel size
- overhead and safety margin

It returns one of:

- `likely_fits`
- `borderline`
- `unlikely`
- `unknown`

## New backend routes

```http
POST /api/compatibility/estimate
POST /api/compatibility/recipe
```

`/estimate` returns a structured estimate, assumptions, warnings, and recommended config patches.

`/recipe` creates a saved recipe from advisor settings so the user can move from planning to launching.

## New frontend page

The new **Compatibility** page lets users:

- enter a model ID
- optionally enter parameter count / hidden size / layer count
- use detected GPU memory from Setup Doctor
- estimate fit
- see memory breakdown
- create a recipe from the settings

## Limitations

This is deliberately approximate. Real memory usage can vary by:

- model architecture
- attention implementation
- quantization format
- cache dtype
- vLLM version
- multimodal components
- tokenizer/model-specific overhead
- concurrent requests

The UI should always present this as a planning estimate, not a guarantee.
