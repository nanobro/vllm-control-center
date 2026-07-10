# Roadmap

## Current package: v0.62 GitHub Public Repo Cleanup Pass

v0.62 prepares the source tree for first public GitHub publication: old internal version history is archived, public agent prompts are trimmed to the current maintenance window, a GitHub release checklist is added, and release checks now guard the public repo hygiene contract.

This pass focuses on the actual daily handoff path:

- pick a model
- Start and wait for readiness
- run Quick test on the selected local or remote endpoint
- if the test or streaming chat fails, show a readable reason and next action
- unlock Copy only after the selected endpoint test passes
- keep Qwen3.6 and large Qwen text-generation models runnable

The default product path remains:

```text
Run Model -> pick model -> Start -> Test -> copy OpenAI base URL
```

## Completed through v0.62

- Audited public docs and release scripts for the version-number reset.
- Updated public-facing package references from v24.9/v25.0 to v0.25+.
- Added version-scheme guardrails.
- Kept Daily mode frozen and web-first.
- Kept Electron preview-only.
- Added v0.28 model-library noise reduction.
- Added v0.29 endpoint/base-URL wording fixes.
- Added v0.31 model picker scroll and load reliability fixes: more Hugging Face results, a scrollable picker, filtered-library warnings, and next-free-port behavior.
- Added v0.32 crash diagnosis fixes: specific CRASHED reasons, recovery actions, local snapshot/path preflight, vLLM environment diagnosis, and low-VRAM retry guidance without size-blocking Qwen text models.
- Added v0.33 happy-path validation: spawned vLLM processes stay in starting/warming-up state until `/v1/models` or `/health` responds, with logs available during warm-up.
- Added v0.34 start-result honesty and local crash memory: start API responses distinguish requested vs ready, actual assigned ports are returned after backend auto-selection, and local rows preserve recent failed-load reasons.
- Added v0.35 remote endpoint handoff guard: selected remote model controls the visible/copyable endpoint, stopped remote rows show why the endpoint is not ready, and Quick test only appears for the selected ready endpoint.
- Added v0.36 Low VRAM retry confidence: crashed local loads can be retried with safer serving settings while reusing the existing instance.
- Added v0.37 test-before-copy handoff: local `/v1` copy and SDK snippets unlock only after Quick test passes for the selected running model.
- Added v0.38 detail drawer handoff guard: drawer Copy URL follows the same selected-instance Quick test gate.
- Added v0.39 remote test-before-copy handoff: Remote Copy base URL stays disabled until the selected running remote model passes Quick test.
- Added v0.40 tested endpoint state labels: local route status and remote endpoint cards distinguish untested-running endpoints from tested-ready handoff.
- Added v0.42 quick test failure guidance: local and remote failed endpoint tests show a readable reason plus next actions.
- Added v0.43 streaming test failure guidance: local streaming SSE failures now include the same diagnosis fields, and local/remote playground pages render next-action chips.
- Added v0.46 auto served-name retry: Quick test can automatically retry once with the actual `/v1/models` served name when the request alias is wrong.
- Added v0.47 tested model-name handoff clarity: local and remote surfaces show/copy the exact model name that passed Quick test.
- Added v0.48 endpoint handoff bundle copy: local and remote surfaces can copy the tested base URL plus tested model name together after Quick test passes.
- Added v0.49 environment handoff copy: local and remote surfaces can copy tested `OPENAI_BASE_URL`, `OPENAI_MODEL`, and API key placeholder lines after Quick test passes.
- Added v0.50 safe env handoff quoting: local and remote `.env` handoff values are generated from the tested run and quoted when needed for dotenv-safe copy/paste.
- Added v0.51 clipboard fallback reliability: local, remote, setup, and release copy actions fall back when `navigator.clipboard` is blocked.
- Added v0.52 manual copy fallback preview: local and remote handoff payloads appear in a selectable panel when all clipboard APIs are blocked.
- Added v0.53 manual copy select-all confidence: fallback panels now include Select all and payload length hints.
- Added v0.54 copy success confirmation: local and remote handoff copy actions now show what was copied, a short preview, and the payload length, then clear on selected run/profile changes.
- Added v0.55 overflow polish: long model IDs, served names, snapshot filenames, and paths stay readable in main rows without spilling out of Run Model, Models, Downloads, Remote, or drawer surfaces.
- Added v0.56 visible version badge sync: sidebar beta label is sourced from frontend package metadata, release checks require the live badge to match the current version, and stale historical beta labels is removed from live-facing guidance.
- Added v0.57 Playground loaded-model source of truth: local Playground shows running/warming models, keeps a handoff-selected model visible, shows model/status/endpoint, and times out stuck streams with next actions.
- Added v0.58 Playground served-name auto-retry: local Playground retries once with the suggested `/v1/models` served name for streaming and non-streaming tests, then shows a small recovery notice.
- Added v0.59 Playground wildcard-host connection normalization: local Playground uses a safe loopback connection for wildcard bind hosts while showing a human-friendly localhost endpoint.
- Added v0.60 Playground stop and first-token timeout behavior: streaming tests can be stopped manually and no-token/stalled-token states show actionable guidance.
- Added v0.61 Easy Test Flow UX: loaded models get a direct Test this model panel in Run Model with starter prompts and a chat-like response.
- Added v0.62 GitHub public repo cleanup: archived old internal history, trimmed public agent prompts, added a GitHub release checklist, and kept current docs focused on the beta path.

## Next milestones

### v0.63 — Next beta fix from feedback

- Only after real tester confusion is identified.
- Prioritize fresh-install blockers, first successful remote launch, or model-library clarity if testers struggle.

### v1.0 — Stable release

- No sooner than real users can complete install, model load, quick test, and `/v1` endpoint handoff reliably.

## Product guardrails

- No generic chat UI expansion.
- No new dashboard-like Daily mode surfaces.
- No stale milestone/version labels in live UI; the only allowed release label is the compact current beta badge.
- No raw vLLM knobs in the default path.
- Prefer replacing surfaces over adding surfaces.
- Keep OpenAI-compatible endpoint handoff obvious.

## Desktop packaging decision

The beta stays web-first. Electron remains a preview shell until controller lifecycle, installer behavior, and update expectations are validated by real beta feedback.

For v0.62, do not promise signed installers, auto-update, or desktop-managed controller lifecycle.
