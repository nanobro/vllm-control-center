# v17 — Model Hub Quick Launch

v17 addresses the biggest UX gap from the LM Studio comparison: users should see models, download/register them, select one, and start a server without manually bouncing between low-level pages.

## What changed

- Added a curated starter catalog at `GET /api/model-hub/catalog`.
- Added catalog actions:
  - `POST /api/model-hub/catalog/{id}/register`
  - `POST /api/model-hub/catalog/{id}/download`
  - `POST /api/model-hub/catalog/{id}/quick-launch`
- Added a frontend **Model Hub** page near the top of navigation.
- Added quick actions:
  - Register
  - Download
  - Create Instance
  - Create + Start

## Important vLLM distinction

LM Studio often presents GGUF/MLX model files. vLLM usually serves Hugging Face Transformers/safetensors repos. The Model Hub therefore starts with HF repository IDs and avoids presenting GGUF as the main path.

## Why this matters

Before v17, the pieces existed but the user experience was too admin-like:

```text
Models page + Downloads page + Instances page
```

v17 gives users the higher-level flow they expected:

```text
Model Hub -> choose model -> download/register -> create instance -> start
```

## Still not done

The next UX milestone should merge the selected model/server experience into a stronger **Server** page:

- model picker at top
- start/stop/eject-style controls
- supported endpoints
- model inspector
- live logs
- quick export snippets

That is closer to LM Studio's developer/server tab and should come before heavy desktop controller lifecycle work.
