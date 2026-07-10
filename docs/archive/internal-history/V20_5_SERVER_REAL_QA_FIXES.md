# v20.5 — Server Page Real QA Fixes

v20.5 is a real-install polish pass for the LM Studio-style Server page.

It does not add a new major product area. It tightens the single-page model workflow so a user on a DGX/local workstation can diagnose setup, refresh state, see local/download status, pick HF variants, and test a loaded model with less page-hopping.

## Added

- `GET /api/server/qa`
  - Aggregates vLLM CLI readiness, GPU visibility, download queue state, local model discovery, and instance counts.
  - Read-only: no process starts, no file mutation.
- Server page QA strip with readiness checklist.
- Server page "Refresh all" action for HF catalog, variants, downloads, instances, local models, and QA state.
- Local/on-device indicators in the selected model card.
- Variant-aware download job matching when a selected HF variant has an `allow_patterns` entry.
- Metrics-unavailable inline guidance when a running server cannot expose metrics.

## Why

LM Studio's core UX works because the user can understand the local machine state at a glance. v20.5 moves the Server page closer to that: instead of leaving diagnostics hidden in Setup Doctor, Downloads, Local Models, and Instances, the Server page now has a compact install-readiness panel.

## Non-goals

- No controller lifecycle/autostart changes.
- No model file deletion.
- No automatic vLLM install.
- No background migration of model files.

## Manual QA checklist

1. Start backend and frontend.
2. Open Server.
3. Confirm the QA strip shows vLLM/GPU/download/local-model/instance state.
4. Switch to Hugging Face source.
5. Browse trending/recent/downloaded models.
6. Select a variant and queue a download.
7. Confirm download status appears near the selected model.
8. Refresh all and confirm Server/Downloads/Local Models stay in sync.
9. Create + Load a model.
10. Confirm endpoint, logs, quick test, metrics, and command preview update.
11. Unload model.

