# v22.1 — First-Run Setup Doctor

## Goal

Make a fresh beta install feel less scary. A new user should be able to open the app and immediately understand whether the machine can run a model, what is missing, and which one-click action to try next.

This pass keeps the UX aligned with the product positioning:

> LM Studio UX + vLLM power + remote GPU ops.

It does **not** add another operator dashboard. It turns existing diagnostics into a plain-English setup layer.

## User-facing changes

### Run Model setup doctor card

The Run Model page now starts with a compact **v22.1 setup doctor** card showing:

- vLLM installed
- GPU visible
- model source ready
- Hugging Face token optional/available
- endpoint port status
- endpoint live status

The headline is simple:

- `Your machine is ready to run models`
- or `N things need attention`

Each issue has a direct action where possible:

- Copy install command
- Recheck
- Add `./models`
- Scan Hugging Face cache
- Download starter model
- Browse Hugging Face

### Friendlier Setup Doctor page

The advanced Setup Doctor page is now useful for beta support and first-run debugging. It includes:

- a first-run hero summary
- plain-English checks
- starter model recommendations
- scanned model paths
- GPU details
- warnings only after the main guidance

### Starter model recommendations

v22.1 adds simple starter recommendations instead of a giant catalog:

- **Fast smoke test:** `Qwen/Qwen3-0.6B`
- **Coding starter:** `Qwen/Qwen2.5-Coder-7B-Instruct`
- **Bigger GPU:** `Qwen/Qwen3-14B`

The goal is to help users validate the install before reaching for a huge model.

### Hugging Face token check

The backend doctor now reports whether `HF_TOKEN` or `HUGGING_FACE_HUB_TOKEN` is present. This is intentionally optional:

- public models can work without a token
- gated/private downloads need a token

### Port check

The Run Model setup doctor now checks whether the selected endpoint port appears available. If the model is already running, the port is treated as healthy because the live endpoint is expected to occupy it.

## Scope control

v22.1 intentionally avoids:

- exposing full environment variables
- dumping stack traces in the first-run card
- expanding primary navigation
- making users understand every vLLM CLI flag

Advanced details remain available under existing advanced areas.

## Manual smoke test

Run through these before a public beta tag:

1. Fresh browser state, no models, no running instance.
   - Run Model shows setup doctor.
   - Missing model source suggests Add `./models`, Scan HF cache, and starter download.
2. vLLM missing.
   - Setup doctor shows `vLLM installed` as attention.
   - Copy install command copies `python -m pip install vllm`.
3. No NVIDIA GPU visible.
   - GPU check is attention.
   - Recheck refreshes doctor state.
4. Local model available.
   - Model source becomes ready.
   - Use local model switches to This device.
5. Active download.
   - Model source shows working, not failed.
6. Running instance.
   - Endpoint live becomes ready.
   - Port check does not incorrectly warn just because the running endpoint occupies the port.
7. HF token unset.
   - Hugging Face token is optional, not a blocker.
8. HF token set.
   - Doctor reports token available without revealing the token value.

## Files touched

- `controller/app/core/doctor.py`
- `controller/app/schemas/system.py`
- `controller/app/api/server.py`
- `frontend/src/api/client.ts`
- `frontend/src/pages/App.tsx`
- `frontend/src/pages/ServerPage.tsx`
- `frontend/src/pages/SetupPage.tsx`
- `frontend/src/style.css`
