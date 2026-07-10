# v20.9 — On-device Model Scanner + Load from List

v20.9 makes the LM Studio-style path more direct: the Server page can now start from models already present on the machine, not only from built-in or Hugging Face discovery.

## What changed

### Server source: This device

The Server page now has a primary source:

- This device
- Built-in
- Hugging Face

`This device` is the default source. It lists models detected from local model locations and lets the user load them without re-registering or re-downloading.

### Scan locations

The local scanner looks at:

- `HF_HOME/hub`
- `HUGGINGFACE_HUB_CACHE`
- `~/.cache/huggingface/hub`
- `./models`
- `VCC_MODEL_DIRS`
- `VCC_EXTRA_MODEL_DIRS`

`VCC_MODEL_DIRS` and `VCC_EXTRA_MODEL_DIRS` accept `:` or `;` separated paths.

Example:

```bash
export VCC_MODEL_DIRS="/data/models:/mnt/models:/home/ritrit/models"
```

### Detected formats

The scanner is read-only and detects common local layouts:

- Hugging Face cache directories: `models--org--model/snapshots/<revision>`
- local HF snapshot folders containing `config.json`
- GGUF files such as `model.Q4_K_M.gguf`
- Safetensors snapshots
- PyTorch `.bin` snapshots

### Load behavior

When a local model is selected, the Server page uses `/api/local-models/load` and passes the local path to vLLM. It follows the existing state machine:

1. Reuse running instance if one already exists.
2. Reuse stopped/crashed instance if available.
3. Create a new instance only when needed.

## Why this matters

LM Studio users expect:

```text
models on disk → visible list → click load → unload later
```

v20.9 moves us closer to that model. Users no longer need to know about model registry or instance creation for local models.
