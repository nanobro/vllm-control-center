# v0.30 — LM Studio Familiarity & Auto-Detect Fix Pass

This release responds to real beta feedback from the Run Model screen.

## Fixes

- Long model IDs and filesystem paths no longer overflow the daily Run Model layout.
- The right-side model detail drawer now truncates noisy names safely and wraps paths/URLs.
- Daily copy leans closer to the LM Studio mental model: pick model, Start, Test, Copy base URL.
- The app now scans more folders automatically:
  - Hugging Face cache
  - LM Studio model folders
  - vLLM cache
  - Unsloth cache/folder
  - `~/Downloads`
  - `~/models`
  - `./models`
  - `./controller/models`
  - env roots: `VCC_MODEL_DIRS`, `VCC_EXTRA_MODEL_DIRS`, `VLLM_MODEL_DIRS`, `UNSLOTH_MODEL_DIRS`, `LMSTUDIO_MODEL_DIRS`

## Non-goals

- No new Daily mode surface.
- No desktop installer promise.
- No feature expansion beyond beta feedback fixes.

## Manual check

Use a machine with existing LM Studio/HF/Unsloth/vLLM model folders and verify that Run Model shows detected models without pasting a folder path first.
