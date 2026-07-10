# Milestones

## Version scheme

The public beta line uses pre-1.0 versions:

- v0.25 — first public beta after the archived internal release-candidate line
- v0.26+ — beta feedback fixes
- v1.0 — stable only after real users can install, run, test, and use the endpoint reliably

Do not return to old internal/public-candidate numbering unless the project owner explicitly changes the scheme again.

## Current lane

| Version | Milestone | Ship criteria |
| --- | --- | --- |
| v0.25 | Public beta tag and version-scheme reset | Public docs agree on v0.25, package command uses v0.25, Daily mode remains frozen, release checks pass, Electron remains preview-only. |
| v0.26 | Beta feedback fix lane | Fix release-gate or beta-feedback blockers only. Add version-scheme guardrails. No new Daily mode surfaces unless replacing a confusing one. |
| v0.27 | Real-user feedback intake polish | Clarify tester handoff, blocker criteria, and feedback routing. Avoid speculative features. |
| v0.28 | Model library beta fix pass | Reduce noisy paths/rows and make empty states clearer. |
| v0.29 | Endpoint and quick-test beta fix pass | Clarify `/v1` base URL copy, quick-test confidence, and endpoint handoff. |
| v0.30 | LM Studio familiarity and auto-detect fix pass | Fix text overflow, simplify Start/Test/Copy wording, and auto-detect LM Studio/HF/vLLM/Unsloth/common model folders. |
| v0.31 | Model picker scroll and load reliability fix pass | Show more Hugging Face results, make the picker scrollable, clarify filtered library views, and use the next free port automatically. |
| v0.32 | Real crash diagnosis and runnable model confidence pass | Explain CRASHED states clearly, separate common vLLM failures, keep Qwen3.6/large Qwen text models runnable, and add safe next actions. |
| v0.33 | Real vLLM happy-path validation | Keep spawned vLLM processes in warming-up state until `/v1/models` or `/health` responds; avoid false running states before Quick test/copy endpoint. |
| v0.34 | Start honesty and local crash memory | Distinguish start requested from endpoint ready, return actual assigned ports after auto-selection, and show recent local crash reasons without noisy logs. |
| v0.35 | Remote endpoint handoff guard | Make the selected remote model the source of truth for copy/test, block stopped or stale endpoint handoff, and keep Remote simple. |
| v0.36 | Low VRAM retry confidence | Let crashed local loads retry the same instance with safer settings without treating large text models as incompatible. |
| v0.37 | Test-before-copy handoff | Unlock local endpoint copy and SDK snippets only after Quick test passes for the selected running model. |
| v0.38 | Detail drawer handoff guard | Make the model detail drawer follow the same Quick test-before-copy gate as the main Run Model handoff. |
| v0.39 | Remote test-before-copy handoff | Unlock remote endpoint copy only after Quick test passes for the selected running remote model. |
| v0.40 | Tested endpoint state labels | Running endpoints stay visible but untested until Quick test passes; tested endpoints are clearly ready. |
| v0.41 | Restart-safe test handoff | Quick test success belongs only to the exact selected local or remote server run; restarts and endpoint changes require retest before Copy. |
| v0.42 | Quick test failure guidance | Failed Quick tests show a readable reason plus next actions while Copy remains gated until a successful test. |
| v0.43 | Streaming test failure guidance | Streaming playground failures show a readable reason plus next-action chips. |
| v0.44 | Served model mismatch guidance | Quick test suggests the actual `/v1/models` served name when the request model alias is wrong. |
| v0.46 | Auto served name retry | Automatically retry once with the actual `/v1/models` served name, then use that passed name in snippets. |
| v0.47 | Tested model name handoff clarity | Show and copy the exact model name that passed Quick test for local and remote endpoint handoff. |
| v0.48 | Endpoint handoff bundle copy | Copy the tested `/v1` base URL and exact tested model name together after Quick test passes. |
| v0.49 | Environment handoff copy | Copy tested `.env` values for local and remote app integration after Quick test passes. |
| v0.50 | Safe env handoff quoting | Quote unusual `.env` values in tested local and remote handoff copies without adding Daily mode clutter. |
| v0.51 | Clipboard fallback handoff reliability | Make local, remote, setup, and release copy actions work even when the Clipboard API is blocked. |
| v0.52 | Manual copy fallback preview | Show a selectable handoff payload when clipboard copy is blocked after fallback. |
| v0.53 | Manual copy select-all confidence | Add Select all and size hints to manual-copy fallback panels for blocked clipboard environments. |
| v0.54 | Copy success confirmation | Show a lightweight last-copied confirmation for tested local and remote handoffs, then clear it when selected run/profile state changes. |
| v0.55 | Long model ID overflow polish | Keep long HF IDs, served names, snapshot filenames, and local paths from stretching main rows while keeping full values in details. |
| v0.56 | Visible version badge sync | Show the current beta version in the app shell from package metadata and prevent stale historical beta labels. |
| v0.58 | Playground served-name auto-retry | Playground retries once with the actual `/v1/models` served name when a loaded endpoint rejects the configured alias. |
| v0.59 | Playground wildcard host connection | Playground connects through loopback when vLLM is bound to wildcard hosts such as `0.0.0.0` while showing a friendly localhost endpoint. |
| v0.60 | Playground stop and first-token timeout | Let users stop stuck streaming tests and show first-token/inactivity timeout guidance instead of waiting forever. |
| v0.61 | Easy test flow UX | Show a direct Test this model panel after load, with editable prompt, starter prompts, and chat-like response. |
| v0.62 | GitHub public repo cleanup | Archive old internal history, trim public prompts, add the GitHub release checklist, and keep first-publication docs clean. |
| v0.63 | Next feedback fix | Address the next real tester blocker without widening Daily mode. |

## v1.0 criteria

v1.0 should wait until the core path is reliable for real users:

- Fresh clone path works with `./scripts/bootstrap.sh`, `./scripts/dev.sh`, and `./scripts/launch-check.sh`.
- Daily mode remains limited to Run Model, Models, Remote, and Settings.
- At least one local model happy path has been manually tested on a vLLM-capable machine.
- Quick test success and endpoint copy are obvious without reading docs.
- README, ROADMAP, CHANGELOG, and beta status docs agree on release status.

## Non-goals for v0.60

- Do not add a generic chat UI.
- Do not add more Daily mode cards.
- Do not expose raw vLLM knobs in the default path.
- Do not introduce cloud account or hosted service assumptions.
- Do not widen the nav again.
- Do not promise signed desktop installers or auto-update.

## v0.60 gate — Playground stop and first-token timeout

Ship v0.60 only for the real tester blocker where Playground can look stuck on a loaded model while waiting for the first streaming token. Do not add a generic chat UI or new Daily mode panel. Playground should let users stop a streaming test, time out first-token and stalled-token cases with clear next actions, and keep loaded/warming instance selection, served-name auto-retry, and wildcard-host loopback behavior from v0.57-v0.59. The visible beta badge must still come from package metadata.

Required v0.60 checks:

- `./scripts/version-scheme-check.sh` passes.
- `./scripts/release-freeze-check.sh` passes.
- `./scripts/bug-bash-check.sh` passes.
- `./scripts/smoke.sh` passes with only expected local warnings.
- `./scripts/check-screenshots.sh` passes.
- Backend tests and lint pass.
- Frontend build passes.
- Live frontend copy check confirms the sidebar badge is wired to the current version label.
- Playground UI copy confirms loaded/warming model selection and no stale historical beta badge copy in live frontend source.


## v0.61 gate — Easy test flow UX

Ship v0.61 only if a tester who has loaded one model can see where to test it without opening a separate Playground page. The Run Model page must show an obvious **Test this model** panel, an editable prompt, small starter prompt chips, and a readable response card. Keep copy/base URL gating from the exact tested server run. Keep full logs, Playground, SDK snippets, and exact paths in details/drawers instead of adding dashboard clutter.

Required v0.61 checks:

- `scripts/check.sh`
- frontend build
- backend tests
- backend lint
- desktop shell check
- version scheme check
- release freeze check
- bug-bash check
- screenshot check
- smoke check
- launch check

## v0.62 gate — GitHub public repo cleanup

Ship v0.62 only if the repository is comfortable to publish as a public beta source tree. Old internal v3-v24 history should be archived, public agent prompts should be trimmed to the current maintenance window, README should explain beta status near the top, and a GitHub release checklist should exist for maintainers. Do not change the app's main Daily path in this release.

Required v0.62 checks:

- README current release is v0.62 and includes beta status / known limitations.
- `docs/GITHUB_RELEASE_CHECKLIST.md` exists.
- `docs/archive/internal-history/` contains old internal version docs.
- `docs/archive/agent-prompts/` contains older handoff prompts.
- `ai-agent-prompts/` only contains NEXT plus the current prompt window.
- Standard version, release-freeze, bug-bash, screenshot, frontend, backend, and desktop checks pass.
