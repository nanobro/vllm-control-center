# v21.4 — Model Detail Drawer

v21.4 adds a shared right-side model detail drawer across the LM Studio-style model flow.

## Goal

When a user selects a model or download, the app should answer the next obvious questions without forcing them into advanced pages:

- What file/path is this?
- Is it local, downloaded, loading, or loaded?
- What format/quant/context do we know?
- What vLLM settings will be used?
- What should I click next?

## Where it appears

### Server / This device

Simple Mode now shows a right-side detail drawer next to the four-step run flow. It updates when the selected model/variant changes and keeps the core actions close to the details:

- Load
- Unload
- Test
- Logs
- Copy endpoint

### Local Models

The Local Models table is now selectable. Clicking a row opens the same drawer with:

- model path
- source
- format
- quantization
- size
- architecture
- context length
- loaded/download status
- safe default vLLM settings

### Downloads

Download cards are now selectable. The drawer shows download-oriented details:

- local target path
- selected HF file/variant pattern
- inferred format/quantization when available
- progress/status
- Load now for completed jobs
- copy endpoint after a loaded instance exists

## UX decisions

- Keep advanced/operator concepts out of the main path.
- Present recommended vLLM settings as simple chips, not raw JSON.
- Use the same drawer component everywhere to reduce UI learning cost.
- Keep advanced controls behind existing advanced panels.
- Do not delete model files from any drawer action.

## Verification

- Frontend build passes.
- Backend tests pass.
- Existing Local Models, Downloads, and Server workflows remain API-compatible.
