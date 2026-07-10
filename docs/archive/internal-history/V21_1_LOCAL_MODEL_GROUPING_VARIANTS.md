# v21.1 — Local Model Grouping / Variant UX

v21.1 improves the on-device model experience so detected local models are not shown as one long, flat list.

## What changed

- Local model records now include grouping metadata:
  - `group_id`
  - `group_name`
  - `variant_label`
  - `variant_rank`
  - `sibling_variant_count`
- The local model API now returns grouped model variants in `groups`.
- A new read-only endpoint is available:
  - `GET /api/local-models/groups`
- The Server page `This device` picker now renders local models as grouped variants.
- GGUF variants in the same folder are grouped together, for example:

```text
TinyLlama-GGUF
  ├─ Q4-K-M · tinyllama.Q4_K_M.gguf
  └─ Q8-0 · tinyllama.Q8_0.gguf
```

## Rules

The scanner remains read-only. It does not delete, move, rename, or mutate model files or Hugging Face cache folders.

## Why this matters

LM Studio feels easier because users pick a model family first, then pick the quantization. v21.1 moves vLLM Control Center in that direction for local/on-device models.
