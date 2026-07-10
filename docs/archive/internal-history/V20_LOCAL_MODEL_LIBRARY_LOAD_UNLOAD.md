# v20 — Local Model Library + Load/Unload UX

v20 responds to the LM Studio UX gap where users expect a clear **on-device model catalog** and language like **Load / Unload** instead of only low-level instance management.

## Added

- `GET /api/local-models` lists models already known on this device.
- `POST /api/local-models/load` creates a vLLM instance from a local model or registry record and optionally starts it.
- `POST /api/local-models/{instance_id}/unload` stops the loaded instance without deleting model files.
- New `Local Models` frontend page with an LM Studio-like table.
- Server page copy now uses **Load Model / Unload Model** terminology.

## Discovery sources

The local library combines:

- Model Registry rows.
- Completed/active download jobs.
- Existing instances.
- Hugging Face cache directories:
  - `$HF_HOME/hub`
  - `$HUGGINGFACE_HUB_CACHE`
  - `~/.cache/huggingface/hub`
  - project-local `./models`

The local scan is intentionally conservative and filesystem-only. It does not delete, move, or mutate model files.

## Safety

- Loading creates an instance using the local path when available; otherwise it falls back to the model ID.
- Unloading stops the server instance only.
- Ejecting a stopped instance deletes the instance record/logs/metrics only, never the model files.

## Follow-up

v20 makes local model visibility real, but model metadata probing is still basic. Future work should parse model cards/config files where possible and improve GGUF/safetensors metadata display.
