# v20.1 — Hugging Face Quantization Variant Picker

LM Studio does not only show model repositories. It shows downloadable variants: GGUF files, quantization levels, safetensors snapshots, and file sizes. v20.1 adds the first version of that layer.

## Added

- `GET /api/model-hub/hf/variants`
- HF repo file tree inspection via the Hugging Face API
- GGUF variant detection such as Q4_K_M, Q5_K_M, Q8_0, F16
- Safetensors snapshot detection
- Variant metadata:
  - format
  - quantization
  - file path
  - file size
  - recommended flag
  - `allow_patterns` for targeted downloads
- Server page variant selector for Hugging Face catalog results
- Selected variant is passed to download jobs
- Download jobs now preserve `allow_patterns`

## Why this matters

A model repo is not always the thing users choose. For local inference, users often choose a specific file or quantization. This milestone moves the app closer to LM Studio's model loading UX.

## Current limitations

- Variant detection is heuristic.
- vLLM support for GGUF/quantized repos depends on installed vLLM version and model family.
- The app does not yet display a full LM Studio-style modal with README preview and per-file download options.
- File listing depends on Hugging Face network access and optional HF token env var.

## Next suggested milestone

v20.2 — Local Model Metadata Polish:

- inspect downloaded model files more deeply
- read `config.json`
- detect GGUF metadata when possible
- show quantization/format/arch in Local Models
- improve model inspector parity with LM Studio
