# Internal TODO

This file tracks practical team work. It is intentionally more concrete than `ROADMAP.md`.

## Now

- [x] v12 — Secret Storage Hardening
- [x] Add auth middleware tests
- [x] Add basic secret redaction tests
- [x] Add settings/secrets foundation tables and document current starter limitations
- [x] Document safe local vs remote controller deployment
- [x] v12: move remote profile API keys from profile rows into the `secrets` table

## Next

- [x] Advisor Accuracy and UX
- [x] Better metrics charts and alert cards
- [x] Model Hub: curated model list with download/register/create/start actions
- [ ] Download queue UX polish
- [ ] Project screenshots and short demo GIFs
- [x] Desktop shell spike: Electron vs Tauri
- [ ] Remote deployment helper script for DGX Spark / Linux workstation

## Later

- [ ] Full vLLM argument schema by vLLM version
- [ ] Docker runner mode
- [ ] Benchmark runner wrapper around `vllm bench`
- [ ] Model compatibility database
- [ ] Prometheus/Grafana export helper
- [ ] Signed desktop builds
- [ ] Auto-update story

## Known bugs / debt

- [x] Remote profile API keys are stored in `secrets` instead of profile rows. SQLite remains sensitive.
- [ ] Compatibility Advisor estimates are heuristic and can be wrong for MoE, quantized, or unusual architectures.
- [ ] Metrics parsing extracts a useful subset, not all vLLM metrics; v14 adds history and alerts but not full Prometheus coverage.
- [ ] Frontend is functional but not yet polished like a production desktop app.
- [ ] Some pages are simple shells and need richer empty/error/loading states.
- [ ] There is no end-to-end Playwright test suite yet.

## Needs decision

- [ ] Final project name: `vLLM Control Center` vs a shorter branded name.
- [ ] License: currently MIT; confirm before public GitHub launch.
- [ ] Desktop shell: Electron or Tauri.
- [ ] Secret storage beyond SQLite: OS keychain, encrypted file provider, or platform-specific adapter.
- [ ] Remote controller auth model: API key only vs future user/session auth.
- [ ] Whether to support non-NVIDIA backends in early public release.

## Parking lot

- [ ] RAG playground.
- [ ] MCP server management.
- [ ] Kubernetes/OpenShift deployment helpers.
- [ ] Multi-user workspace.
- [ ] Billing/cost dashboard.
- [ ] Fine-tuning workflows.

## Added after v11

- [x] v12 — Secret Storage Hardening: move remote profile API keys to the `secrets` table.
- [ ] Add optional OS keychain integration research note.
- [ ] Add controller auth examples for reverse proxy / Tailscale / LAN deployment.

## Added after v12

- [x] Audit v12 before selecting the next milestone.
- [x] Decide whether Advisor Accuracy and UX or Metrics UX is the next product milestone.
- [x] v13 — Advisor Accuracy and UX.
- [x] Audit v13 before selecting the next milestone.
- [x] Decide whether Metrics UX or OS Keychain research is next.
- [x] v14 — Metrics UX.
- [x] Audit v14 before selecting the next milestone.
- [x] Decide whether OS Keychain research, desktop shell spike, or Prometheus/Grafana export helper is next.
- [x] Research OS keychain integration for optional future secret provider.
- [ ] Consider SQLite file permission checks/warnings in Setup Doctor.

## Added after v14

- [x] v15 — OS Keychain Research Spike.
- [ ] Decide whether to activate keyring storage or keep it as a later desktop-packaging milestone.
- [ ] Add fake keyring store tests if/when production secret helpers become backend-selectable.
- [x] Desktop shell spike: evaluate Tauri/Electron controller lifecycle.
- [ ] Prometheus/Grafana export helper.


## Added after v15

- [x] v16 — Desktop Shell Spike.
- [x] v16.1 — Desktop/Auth Audit Fix Pass.
- [x] v17 — Model Hub / Quick Launch UX.
- [x] v18 — Server Page Polish / Model Hub Integration.
- [x] v18.1 — Server UX Audit Fix after real install test.
- [ ] Decide whether Electron remains the near-term desktop shell or Tauri becomes the production target.
- [ ] Document controller auto-start and keep-running-on-close behavior before implementing it as a default.


## Added after v16 audit

- [x] v16.1 — Desktop/Auth Audit Fix Pass.
- [x] Add desktop shell check to GitHub CI.
- [x] Restrict Electron external links to `http:` and `https:`.
- [x] Add desktop `package-lock.json` and pin Electron to an audited patch version.
- [x] Disable generic remote forwarding by default behind `VCC_ALLOW_REMOTE_FORWARDING`.
- [x] Fix stale internal handoff/alignment docs.
- [x] v17 — Model Hub / Quick Launch UX.
- [x] v18 — Server Page Polish / Model Hub Integration.
- [x] v18.1 — Server UX Audit Fix after real install test.


## Added after LM Studio screenshot review

- [x] v17 — Add visible model catalog and one-click download/register/create/start flow.
- [x] Make a dedicated Server page with selected model picker, start/stop toggle, supported endpoints, model inspector, and live logs in one view.
- [x] Add selected server state persistence and stronger empty/loading/error states.
- [x] Add local model discovery from Hugging Face cache directories.
- [ ] Add model-card metadata/probe for downloaded models.


## Added after v18.1

- [x] v19 — Server Page Real-World Polish.
- [x] Add catalog tag filters/chips to the Server page.
- [x] Show selected-model download status near the model actions.
- [x] Add first-run guidance and vLLM CLI readiness messaging.
- [x] Add inline quick test prompt for running local instances.
- [x] Expand model inspector with catalog, instance, download, and runtime details.
- [x] v19.1 — Hugging Face Catalog Bridge.
- [x] v19.2 — Fresh Model Discovery modes for Hugging Face.
- [ ] Real Install Server QA on DGX/local machines.
- [ ] Add screenshots/GIFs for Server flow.
- [ ] Add local Hugging Face cache discovery.
- [ ] Add downloaded model-card metadata/probe.

## Added after v19.2

- [ ] Real install QA on DGX/local with HF discovery modes and HF_TOKEN.
- [ ] Confirm gated model error messaging during real downloads.
- [ ] Consider saving favorite HF search results into a local collection.

## Added after v20

- [x] Local Models page with on-device catalog, load/unload, and scanned cache paths.
- [ ] Parse local model `config.json` / model card metadata for richer inspector fields.
- [ ] Detect GGUF files and quantization labels in arbitrary local folders.
- [ ] Add screenshots/GIFs for Local Models and Server Load/Unload flow.

## Added after v20.5

- [ ] Improve local metadata detection for downloaded variants.
- [ ] Read HF `config.json` and display architecture/context length in Local Models.
- [ ] Detect local GGUF files and show quantization in Local Models.
- [ ] Add a richer LM Studio-like variant modal with README preview later.


## Next after v20.5

- [ ] v20.5 — Server Page Real QA Fixes on DGX/local installs.
- [ ] Capture screenshots for README/docs.
- [ ] Validate HF discovery + variant download + local load/unload end-to-end.


## Next

- [ ] v20.8 — First Successful Load QA
- [ ] Test guided flow on DGX/local install
- [ ] Improve real vLLM start failure guidance

## Added after v20.7

- [x] v20.8 — First Successful Load QA: guided success checklist, local-copy-aware load path, successful test state, and endpoint-copy completion.
- [ ] Real DGX first-load QA with screenshots/GIFs.
- [ ] Add Playwright smoke test for Server Simple Mode when test fixtures are ready.



## After v20.9

- [ ] Test `VCC_MODEL_DIRS` on the real DGX install.
- [ ] Tune scanner noise if too many non-model folders appear.
- [ ] Add screenshot/demo for This device → Load Model.


## After v21

- QA the scanner on the real DGX model directories.
- Check whether vLLM can load each detected local path directly.
- Add better grouping if scanner finds too many variants.
- Consider a native folder picker in the desktop shell.
