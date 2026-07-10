## v0.62 — GitHub Public Repo Cleanup Pass

- Prepared the source tree for first public GitHub publication.
- Archived old internal v3-v24 history docs under `docs/archive/internal-history/` so first-time visitors see the current public beta path first.
- Trimmed public agent prompts to `NEXT_AGENT_PROMPTS.md` plus the latest v0.58-v0.62 handoff prompts; older prompts now live under `docs/archive/agent-prompts/`.
- Added `docs/GITHUB_RELEASE_CHECKLIST.md` with pre-push, pre-tag, and first-release checks.
- Added README beta status / what works / known limitations near the top.
- Bumped frontend and controller package metadata to `0.62.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, and next-agent handoff for v0.62 / next v0.63.

## v0.61 — Easy Test Flow UX Pass

- Added a direct **Test this model** panel inside Run Model after a model is loaded.
- Added an editable one-prompt test box, starter prompt chips, and a chat-like response card so testers do not have to hunt for Playground to confirm a loaded model works.
- Renamed main-path copy from Quick test toward plain-language testing while keeping the exact tested-endpoint gating rules.
- Kept full Playground, logs, and developer handoff details available without adding dashboard clutter.
- Bumped frontend and controller package metadata to `0.61.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, and next-agent handoff for v0.61 / next v0.62.

## v0.60 — Playground Stop and First-Token Timeout Pass

- Added a Stop test control for local Playground streaming tests so users can escape a stuck generation without reloading the page.
- Added a first-token timeout for streaming tests, with plain-English guidance when a loaded model never returns tokens.
- Added an inactivity timeout for streams that begin but then stall.
- Kept Playground loaded-model source of truth, served-name auto-retry, and wildcard-host loopback connection behavior.
- Bumped frontend and controller package metadata to `0.60.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.60 / next v0.61.

## v0.59 — Playground Wildcard Host Connection Pass

- Fixed local Playground connection URLs when vLLM is bound to a wildcard host such as `0.0.0.0` or `::`.
- Playground backend tests now connect through `127.0.0.1` for wildcard bind hosts, matching the readiness probe behavior used by the process manager.
- Playground UI now displays the endpoint as `localhost` for wildcard-bound local servers, matching Run Model, Models, Downloads, and detail drawer handoff surfaces.
- Added backend tests covering wildcard-host normalization and endpoint base URL generation.
- Bumped frontend and controller package metadata to `0.59.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.59 / next v0.60.

## v0.58 — Playground Served Name Auto-Retry Pass

- Added Playground auto-retry for served-model-name mismatches so a loaded endpoint can recover when vLLM serves a different model name than the configured alias.
- Streaming Playground now retries once with the suggested `/v1/models` name instead of stopping at a confusing model-name mismatch.
- Non-streaming Playground now performs the same one-shot served-name retry and keeps the final response visible.
- Added a small auto-retry notice so users know Playground recovered without adding a new dashboard surface.
- Kept Playground tied to the actually loaded/warming local instance from v0.57.
- Kept the visible app beta badge synced to frontend package metadata.
- Kept Qwen3.6 and large Qwen text-generation models runnable; no size-only blocking.
- Bumped frontend and controller package metadata to `0.58.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.58 / next v0.59.

## v0.57 — Playground Loaded Model Source-of-Truth Pass

- Fixed Playground source-of-truth confusion after loading a model: it now lists running and warming local instances instead of showing only `No loaded models`.
- Preserved a handoff-selected instance from Run Model/Models/Downloads even while it is still warming up, so the selector no longer displays the wrong empty option.
- Added a compact selected-model summary in Playground with model name, status, and `/v1` endpoint while keeping Daily mode unchanged.
- Added a streaming timeout fallback so a stuck stream explains the likely warm-up/endpoint issue and suggests opening logs, trying non-streaming, or restarting.
- Kept the visible app beta badge synced to frontend package metadata so every version bump updates the sidebar label.
- Kept Qwen3.6 and large Qwen text-generation models runnable; no size-only blocking.
- Bumped frontend and controller package metadata to `0.57.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.57 / next v0.58.

## v0.56 — Visible Version Badge Sync Pass

- Replaced the generic/stale sidebar beta badge with a current version badge sourced from frontend package metadata.
- The sidebar now displays the active public beta version such as `v0.56 beta` instead of stale historical strings like old `v22.x beta` labels.
- Added a small frontend version module so the visible badge follows `frontend/package.json` during future version bumps.
- Updated release checks, smoke checks, docs, README, ROADMAP, milestones, release notes, bug-bash ledger, and next-agent handoff for v0.56 / next v0.57.
- Kept Daily mode simple, beta web-first, Electron preview-only, and Qwen3.6/large Qwen text-generation models runnable.

## v0.55 — Long Model ID Overflow Polish Pass

- Kept Daily mode calm when real Hugging Face IDs, served model names, snapshot filenames, and filesystem paths are very long.
- Added layout containment and safe truncation/wrapping across Run Model, Models, Downloads, Remote, model detail drawers, served-model hints, variant chips, and copy/manual-copy surfaces.
- Preserved the full values in details, titles/tooltips, drawers, and copy areas instead of exposing noisy paths on the main rows.
- Kept Qwen3.6 and large Qwen text-generation models runnable; size alone is still not treated as incompatibility.
- Bumped frontend and controller package metadata to `0.55.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.55 / next v0.56.

## v0.54 — Copy Success Confirmation & Last Copied State Pass

- Added a lightweight copy-success confirmation after successful local Run Model handoff copies.
- Added the same confirmation to Remote GPU handoff copies.
- Confirmation text names the copied payload, such as base URL, tested model name, handoff bundle, safe `.env`, curl, JavaScript, Python, or command.
- Confirmation includes a short preview plus character count so users can trust what made it to the clipboard.
- Copy confirmation clears when the selected server run, selected model, or load profile changes, avoiding stale confidence.
- Happy-path copy and manual-copy fallback remain unchanged; copy/snippets are still gated by Quick test success for the exact selected run.
- Daily mode remains simple, Electron remains preview-only, and Qwen3.6 / large Qwen text-generation models remain runnable.
- Bumped frontend and controller package metadata to `0.54.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.54 / next v0.55.

## v0.53 — Manual Copy Select-All Confidence Pass

- Added an explicit **Select all** action to the manual-copy fallback panel for local and remote endpoint handoff.
- Manual fallback payloads now show character counts so users can tell they selected the whole base URL, tested model name, handoff bundle, safe `.env`, or SDK snippet.
- Kept manual-copy fallback hidden on the happy path and still gated behind Quick test success for the exact selected run.
- Bumped frontend and controller package metadata to `0.53.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.53 / next v0.54.

## v0.52 — Manual Copy Fallback Preview Pass

- Added a visible manual-copy fallback card for local Run Model handoff when all clipboard APIs are blocked.
- Added the same selectable manual-copy fallback to Remote GPU handoff.
- Manual-copy fallback remains hidden on the happy path and clears after successful copy.
- Kept Copy/snippets gated by Quick test success for the exact selected local or remote run.
- Kept Qwen3.6 and large Qwen text-generation models runnable; no size-only blocking.
- Bumped frontend and controller package metadata to `0.52.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.52 / next v0.53.

## v0.51 — Clipboard Fallback Handoff Reliability Pass

- Added a safer clipboard helper for local Run Model, Remote, Setup, and Release copy actions.
- Copy actions now fall back to a hidden text selection path when `navigator.clipboard` is blocked by insecure origins, preview shells, or older browsers.
- Remote copy buttons now use the same fallback path as local handoff buttons instead of assuming the Clipboard API always works.
- Failure copy now tells users to select/copy manually instead of only saying the Clipboard API is unavailable.
- Kept Copy/snippets gated by Quick test success for the exact selected run.
- Kept Qwen3.6 and large Qwen text-generation models runnable; no size-only blocking.
- Bumped frontend and controller package metadata to `0.51.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.51 / next v0.52.

## v0.50 — Safe Env Handoff Quoting Pass

- Added safe `.env` value quoting for local and remote tested handoff copies.
- `.env` handoff now includes a short generated-by comment and preserves unusual tested model names or endpoint strings without breaking dotenv parsing.
- Renamed the action to `Copy safe .env` while keeping the Daily path simple and gated by Quick test.
- Kept Qwen3.6 and large Qwen text-generation models runnable; no size-only blocking.
- Bumped frontend and controller package metadata to `0.50.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.50 / next v0.51.

## v0.49 — Environment Handoff Copy Pass

- Added `Copy .env` to local and remote tested endpoint handoff surfaces.
- The `.env` block includes `OPENAI_BASE_URL`, `OPENAI_MODEL`, and an API-key placeholder suitable for local or remote use.
- Kept `.env` copy gated by Quick test success for the exact selected run.
- Bumped frontend and controller package metadata to `0.49.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.49 / next v0.50.
- Kept Daily mode simple, beta web-first, Electron preview-only, and Qwen3.6/large Qwen text-generation models runnable.

## v0.48 — Endpoint Handoff Bundle Copy Pass

- Added a one-click tested handoff bundle for local Run Model after Quick test passes.
- Added the same tested handoff bundle action for remote GPU endpoint handoff.
- The bundle copies the OpenAI base URL and the exact tested model name together, reducing stale SDK handoff mistakes.
- Kept Copy/snippets gated by Quick test success for the exact selected run.
- Kept Qwen3.6 and large Qwen text-generation models runnable; size alone remains non-blocking.
- Bumped frontend and controller package metadata to `0.48.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.48 / next v0.49.

## v0.47 — Tested Model Name Handoff Clarity Pass

- Added a visible tested model-name strip to the local Run Model handoff after Quick test.
- Added a matching tested model-name strip to the Remote GPU handoff.
- Made the exact model string that passed Quick test copyable, including auto-retried served names from `/v1/models`.
- Kept endpoint URLs visible for orientation while Copy/snippets remain gated by Quick test for the exact selected run.
- Kept Qwen3.6 and large Qwen text-generation models runnable; size alone is still not incompatibility.
- Bumped frontend and controller package metadata to `0.47.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.47 / next v0.48.

## v0.46 — Auto Served Name Retry Pass

- Local Quick test now auto-retries once with the suggested `/v1/models` served name when the first request hits a served-model-name mismatch.
- Remote Quick test now applies the same one-time auto retry through the remote controller bridge.
- Copy/snippets still require Quick test success for the exact selected run, but can now unlock after the auto retry passes.
- Last-test notes show when the tested name differs from the configured alias so users understand why snippets use that name.
- Manual **Test with this name** remains available if the auto retry also fails.
- Qwen3.6 and large Qwen text-generation models remain runnable; no size-only blocking.
- Bumped frontend and controller package metadata to `0.46.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.46 / next v0.47.

## v0.44 — Served Model Name Mismatch Guidance Pass

- Quick test and streaming failures now enrich served-model-name mismatches by reading `/v1/models` when possible.
- When vLLM is alive but the request model name is wrong, the UI can show the actual served model name and offer it as a copyable hint.
- Local and remote Quick test panels surface the suggested served model name without exposing noisy raw `/v1/models` details in the main path.
- Qwen3.6 and large Qwen text-generation models remain runnable; size alone is not incompatibility.
- Bumped frontend and controller package metadata to `0.44.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.44 / next v0.47.

## v0.43 — Streaming Test Failure Guidance Pass

- Added plain-English diagnosis to local streaming playground failures so SSE errors include `error_type`, `user_message`, and `next_actions` just like non-streaming Quick test failures.
- Local streaming now explains not-running, not-ready, route/auth, timeout, model-name mismatch, and GPU memory errors without dumping only raw vLLM output.
- Local and remote playground pages now show next-action chips for streaming and non-streaming failures.
- Copy/snippets still require a successful Quick test for the exact selected run; Daily mode remains Pick → Start → Test → Copy.
- Qwen3.6 and large Qwen text-generation models remain runnable; size alone is not incompatibility.
- Bumped frontend and controller package metadata to `0.43.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.43 / next v0.44.

## v0.40 — Tested Endpoint State Label Pass

- Made local endpoint status labels match the real handoff state: running but untested endpoints now show `untested`, and tested endpoints show `tested`.
- Updated the endpoint route grid so `/v1/models`, chat, completions, and embeddings no longer look fully ready before Quick test passes.
- Made the Remote endpoint card visually distinguish blocked, untested-running, and tested-ready states.
- Kept endpoint URLs visible for orientation, while every copy action still requires Quick test success for the selected local or remote model.
- Kept Daily mode unchanged: Pick model -> Start -> Test -> Copy OpenAI base URL.
- Qwen3.6 and large Qwen text-generation models remain runnable; size alone is not treated as incompatibility.
- Bumped frontend and controller package metadata to `0.40.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.40 / next v0.43.

## v0.39 — Remote Test-before-Copy Handoff Pass

- Applied the same Quick test-before-copy confidence rule to the Remote page.
- Remote `/v1` endpoints remain visible for the selected running model, but Copy stays disabled until that selected remote model passes Quick test.
- Updated remote endpoint helper text so stopped, starting, crashed, disconnected, untested, and tested states explain the next action plainly.
- Reset remote test/copy state when switching remote profile, selected model, or status so stale remote handoffs are not reused.
- Kept Daily mode unchanged: Pick model -> Start -> Test -> Copy OpenAI base URL.
- Qwen3.6 and large Qwen text-generation models remain runnable; size alone is not treated as incompatibility.
- Bumped frontend and controller package metadata to `0.39.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.39 / next v0.43.

## v0.38 — Detail Drawer Handoff Guard Pass

- Closed a test-before-copy loophole in the model detail drawer: the drawer now follows the same selected-instance Quick test gate as the main Run Model handoff.
- The drawer still shows the `/v1` base URL for visibility, but Copy URL is disabled until the selected running model passes Quick test.
- Added plain helper text in the drawer so users understand whether they need to start the model or test it first.
- Kept Daily mode unchanged: Pick model -> Start -> Test -> Copy OpenAI base URL.
- Qwen3.6 and large Qwen text-generation models remain runnable; size alone is not treated as incompatibility.
- Bumped frontend and controller package metadata to `0.38.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.38 / next v0.39.

## v0.37 — Test-before-Copy Handoff Pass

- Local Run Model handoff now follows the visible daily flow: Start, Quick test, then Copy.
- Copy `/v1` base URL and SDK snippets stay disabled until the selected running model passes Quick test.
- The running panel now says **Test first to copy** until the selected endpoint responds successfully.
- Developer handoff details stay available, but copy actions guard against handing off an untested or stale local endpoint.
- Quick-test success unlocks copy for the selected instance; changing model/instance resets the test and copy state.
- Kept Qwen3.6 and large Qwen text-generation models runnable; size alone is not treated as incompatibility.
- Bumped frontend and controller package metadata to `0.37.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.37 / next v0.38.

## v0.36 — Low VRAM Retry Confidence Pass

- Added a Low VRAM retry path for local models that previously crashed or failed to load.
- Low VRAM retry reuses the same stopped/crashed instance instead of creating confusing duplicates.
- Low VRAM retry applies safer serving defaults: lower GPU memory utilization, capped context length, and smaller max sequence pressure.
- Local model load responses now report the applied preset so the UI can explain whether the normal or Low VRAM path was used.
- Local Models and the model detail drawer show a compact **Low VRAM** / **Retry Low VRAM** next action only when a recent failure makes it useful.
- Kept Qwen3.6 and large Qwen text-generation models runnable; size alone is not treated as incompatibility.
- Bumped frontend and controller package metadata to `0.36.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.36 / next v0.37.

## v0.35 — Remote Endpoint Handoff Guard Pass

- Remote page now treats the selected remote model as the only source of truth for the visible/copyable `/v1` endpoint.
- Copy base URL is disabled until the selected remote controller is connected and the selected model is running.
- Stopped, starting, crashed, or disconnected remote selections now show a plain reason instead of a stale endpoint.
- Quick test only appears for the selected ready remote endpoint, preventing accidental tests against another running model.
- Remote test/copy state resets when switching profiles, switching selected models, or when selected status changes.
- Remote summary now says **Selected model** and **Selected endpoint** so users do not confuse another running model with the current handoff.
- Qwen3.6 and large Qwen text-generation models remain runnable; size alone is not treated as incompatibility.
- Bumped frontend and controller package metadata to `0.35.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.35 / next v0.36.

## v0.34 — Start Honesty & Local Crash Memory Pass

- Kept Start honest: API responses now distinguish **start requested / warming up** from a fully ready endpoint.
- Quick-launch and local-load responses include a clear warm-up message while `/v1/models` readiness is still pending.
- Quick-launch responses now return the current instance config after backend port auto-selection, so the UI sees the actual assigned port.
- Local model records now retain the latest crash reason (`active_last_error`) so CRASHED / retryable rows explain what happened without opening raw logs first.
- Run Model and Local Models surface recent failed-load reasons in plain English while keeping exact paths and logs in details.
- Recommendation scoring avoids pushing recently crashed variants as the best local pick unless they are the only useful option.
- Qwen3.6 and large Qwen text-generation models remain runnable; size alone is not treated as incompatibility.
- Bumped frontend and controller package metadata to `0.34.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.34 / next v0.35.

## v0.33 — Real vLLM Happy-Path Validation Pass

- Changed local process start behavior so a spawned `vllm serve` process stays in `starting` until the OpenAI-compatible endpoint responds.
- Added readiness probing for `/v1/models`, with `/health` as a fallback.
- Added warm-up logs so users can see that vLLM is still loading instead of mistaking slow model startup for success or failure.
- Updated Run Model copy to show a plain **Warming up** state and keep Logs one click away while the endpoint is not ready yet.
- Kept Qwen3.6 and large Qwen text-generation models runnable; size alone is still not treated as incompatibility.
- Bumped frontend and controller package metadata to `0.33.0`.
- Updated README, ROADMAP, milestones, release checks, bug-bash checks, smoke checks, and next-agent handoff for v0.33 / next v0.34.

## v0.32 — Real Crash Diagnosis & Runnable Model Confidence Pass

- Kept Qwen3.6 and large Qwen text-generation models runnable; size alone is not treated as incompatibility.
- Added clearer vLLM crash classification for port conflicts, missing/wrong vLLM environment, unsupported architecture, missing tokenizer/config files, bad Hugging Face snapshot paths, insufficient GPU memory, wrong image/audio/diffusion model types, and unknown crashes.
- Added backend local-path preflight so obvious incomplete folders fail with a useful reason before launching vLLM.
- Added backend next-free-port protection before process launch, not only in the frontend.
- Show failed-load reasons beside CRASHED status in Run Model and Models without exposing noisy raw paths in the main row.
- Added direct next actions for retry, logs, low-VRAM settings, and picking another model.
- Bumped frontend and controller package metadata to `0.32.0`.

## v0.31 — Model Picker Scroll & Load Reliability Fix Pass

- Increased Hugging Face discovery results so users can scroll beyond the first few visible models.
- Changed the Run Model picker into a visible scrollable list for local and Hugging Face results.
- Added result-count helper text so users know the list is scrollable and filterable.
- Added an active-filter hint in Models when a view like Needs attention is hiding the full library.
- Auto-selects the next free port when the configured port is already occupied, instead of forcing users to manually hunt for a port before starting.
- Kept Qwen3.6-class text-generation models in the runnable lane; do not block them just because they are large or unofficial HF repos.
- Bumped frontend and controller package metadata to `0.31.0`.

## v0.30 — LM Studio Familiarity & Auto-Detect Fix Pass

- Reduced Run Model wording toward a familiar LM Studio-style flow: pick model, Start, Test, Copy base URL.
- Added overflow protection for long model IDs, Hugging Face snapshot names, and filesystem paths in the daily UI and model detail drawer.
- Kept full local paths available in the detail drawer while hiding noisy paths from the default daily cards.
- Expanded automatic model discovery to common LM Studio, Hugging Face, vLLM, Unsloth, Downloads, home models, and project model folders.
- Added environment scan roots for VLLM_MODEL_DIRS, UNSLOTH_MODEL_DIRS, and LMSTUDIO_MODEL_DIRS.
- Bumped frontend and controller package metadata to `0.31.0`.
- Kept Daily mode frozen, beta web-first, and Electron preview-only.

## v0.29 — Endpoint & Quick-Test Beta Fix Pass

- Clarified that the copied `/v1` value is the OpenAI-compatible base URL, not the full chat completions path.
- Updated Run Model quick-test success/failure hints so beta testers know when to hand off the endpoint.
- Added base-URL helper copy to the running model panel and advanced endpoint card without adding a new Daily-mode surface.
- Mirrored the base-URL wording on Remote GPU endpoint handoff.
- Bumped frontend and controller package metadata to `0.29.0`.
- Updated release gates, smoke checks, README, ROADMAP, milestones, and next-agent handoff for v0.29.

## v0.28 — Model Library Beta Fix Pass

- Reduced model row noise by removing local filesystem paths from the default library row chips; paths remain available in the detail drawer.
- Added a clearer filtered-empty state with **Clear search** and **Show all models** recovery actions.
- Updated README, ROADMAP, milestones, release checks, smoke checks, and next-agent handoff for v0.28.
- Bumped frontend and controller package metadata to `0.28.0`.
- Kept Daily mode frozen, beta web-first, Electron preview-only, and the v0.x public version scheme intact.

## v0.26 — Beta Feedback Fix Lane

- Added `docs/V0_26_BETA_FEEDBACK_FIX_LANE.md` to define what v0.26 may fix and what must wait.
- Added `docs/releases/BETA_FEEDBACK_FIX_LANE.md` for tester-driven triage rules.
- Added `scripts/version-scheme-check.sh` and `make version-scheme-check` so future packages stay on the v0.x public beta line.
- Updated README, ROADMAP, milestones, beta bug-bash status, release checks, smoke checks, and next-agent handoff for v0.26.
- Bumped frontend and controller package metadata to `0.26.0`.
- Kept Daily mode frozen, web-first, and Electron preview-only.

## v0.25 — Public Beta Tag & Version Scheme Reset

- Reset public version numbering from the internal v24.x release-candidate track to v0.25.
- Updated README, ROADMAP, milestones, beta release notes, beta bug-bash status, desktop decision docs, issue-intake docs, and next-agent handoff for v0.25.
- Added `docs/VERSION_NUMBER_CHANGE_BRIEF.md` so future agents continue with v0.26/v0.27 instead of v25.0/v26.x.
- Added `docs/V0_25_VERSION_SCHEME_AUDIT.md` documenting the audit scope, findings, and public release decision.
- Updated release-freeze and smoke checks for the new v0.25 public beta package.
- Kept Daily mode frozen, web-first, and Electron preview-only.

## v24.9 — Public Beta Re-Freeze

- Added `scripts/release-freeze-check.sh` and `make release-freeze-check`.
- Added `docs/V24_9_PUBLIC_BETA_RE_FREEZE.md`.
- Updated README, ROADMAP, milestones, beta bug-bash status, and next-agent handoff for the v25.0 public beta tag.
- Updated smoke checks to require the v24.9 re-freeze files.
- Kept Daily mode frozen, the beta web-first, and Electron preview-only.
- Did not add new product UI surfaces.


## v24.8 — Beta Bug-Bash Fix Pass

- Added `docs/releases/BETA_BUG_BASH_STATUS.md` as the single beta blocker/readiness ledger.
- Added `scripts/bug-bash-check.sh` and `make bug-bash-check`.
- Updated `docs/BETA_BUG_BASH.md` with blocker, beta polish, post-beta, and not-planned triage rules.
- Updated smoke checks to require the v24.8 bug-bash files.
- Updated README, ROADMAP, milestones, and next-agent handoff toward v24.9 public beta re-freeze.
- Kept Daily mode frozen and Electron preview-only.


## v24.7 — Desktop Packaging Decision & Release Path

- Decided v25.0 public beta remains web-first.
- Kept Electron as a preview shell, not a production installer promise.
- Added desktop packaging decision docs and support expectations.
- Updated desktop README with preview-only run flow and graduation criteria.
- Updated README, ROADMAP, milestones, smoke checks, and next-agent handoff.

## v24.6 — Public Beta Release Notes & Issue Intake

- Added `docs/releases/PUBLIC_BETA_RELEASE_NOTES.md` with draft public beta release copy and tester instructions.
- Added `docs/releases/KNOWN_LIMITATIONS.md` for honest beta constraints around runtime, hardware, model compatibility, install, desktop, and remote GPU use.
- Added `docs/releases/ISSUE_INTAKE.md` with maintainer labels, triage order, v25.0 blocker criteria, and post-beta deferral rules.
- Added `.github/ISSUE_TEMPLATE/beta_feedback.md`.
- Tightened bug and feature templates around install, launch, model load, quick test, endpoint copy, and remote GPU states.
- Updated smoke checks to require the release-note and issue-intake files.

## v24.5 — Screenshot Capture & README Image Wiring

- Added `scripts/capture-screenshots.sh` for repeatable beta screenshot capture.
- Added `scripts/check-screenshots.sh` and Makefile targets for screenshot validation.
- Wired the required five public beta screenshots into the README gallery.
- Added `docs/screenshots/MANIFEST.md` and `docs/V24_5_SCREENSHOT_CAPTURE_README_WIRING.md`.
- Added hidden query-parameter page selection for deterministic screenshot capture without adding visible UI.
- Updated smoke checks to require screenshot scripts and screenshot artifacts.

## v24.4 — Next-Version Plan & Milestone Map

### Added

- Added `docs/MILESTONES.md` with v24.x beta-confidence milestones, the v25.0 public beta gate, and v26.x post-beta expansion themes.
- Added `docs/V24_4_NEXT_VERSION_PLAN_MILESTONE_MAP.md`.
- Added `ai-agent-prompts/V24_4_AGENT_PROMPTS.md`.

### Changed

- Updated README current release and package command to v24.4.
- Reworked ROADMAP to remove conflicting v24.3/v24.4 entries and point future work toward v25.0.
- Updated demo docs to use current Setup check naming and screenshot filenames.
- Updated smoke checks to require the new milestone docs.

### Guardrails

- No new Daily mode UI was added.
- v24.5 should capture screenshots and wire README images, not expand the app.


## v24.3 — Beta Documentation & Screenshot Readiness

- Reworked README around public beta positioning, demo flow, and screenshot readiness.
- Added a five-screenshot contract for Run Model, Models, Endpoint success, Remote, and Setup check.
- Added `docs/V24_3_BETA_DOCS_SCREENSHOT_READINESS.md`.
- Added `docs/demo/public-beta-walkthrough.md`.
- Added `docs/screenshots/CAPTIONS.md`.
- Updated Release kit check/package command to v24.3.
- Updated smoke checks to require the v24.3 release docs.

## v24.2 — Install & Launch Path Hardening

- Added `scripts/bootstrap.sh` for fresh-clone dependency installation.
- Added `scripts/launch-check.sh` for install state, port, and controller health checks.
- Added `make bootstrap` and `make launch-check`.
- Updated smoke checks to require the new launch scripts and v24.2 docs.
- Updated README and Release kit commands toward bootstrap -> dev -> launch-check.
- Added `docs/V24_2_INSTALL_LAUNCH_PATH_HARDENING.md` and `ai-agent-prompts/V24_2_AGENT_PROMPTS.md`.

## v24.1 — Public Beta Bug Bash & Smoke Harness

- Added `scripts/smoke.sh` for lightweight beta smoke checks.
- Added `make smoke`.
- Added `docs/BETA_BUG_BASH.md` with the manual beta bug-bash checklist.
- Added `docs/V24_1_BUG_BASH_SMOKE_HARNESS.md` and `ai-agent-prompts/V24_1_AGENT_PROMPTS.md`.
- Updated Release kit package commands to run smoke checks before full checks.
- Updated README, ROADMAP, and next-agent handoff toward real-user beta validation.

## v24.0 — Public Beta Freeze

- Froze public beta feature growth after the v23 UX audit and simplification loop.
- Updated the sidebar badge to **Public beta**.
- Tightened Release kit copy into a compact beta checklist.
- Updated package commands to `vllm-control-center-starter-v24.0.zip`.
- Rewrote README around the final beta product shape instead of historical milestone notes.
- Added `docs/V24_0_PUBLIC_BETA_FREEZE.md` and `ai-agent-prompts/V24_0_AGENT_PROMPTS.md`.

## v23.13 — UX Audit & Dead-Surface Removal

- Audited Daily mode for duplicate helper/setup/release surfaces.
- Renamed live **Setup Doctor** copy to calmer **Setup check** language.
- Toned **Release Kit** to **Release kit** and updated screenshot/package command copy to v23.13.
- Added v23.13 docs and future-agent guardrails against reintroducing stacked cards.

## v23.12 — Quick Test Result Polish

- Added clear quick-test result states for local Run Model.
- Added matching quick-test result states for Remote GPU.
- Quick tests now show passed / failed / running / idle language, latency, last test time, and a short response preview.
- Kept quick test as endpoint confidence, not a full chat UI.

# Changelog

## v23.11 — Endpoint Copy & Developer Handoff Polish

- Added compact developer handoff controls when a model is running.
- Added copyable OpenAI-compatible base URL and model name cards.
- Added one-click copy for curl, JavaScript SDK, and Python SDK examples.
- Added the same SDK-copy shortcuts to the advanced endpoint card.
- Kept the daily page focused on the core path: choose model, load, quick test, copy `/v1` endpoint.
- Added `docs/V23_11_ENDPOINT_COPY_DEVELOPER_HANDOFF.md` and `ai-agent-prompts/V23_11_AGENT_PROMPTS.md`.

## v23.10 — Daily Mode Persistence & Escape Hatch

- Persisted Daily / Advanced mode with local browser storage.
- Added a quiet **Back to Daily mode** action from Help & support.
- Tightened sidebar mode copy to keep the default experience calmer.
- Kept advanced/debug tools discoverable without crowding Daily mode.

# Changelog

## v23.10 — First Launch Onboarding Trim

- Added a single first-launch card on Run Model when no model/server is selected.
- The first-launch card now recommends the next best action: use a detected local model, download a starter model, browse Hugging Face, or recheck setup.
- Hid the inline Setup Doctor during the initial empty state to avoid stacked onboarding/helper cards.
- Setup checks now appear inline only when something needs attention and the first-launch card is not already visible.
- Added `docs/V23_9_FIRST_LAUNCH_ONBOARDING_TRIM.md` and `ai-agent-prompts/V23_9_AGENT_PROMPTS.md`.

## v23.8 — Daily / Advanced Mode Boundary

### Changed

- Added a clear Daily mode / Advanced mode boundary in the sidebar.
- Daily mode now shows only the core surfaces: Run Model, Models, Remote, and Settings.
- Help & support tools are hidden by default until Advanced mode is enabled or an advanced page is opened.
- Opening Logs, Metrics, Playground, Setup Doctor, Release Kit, or More tools automatically enables Advanced mode.
- Reframed More tools as an Advanced mode hub instead of another everyday destination.

## v23.7 — First-Run Language & Empty-State Polish

### Changed

- Replaced visible version-heavy sidebar language with a quieter beta-ready badge.
- Renamed the support drawer to **Help & support**.
- Tightened Run Model, Models, Remote, and Setup Doctor empty-state copy around the next useful action.
- Removed stale milestone wording from live Setup Doctor and Run Model surfaces.
- Updated Release Kit package command to v23.7.


## v23.6 - Release Kit Simplification

- Simplified the Release Kit from an internal milestone dashboard into a compact beta readiness helper.
- Removed stale live UI references to older RC milestone copy.
- Reframed release checks around first-run readability, model availability, endpoint success, demo leftovers, and remote story intent.
- Reduced screenshot guidance to five clear images with simple filenames and readiness states.
- Kept copyable beta summary, smoke path, and check/package commands.
- Updated sidebar badge to v23.6 beta RC.

## v23.5 - Final UX Consistency & Copy Reduction

- Normalized daily-use labels across Run Model, Models, Remote, Settings, and support tools.
- Changed sidebar wording from Advanced tools to Support tools, while keeping operator pages available through More tools.
- Removed stale versioned copy from live UI surfaces such as v22/v23 milestone labels and recovery-helper titles.
- Shortened Run Model helper text so the main path reads as select, load, test, copy endpoint.
- Updated sidebar badge to v23.5 beta RC.

## v23.4 - Settings & Advanced Tools Simplification

- Shortened the sidebar Advanced tools list to Setup Doctor, Beta Release Kit, Logs, and More tools.
- Added a grouped More tools hub for daily support, model troubleshooting, and operator tools.
- Simplified Settings into a local-controller API key task plus compact security status.
- Hid secret backend internals behind Advanced security details.
- Updated sidebar badge to v23.4 beta RC.


## v23.3 — Remote Page Simplification

### Added
- Added `docs/V23_3_REMOTE_PAGE_SIMPLIFICATION.md` and `ai-agent-prompts/V23_3_AGENT_PROMPTS.md`.

### Changed
- Simplified the Remote page into one daily-use GPU workbench instead of a dense ops dashboard.
- Kept connection, running model, endpoint, Start/Stop/Restart, quick test, and logs in the main path.
- Moved remote model list, GPU health, runtime metrics, saved remote profiles, and add-remote setup behind secondary disclosures.
- Updated the sidebar badge to `v23.4 beta RC`.

## v23.2 — Models Library Simplification

### Added
- Added `docs/V23_2_MODELS_LIBRARY_SIMPLIFICATION.md` and `ai-agent-prompts/V23_2_AGENT_PROMPTS.md`.

### Changed
- Simplified the Models page into a cleaner library surface with one concise hero and four status counters.
- Kept search and status filters visible, but moved Hugging Face download, scan path, host, and port controls behind an **Add or scan models** disclosure.
- Reduced model rows to first-glance metadata chips and kept full compatibility/path/settings details in the Model Detail Drawer.
- Removed the repeated footer guidance that pointed users back to Run Model.
- Updated the sidebar badge to `v23.2 beta RC`.

## v23.1 — Run Model Simplification Pass

### Added
- Added a simplified Run Model workbench that combines model selection, readiness, endpoint status, primary actions, and the detail drawer into one daily-use surface.
- Added a compact setup helper that opens automatically only when vLLM, GPU, model source, or endpoint port needs attention.
- Added `docs/V23_1_RUN_MODEL_SIMPLIFICATION.md` and `ai-agent-prompts/V23_1_AGENT_PROMPTS.md`.

### Changed
- Removed duplicated top-level Run Model cards from the normal path: beta quick-start, one-click run flow, separate success panel, and simple-mode flow no longer stack on the page.
- Moved step-by-step guidance behind a small disclosure and kept advanced diagnostics/settings under Advanced cockpit.
- Updated the sidebar badge to `v23.1 beta RC`.

## v23.0 — Public Beta Release Candidate

### Added
- Added RC readiness gates to the Beta Release Kit with pass/warn/block status for controller readiness, model source availability, endpoint success, unresolved failures, remote demo coverage, and screenshot readiness.
- Added copyable public beta notes, RC checklist, and check/package command snippets.
- Added `docs/V23_0_PUBLIC_BETA_RELEASE_CANDIDATE.md` and `ai-agent-prompts/V23_0_AGENT_PROMPTS.md`.

### Changed
- Updated the sidebar badge to `v23.0 beta RC`.
- Reframed the release kit from screenshot planning only into a release-candidate gate.
- Updated README and roadmap around feature freeze, smoke tests, and public beta packaging.

## v22.4 — Error Recovery UX

### Added
- Added a backend error recovery advisor for common vLLM and download failures: GPU out of memory, port already in use, vLLM missing, Hugging Face auth/gated repos, missing tokenizer/config, bad model paths, unsupported quantization/format, network interruptions, and cancelled downloads.
- Added `GET /api/instances/{instance_id}/recovery` and `GET /api/downloads/{job_id}/recovery`.
- Added shared frontend `ErrorRecoveryCard` with likely cause, immediate fixes, action buttons, and redacted log excerpts.
- Added recovery cards to Run Model and the unified Models library.
- Added `docs/V22_4_ERROR_RECOVERY_UX.md` and `ai-agent-prompts/V22_4_AGENT_PROMPTS.md`.

### Changed
- Crashed vLLM processes now store a concise human `last_error` title when recent logs contain a recognizable failure.
- Run Model can switch directly to the Low VRAM preset from a recovery card.
- Failed downloads in Models now offer recovery guidance before sending users to raw logs.

## v22.3 — Real Model Compatibility Pass

### Added
- Added richer local scanner metadata for Safetensors, PyTorch bin, GGUF, AWQ, GPTQ, bitsandbytes hints, FP16/BF16/FP32 dtype hints, tokenizer/config presence, context length, weight file count, and multi-file shards.
- Added plain-English compatibility labels on local model records: ready, likely, limited, attention, and unknown.
- Added compatibility chips, shard count, and dtype hints to the unified Models library.
- Added compatibility summary, config/tokenizer status, suggested load format, and reasons to the Model Detail Drawer.
- Added `docs/V22_3_REAL_MODEL_COMPATIBILITY_PASS.md` and `ai-agent-prompts/V22_3_AGENT_PROMPTS.md`.

### Changed
- Run Model's best ready-to-run recommendation now slightly prefers local models that look vLLM-ready.
- Needs Attention filtering now includes local compatibility problems, not just failed downloads or crashed instances.

## v22.2 — Release Page / Screenshots / Demo Data

### Added
- Added **Beta Release Kit** under Advanced tools.
- Added screenshot readiness cards for Run Model, Models library, loaded endpoint success, Remote GPU, and Setup Doctor.
- Added demo-state checklist for empty install, local model detected, download manager state, running endpoint, and remote GPU profile.
- Added copyable v22.2 release-note summary.
- Added `docs/V22_2_RELEASE_PAGE_SCREENSHOTS_DEMO_DATA.md`, `docs/demo/beta-demo-data.md`, and `ai-agent-prompts/V22_2_AGENT_PROMPTS.md`.

### Changed
- Updated screenshot guidance for the current LM Studio-style model run flow.
- Tightened `docs/dev/RELEASE_CHECKLIST.md` around beta screenshots, install/upgrade smoke tests, and screenshot secret hygiene.
- Updated sidebar beta badge to v22.2.

## v22.1 — First-Run Setup Doctor

### Added
- Added a v22.1 setup doctor card to Run Model covering vLLM, GPU, model source, Hugging Face token, port, and endpoint readiness.
- Added first-run actions: Copy install command, Recheck, Add `./models`, Scan HF cache, Download starter, and Browse Hugging Face.
- Added starter recommendations for Qwen3 0.6B, Qwen2.5 Coder 7B Instruct, and Qwen3 14B.
- Added optional Hugging Face token reporting to `/api/system/doctor`.
- Added `/api/system/ports/{port}` usage in the Run Model setup doctor.
- Added `docs/V22_1_FIRST_RUN_SETUP_DOCTOR.md` and `ai-agent-prompts/V22_1_AGENT_PROMPTS.md`.

### Changed
- Reworked the Setup Doctor page from raw diagnostic cards into a first-run support checklist.
- Updated the sidebar beta badge to v22.1.

## v22.0 — Public Beta Polish

- Added a beta quick-start card to Run Model with first-run progress, local model count, active downloads, running model, and vLLM readiness.
- Added direct beta actions for Use local model, Download model, and Recheck so new users do not need to hunt through tabs.
- Improved the true empty-state on the unified Models page with scan HF cache, scan ./models, starter download, and Run Model actions.
- Added a compact then-current beta badge to the sidebar for release screenshots and support reports.
- Added public beta docs and agent handoff prompt for the next release cycle.

## v21.8 — Remote GPU Polish

- Reworked the primary Remote page into a simple remote GPU command center instead of a profile-only management page.
- Added connected/disconnected state, latency, auth status, running model count, and total remote instance summary.
- Added selected remote model panel with OpenAI-compatible `/v1` endpoint copy, Start, Stop, Restart, and inline Logs actions.
- Added remote GPU health cards using remote instance metrics first and remote doctor data as a fallback.
- Added a one-shot Quick Test for running remote models directly from the Remote page.
- Kept advanced Remote Instances and Remote Playground pages available under Advanced tools while making the primary Remote path easier.

## v21.7 — Human vLLM Presets

- Added simple Run Model presets: Fast test, Balanced, Long context, High throughput, Low VRAM, and Custom.
- Reworked Load Settings so users choose intent first instead of editing raw vLLM knobs.
- Added preset summary chips for dtype, GPU memory, max context, tensor parallel, and preset-added args.
- Kept exact vLLM controls in Advanced load settings; non-Custom presets disable conflicting exact fields until Custom is selected.
- Updated the Model Detail Drawer to show the active preset name and description.

## v21.6 — Navigation Simplification / Unified Models Library

- Collapsed the primary navigation from five model-related choices into four top-level workflows: **Run Model**, **Models**, **Remote**, and **Settings**.
- Added a unified **Models** library page that combines on-device local models, Hugging Face download jobs, loaded/running state, scan paths, and quick actions.
- Added status filters for All, This device, Downloads, Running, and Needs attention so users do not need to know which old tab contains the answer.
- Added simple inline actions from the library: Load, Unload, Cancel, Retry, Remove, Logs, and Copy endpoint through the detail drawer.
- Kept legacy Local Models and Downloads pages available internally for compatibility, but removed them from the primary sidebar to reduce cognitive load.


## v21.5 — One-Click Run Flow

- Renamed the primary Server navigation entry to **Run Model** to match the user's goal.
- Added a one-click run entry card with This device, Download from Hugging Face, and Continue running choices.
- Added a Best ready-to-run local model recommendation with Select and Load now actions.
- Added simple readiness labels: Running, Ready, Downloaded, Downloading, Needs HF access, Needs download, and Choose model.
- Added a post-load success panel with Quick test, Copy endpoint, Logs, and Unload.
- Kept vLLM/operator controls behind the Advanced cockpit so the main path stays LM Studio-simple.



## v21.4 — Model Detail Drawer

- Added a shared right-side Model Detail Drawer for Server Simple Mode, Local Models, and Downloads.
- Selecting a local model row or download card now shows path, source, format, quantization, size, architecture/context, loaded status, download status, and simple recommended vLLM settings.
- Drawer actions keep the main flow LM Studio-like: Load, Unload, Test, Logs, and Copy endpoint where available.
- Advanced/operator detail stays behind existing advanced panels; the drawer uses simple chips instead of raw JSON.



## v21.3 — Download Manager UX

- Downloads page now behaves more like an app download manager with summary stats, status filters, card-based jobs, target/variant visibility, and completed-job actions.
- Completed downloads can be opened in Local Models or loaded directly when a local path is available.
- Advanced download options are hidden by default so the page is less intimidating for first-run users.
## v22.4 — Error Recovery UX

### Added
- Added a backend error recovery advisor for common vLLM and download failures: GPU out of memory, port already in use, vLLM missing, Hugging Face auth/gated repos, missing tokenizer/config, bad model paths, unsupported quantization/format, network interruptions, and cancelled downloads.
- Added `GET /api/instances/{instance_id}/recovery` and `GET /api/downloads/{job_id}/recovery`.
- Added shared frontend `ErrorRecoveryCard` with likely cause, immediate fixes, action buttons, and redacted log excerpts.
- Added recovery cards to Run Model and the unified Models library.
- Added `docs/V22_4_ERROR_RECOVERY_UX.md` and `ai-agent-prompts/V22_4_AGENT_PROMPTS.md`.

### Changed
- Crashed vLLM processes now store a concise human `last_error` title when recent logs contain a recognizable failure.
- Run Model can switch directly to the Low VRAM preset from a recovery card.
- Failed downloads in Models now offer recovery guidance before sending users to raw logs.

## v21.1 — Local Model Grouping / Variant UX

- Grouped on-device local model variants instead of showing every detected file as a flat list.
- Added group/variant metadata to local model records.
- Added `GET /api/local-models/groups`.
- Server page `This device` picker now shows optgroup-style model families with quant/file variants.
- GGUF variants in the same folder, such as Q4_K_M and Q8_0, are grouped together for an LM Studio-like flow.


## v20.8 — First Successful Load QA

### Added
- Added a first-success checklist to the Server Simple Mode: model selected, available to load, server loaded, test passed, and endpoint copied.
- Added local-copy awareness in the guided download step so users are not pushed to download again when a model is already on device.
- Added local-model loading from the Server page using the same simple Load Model path.

### Changed
- Server Load buttons now prefer loading the local/on-device model record when available, falling back to catalog quick launch only when needed.
- Inline quick test now marks the first-run flow complete only after a successful response.
- Endpoint copy state is tracked so the guided flow ends with a clear “ready to use” signal.

## v20.7 — Guided Run Mode

### Added
- Added a Simple Mode card on the Server page with a four-step run flow: choose, download, load, use.
- Added simple Hugging Face discovery and variant selection inside the guided flow.
- Added simple port/GPU-memory load controls in the guided flow.

### Changed
- Collapsed the dense Server cockpit behind an Advanced cockpit disclosure by default.
- Kept the main UX focused on successful first load rather than instance administration.

## v20.6

### Added
- Added Load/Unload state-machine semantics for local model loading.
- Added `reuse_existing` and `force_new` controls for local model load and Model Hub quick launch.
- Added response metadata: `reused_existing`, `action`, and user-facing messages for local load results.
- Added Local Models instance counts so users can see loaded/configured duplicates.

### Changed
- Loading a model now reuses an already running instance first, then a stopped/crashed matching instance, before creating a new instance.
- Stopped matching instances are updated with current load settings before loading, reducing accidental duplicate instances.
- Server page instance selection now prefers the running matching instance for the selected model.
- Server page now warns when multiple configured instances exist for the selected model.
- Duplicate instance creation is explicit through `force_new`.

## v20.5

### Added
- Added `GET /api/server/qa` for read-only Server page install/readiness checks across vLLM CLI, GPU visibility, download queue, local models, and instances.
- Added a Server page real-install QA strip with actionable setup/download/local-model/instance checks.
- Added a Server page `Refresh all` action that refreshes catalog, variants, downloads, instances, local models, and QA state.
- Added local/on-device badges and path display for the selected model when present.

### Changed
- Improved selected download job matching for selected HF variants using `allow_patterns`.
- Added inline metrics-unavailable guidance when a running server cannot expose metrics.
- Added v20.5 docs and next-agent prompts.

## v20.4

### Changed
- Reworked the Server page into a denser LM Studio-style three-column cockpit: model/variant selection on the left, load controls/endpoint/test/logs in the center, and inspector/metrics/command preview on the right.
- Tightened compact sidebar and Advanced tools presentation so primary navigation stays focused.
- Added responsive fallbacks for two-column and one-column layouts.

### Added
- Added v20.4 docs and next-agent prompt.

## v20.3

### Added
- Added a Server page Load Settings panel for host, port, dtype, GPU memory utilization, max model length, served model name, API key, tensor/pipeline parallelism, KV cache memory, parsers, trust-remote-code, tool choice, and extra vLLM args.
- Added backend support so catalog quick-launch and local model load preserve advanced vLLM settings.
- Added Local Models metadata fields for format, quantization, architecture, context length, parameter count, variant count, and metadata warnings.
- Added config.json and GGUF metadata detection for on-device models.
- Added v20.3 docs and agent prompts.

### Changed
- Simplified the sidebar: Server, Local Models, Downloads, Remote, and Settings stay top-level; lower-frequency pages move under Advanced tools.
- Reworded Server copy around Load Model / Unload Model and one-page operation.

## v20.1

### Added
- Added Hugging Face model variant discovery endpoint.
- Added GGUF/safetensors quantization variant detection.
- Added Server page variant picker for Hugging Face catalog results.
- Added targeted download `allow_patterns` support for selected variants.
- Added v20.1 docs and next-agent prompts.

### Changed
- HF downloads can now preserve selected quantization/file variants instead of always downloading the full repo snapshot.

## v20.0

### Added

- Added Local Models API for on-device model discovery from the registry, download jobs, existing instances, and Hugging Face cache directories.
- Added Load/Unload endpoints for local models so the UX matches LM Studio terminology.
- Added a Local Models frontend page with table view, scanned paths, load/unload/eject actions, and download/status badges.
- Updated Server page copy from start/stop terminology toward Load Model / Unload Model.
- Added v20 docs and agent prompts.

## v19.2

### Added

- Added fresh Hugging Face discovery modes for the Server page: trending, most downloaded, most liked, recently updated, and search relevance.
- Added optional HF task/profile and author/org filters.
- Added backend support for query-less HF discovery so users are not forced into stale example model names.
- Added HF result metadata for last modified date and trending score when available.
- Added v19.2 docs and agent prompts.

### Changed

- Updated README and Server page copy to emphasize runtime discovery over hardcoded model examples.
- Kept the built-in catalog as an offline starter catalog, not the source of truth for current popular models.

## v19.1

### Added

- Added Hugging Face Catalog Bridge with runtime HF discovery on the Server page.
- Added HF register/download/quick-launch flows that match built-in catalog actions.
- Added HF token environment-variable support without sending token values to the browser.

## v19.0

### Added

- Added Server page catalog tag filtering and quick tag chips.
- Added download status/progress panel next to the selected model.
- Added first-run guidance and vLLM CLI readiness warning on the Server page.
- Added inline quick test prompt for running local instances.
- Added richer model inspector details for catalog metadata, instance state, download status, and runtime defaults.
- Added additional DGX/high-memory catalog entries and tag-filter backend coverage.

### Changed

- Improved Server page error guidance for missing vLLM CLI, port conflicts, CUDA OOM, and gated/private Hugging Face models.
- Kept Server as the primary LM Studio-style local inference workflow.

## v18.1

### Added

- Added `DELETE /api/instances/{instance_id}` for ejecting stopped/crashed local instances from the Server page.
- Added instance deletion tests that block deletion of running instances.

### Changed

- Persisted selected Server page model and instance in local storage.
- Added Server page loading/disabled states for start, stop, download, create, and eject actions.
- Added copy feedback for endpoint and command preview actions.
- Added host/port conflict warning before creating a new instance.
- Routed Server page shortcuts to Playground and Metrics with the currently selected instance.
- Improved Server page empty/error states and endpoint readiness labels.

## v18.0

### Added

- Added a dedicated Server page as the primary LM Studio-style local inference server workflow.
- Combined model picker, register/download/create instance, start/stop, endpoint copy, supported endpoints, live logs, model inspector, command preview, and metrics/playground shortcuts into one page.
- Promoted Server to the first navigation item.
- Added v18 docs and AI-agent prompts for Server Page polish.

### Changed

- Reframed the default frontend landing page from Dashboard to Server to prioritize the most important user flow: select model -> start/stop vLLM server.

## v17.0

### Added

- Added an LM Studio-style Model Hub page for the core select/download/create/start flow.
- Added curated starter model catalog API at `/api/model-hub/catalog`.
- Added one-click catalog actions to register a model, queue a Hugging Face download, create an instance, or create and start an instance.
- Added backend tests for catalog listing, idempotent registration, quick launch, and catalog download queueing.
- Added v17 docs and AI-agent prompts focused on making model selection and start/stop the primary UX.

### Changed

- Promoted Model Hub above lower-level Models/Downloads/Instances pages in the frontend navigation.
- Normalized npm lockfile resolved URLs to the public npm registry so external agents are not blocked by internal package mirrors.
- Updated internal tracking docs to make LM Studio-style model selection the immediate product priority before controller lifecycle work.

## v16.1

### Changed

- Added desktop shell checks to GitHub Actions CI.
- Added `desktop/electron/package-lock.json` and pinned Electron to an audited patch version.
- Restricted Electron external links to `http:` and `https:` URL schemes.
- Disabled the generic remote forwarding endpoint by default with `VCC_ALLOW_REMOTE_FORWARDING=false`.
- Updated stale internal dev tracking and handoff docs after the v16 audit.

### Security

- Dedicated remote bridge routes remain the preferred mechanism for remote instances, logs, metrics, and playground traffic.
- Generic remote forwarding is now an explicit development escape hatch rather than a default capability.

## v16.0

### Added

- Added an Electron desktop shell spike that wraps the existing Vite frontend without replacing the web-first architecture.
- Added desktop shell security defaults: sandboxed renderer, context isolation, disabled Node integration, and a minimal preload bridge.
- Added desktop shell documentation and next-agent prompts for a future controller lifecycle prototype.
- Added a `desktop-check` Makefile target for validating the desktop spike files.


This project follows a practical milestone-based changelog while it is still in starter phase.

## v15 — OS Keychain Research Spike

### Added

- Added secret backend status API at `/api/security/secret-backend`.
- Added `controller/app/core/keychain.py` with optional keyring availability detection and a prototype keyring adapter.
- Added `VCC_SECRET_BACKEND` and `VCC_SECRET_SERVICE_NAME` configuration settings.
- Added optional `keychain` Python extra for future `keyring` experiments.
- Added Settings page secret backend status display.
- Added v15 docs and next-agent prompts.

### Notes

- SQLite remains the active secret backend in v15.
- OS keychain support is prepared as an adapter/research path, not activated for production secret reads/writes.
- The local SQLite database must still be treated as sensitive.

## v14 — Metrics UX

### Added

- Added richer metrics summary fields for average latency and token throughput rates.
- Added local metrics snapshot persistence and a `/metrics/history` endpoint for simple dashboard history.
- Added alert generation for metrics unavailable, high KV cache usage, waiting requests, GPU VRAM pressure, and high GPU temperature.
- Added GPU VRAM percentage normalization.
- Added simple SVG history charts on the Metrics page without requiring Prometheus/Grafana.
- Added v14 docs and next-agent prompts.

### Changed

- Metrics page now shows clearer operator cards, alert cards, throughput, latency, GPU pressure bars, and empty/history states.

## v13 — Advisor Accuracy and UX

### Added

- Added architecture presets for Qwen, Llama, Mistral, Mixtral, DeepSeek, auto, and custom advisor flows.
- Added better KV cache estimates using layers, attention heads, KV heads, head dimension, cache dtype, and expected concurrency.
- Added suggested vLLM settings and copyable vLLM args to compatibility responses.
- Added frontend controls for architecture preset, cache dtype, quantization bits, expected concurrency, and manual architecture overrides.
- Added Model Registry selector and Use Detected GPU flow on the Compatibility page.
- Added v13 docs and next-agent prompts.

### Changed

- Compatibility recipes now preserve selected KV cache dtype through extra vLLM args.
- Compatibility tests now cover architecture inference, FP8 KV cache estimates, and concurrency effects.

## v12 — Secret Storage Hardening

### Added

- Added database-backed secret helper functions for storing, reading, updating, and deleting local secrets.
- Added deterministic secret keys for remote controller profile API keys.
- Added migration/backward compatibility for legacy `remote_controller_profiles.api_key` values.
- Added tests for secret-table storage, API key clearing, profile deletion cleanup, and legacy migration.

### Changed

- Remote controller profile API keys are now stored in the `secrets` table instead of the public/domain profile row.
- Public remote profile responses continue to expose only `api_key_configured`, never the raw key.
- Remote profile create/update/delete flows now write or clear secrets through helper functions.
- Updated security and internal dev docs to reflect the v12 baseline.

### Security

- The legacy `api_key` column remains only for migration/backward compatibility and is cleared during `init_db()`.
- The SQLite database still contains local secrets and must be treated as sensitive. OS keychain support remains a future hardening path.

## v11.0

### Added
- Optional controller API-key middleware for protected `/api/*` routes.
- Bearer token, `X-VCC-API-Key`, and SSE query-token auth support.
- Frontend Settings page for storing a local controller API key.
- Secret redaction helpers.
- SQLite `settings` and `secrets` foundation tables.
- Remote controller API key update/clear behavior.
- v11 security docs and agent prompts.

### Security
- `/api/health` remains public.
- Localhost auth bypass is explicit and disabled by default.
- Remote profile key storage limitation remains documented.

## v10.2 — Internal Dev Tracking Pass

### Added

- Added `docs/dev/PROJECT_STATUS.md` as the internal source of truth for current progress.
- Added `docs/dev/TODO.md` for practical team tasks, debt, decisions, and parking-lot ideas.
- Added `docs/dev/DECISIONS.md` for architecture decisions and agent guardrails.
- Added `docs/dev/AGENT_HANDOFF.md` for AI coding agent onboarding.
- Added `docs/dev/RELEASE_CHECKLIST.md` for packaging/release discipline.
- Added `docs/dev/PLAN_ALIGNMENT.md` to compare current work against the original plan.

### Changed

- Updated public docs to point contributors to internal development tracking docs.
- Updated roadmap to reflect v8-v10.2 as completed and v11 as the recommended next milestone.

### Notes

- No runtime behavior changes intended.

## v10.1 — Audit Fix Pass

### Fixed

- Updated stale README verification count.
- Replaced deprecated `datetime.utcnow()` usage.
- Tightened remote security wording.
- Documented local SQLite secret storage limitation.
- Hardened remote path validation and tests.
- Pinned frontend dependency versions.

## v10 — Model Compatibility Advisor

### Added

- Added compatibility estimate API.
- Added Compatibility frontend page.
- Added model memory and KV cache heuristic estimates.
- Added verdicts, warnings, assumptions, and recipe creation from advisor settings.

## v9 — Download Queue Hardening

### Added

- Added SSE live download queue updates.
- Added retry/delete download job actions.
- Added stale-job reconciliation.
- Added duplicate model registration detection.
- Added Hugging Face token environment variable support.

## v8 — Hugging Face Model Download Queue

### Added

- Added download job lifecycle API.
- Added Downloads frontend page.
- Added dry-run fake downloader for tests/demos.
- Added optional model registry integration.

## v7 — Open Source Excellence Pass

### Added

- Added public-facing open-source docs, scripts, demo guides, CI polish, comparison docs, and maintainer checklist.

## v6 — Remote Playground Bridge + OSS Files

### Added

- Added remote playground chat and streaming chat routes.
- Added public project files: license, contributing guide, security policy, code of conduct, issue templates, PR template, CI.

## v5 — Remote Instance Bridge

### Added

- Added remote instance list/start/stop/restart/metrics/logs bridge.

## v4 — Remote Controller Profiles

### Added

- Added remote controller profile storage, probing, and safe API forwarding.

## v3 — Workflow Expansion

### Added

- Added SSE live logs, streaming playground, model registry, recipes, and chat history.

## v2 — Playground, Metrics, Exports

### Added

- Added playground proxy, metrics scraper, export helpers, and starter docs.

## v1 — Starter Foundation

### Added

- Added FastAPI controller, React/Vite frontend, environment doctor, command compiler, process manager, SQLite, tests, and README.

## v19.1

### Added
- Added Hugging Face catalog/search bridge for Server and Model Hub flows.
- Added HF search/register/download/quick-launch backend routes.
- Added Server page catalog source selector for built-in vs Hugging Face search.

### Changed
- Built-in curated catalog remains the offline/default source.
- Hugging Face tokens are read from controller environment variables, not entered in the browser.

## v20.9

### Added
- Added on-device model scanner improvements for `VCC_MODEL_DIRS` / `VCC_EXTRA_MODEL_DIRS`.
- Added This device as a primary Server page source.
- Server page can now list locally detected models and load from that list without download/register steps.

### Changed
- Improved local scan support for nested GGUF files and local Hugging Face snapshot folders.


## v21 — On-device Scanner QA

- Added app-managed local model scan paths from the Server page.
- Added `/api/local-models/scan-roots` APIs for listing, adding, and removing scan roots.
- `/api/local-models` now returns per-root scan status so the UI can explain why models are or are not detected.
- Server Simple Mode now lets users add `/data/models`, `/mnt/models`, `~/models`, or any accessible model folder from the app.
- Verified backend tests, backend lint, frontend build, and desktop shell check.