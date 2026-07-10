# Plan Alignment Review

This document checks whether the implementation is still aligned with the original plan.

## Original positioning

> LM Studio UX + vLLM power + remote GPU ops.

The repo is aligned. It has not drifted into a generic chat UI, and it continues to treat vLLM as the inference engine while adding a control layer around launch, observability, playground testing, export, and remote operations.

## What the plan said to build first

1. Controller API
2. Environment doctor
3. vLLM config compiler
4. Process manager
5. Live logs
6. Dashboard
7. Playground
8. Metrics
9. Recipes
10. Export
11. Remote controller
12. Desktop shell

## Actual implementation sequence

| Planned item | Implementation state | Version line |
|---|---:|---|
| Controller API | Done | v1+ |
| Environment doctor | Done | v1+ |
| vLLM config compiler | Done | v1+ |
| Process manager | Done | v1+ |
| Live logs | Done | v3 |
| Dashboard | Basic done | v1+ |
| Playground | Done | v2-v3 |
| Metrics | On track | v2+, improved v14 |
| Recipes | Done | v3 |
| Export | Done | v2+ |
| Remote controller | Done | v4-v6 |
| Desktop shell | Started | v16-v17 |

## Intentional additions beyond MVP

- Hugging Face download queue and hardening.
- Model Compatibility Advisor and v13 advisor accuracy/UX improvements.
- v14 Metrics UX: operator cards, alert states, snapshot history, and simple charts.
- Open-source project hygiene.
- Internal dev tracking docs.

These additions support the original positioning rather than distract from it.

## Areas at risk of drift

- Too many playground features could make the project look like a chat app.
- Too many model marketplace features could distract from vLLM ops.
- Remote features without stronger controller auth could create trust concerns.
- Compatibility estimates could be over-trusted if warnings are not clear.

## Guardrails

- Keep README language focused on control plane, not chat.
- Keep Open WebUI integration as a bridge, not a replacement.
- Prioritize auth/secrets before more remote power features.
- Keep vLLM command/export/config workflows central.
- Use `docs/dev/DECISIONS.md` to prevent architecture churn.

## Recommendation

v18.1 is complete and remains aligned with the original plan: the project now prioritizes the concrete LM Studio-like server workflow before deeper desktop lifecycle work.


## v16 alignment note

The desktop shell spike aligns with the original plan to defer desktop packaging until the controller workflows were stable. The implementation remains a wrapper around the web-first architecture, not a fork of the app.


## v17 alignment note

The desktop/auth audit fix pass preserves the original strategy. It does not add another surface area for inference or chat; it reduces risk around the desktop shell and remote bridge before the next lifecycle milestone. Generic remote forwarding is now disabled by default, and dedicated bridge routes remain the preferred mechanism.


## v17 note — Model Hub correction

After comparing against LM Studio screenshots, the project needed a more obvious primary flow: model catalog -> download/register -> create instance -> start/stop. v17 adds this Model Hub while preserving the vLLM-specific architecture. This corrects the UX gap without changing the product into a generic chat UI.


## v18.1 note — Server page correction

The LM Studio screenshots made the gap obvious: users need one primary page for selecting a model, starting/stopping the server, copying the endpoint, viewing supported endpoints, seeing logs, and inspecting the model. v18 added this Server page while preserving the vLLM-specific control-plane architecture. v18.1 fixes the first round of real-use friction: selected state persistence, loading states, copy feedback, port warnings, clearer empty/error states, and safer instance ejection.


## v19.2 note — Server real-world polish

v19.2 stays aligned with the original plan by making the local server flow more obvious and practical: filter/select a catalog model, see download/register/running status, start/stop a vLLM instance, copy the endpoint, run a tiny inline test, and inspect logs/metrics from the same Server page. This reinforces the control-plane positioning instead of drifting into a generic chat UI.

## v19.2.1 alignment note

v19.2.1 moves the project closer to the LM Studio-style core flow by letting users discover real Hugging Face models from the Server page instead of only using hardcoded curated catalog entries.


## v20 alignment note

The project corrected another LM Studio UX gap: users need to see models already on the device and load/unload them directly. v20 adds a local model library and preserves the control-plane architecture: no inference engine replacement, no destructive file management, and no generic chat-UI drift.

## v20.8 alignment note

LM Studio lets users pick model variants and quantizations, not just model repos. v20.8 keeps the project aligned with the core "LM Studio UX + vLLM power" direction by adding HF variant discovery and targeted downloads while avoiding hardcoded stale model examples.


## v20.8 alignment note

v20.8 reinforces the original LM Studio-style goal by making Load/Unload a first-class model lifecycle instead of exposing accidental duplicate instance creation. This keeps the UI centered on user language while preserving the underlying vLLM instance model.


## v20.8 alignment

The project remains aligned with the North Star by reducing UI complexity and prioritizing the model lifecycle flow: discover/download/load/test/copy endpoint.


## v20.9 alignment

This version improves the LM Studio-style local model lifecycle: detected on-device model list → Load/Unload from the app.


## v21 alignment

v21 supports the LM Studio-style goal: local models should appear as a list and be loadable from the app without users manually registering paths or editing env vars.
