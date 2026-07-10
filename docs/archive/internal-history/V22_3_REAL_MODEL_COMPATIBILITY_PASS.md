# v22.3 — Real Model Compatibility Pass

## Goal

Make the local model library better at answering the first practical question:

> Can this model probably be loaded by vLLM, and what should I check first?

This release keeps the app simple. It does not expose a giant compatibility database or force users into raw vLLM arguments. It adds lightweight, read-only file inspection and plain-English labels in the Models library and Model Detail Drawer.

## What changed

### Backend scanner

The local scanner now extracts more real-world metadata from on-device model folders and files:

- Safetensors snapshots
- PyTorch `.bin` snapshots
- GGUF files
- AWQ and GPTQ quantization hints from `quantization_config`
- bitsandbytes-style quantization hints when present
- FP16/BF16/FP32 dtype hints from `torch_dtype`
- context length from common config keys and basic RoPE scaling metadata
- tokenizer presence
- config presence
- weight file count
- multi-file shard detection

The scanner remains read-only and heuristic. It never mutates model directories or Hugging Face cache data.

### Compatibility labels

Each local model can now report:

- `ready` — common vLLM snapshot files are present
- `likely` — looks loadable, but something useful is missing or uncertain, such as tokenizer files
- `limited` — load with care, currently used for GGUF-style single-file variants
- `attention` — missing required-looking model files or path/config problems
- `unknown` — not enough local metadata yet

The UI shows these as simple chips such as **vLLM-ready files**, **Likely vLLM-ready**, or **GGUF: load with care**.

### UI updates

- Models library rows now show compatibility chips, weight shard count, and dtype hints.
- Model Detail Drawer now includes:
  - config found / not found
  - tokenizer found / not found
  - weight file count
  - dtype hint
  - suggested load format
  - plain-English compatibility reasons
- Run Model recommendations now slightly prefer models that look vLLM-ready.

## Out of scope

- No full vLLM version-specific support matrix yet.
- No online model metadata lookup during local scans.
- No automatic fix for incompatible models.
- No raw operator wall of warnings in the primary flow.

## Manual QA

1. Put a standard Hugging Face Safetensors snapshot under a scan path.
2. Confirm Models shows **vLLM-ready files** when config, tokenizer, and weights exist.
3. Remove tokenizer files and confirm the status becomes **Likely vLLM-ready** with a tokenizer warning.
4. Add AWQ or GPTQ `quantization_config` and confirm the quantization chip appears.
5. Add multiple `model-0000x-of-0000y.safetensors` shards and confirm shard count appears.
6. Add a GGUF file and confirm it appears as **GGUF: load with care**.
7. Select each model and confirm the detail drawer explains the status without requiring advanced settings.
