# v24.9 — Public Beta Re-Freeze

v24.9 is the final pre-tag freeze candidate before the v25.0 public beta tag.

This release intentionally avoids new product surfaces. It checks that the beta package, docs, screenshots, issue intake, known limitations, and desktop support boundaries all agree.

## Scope

v24.9 keeps the product frozen around the daily path:

```text
choose model -> load -> quick test -> copy OpenAI-compatible /v1 endpoint
```

No new Daily mode cards, navigation groups, chat UI, or advanced vLLM controls were added.

## What changed

- Added `scripts/release-freeze-check.sh` and `make release-freeze-check`.
- Added a v24.9 release-freeze gate for version consistency, release docs, screenshots, desktop preview status, and stale UI wording.
- Updated README, ROADMAP, CHANGELOG, milestones, and beta bug-bash status to v24.9.
- Updated smoke checks to require the v24.9 re-freeze docs and script.
- Reframed the next agent handoff around v25.0 public beta tagging, not feature work.

## v25.0 readiness status

v24.9 is ready as a package candidate when automated checks pass.

Before cutting v25.0, maintainers should still run one real happy path on a vLLM-capable machine:

1. Bootstrap dependencies.
2. Start the dev app.
3. Detect or download one model.
4. Load the model.
5. Run Quick test.
6. Copy the `/v1` endpoint and use it from one external client.

If this cannot be run, mark it explicitly in `docs/releases/BETA_BUG_BASH_STATUS.md` rather than silently calling v25.0 done.

## Verification commands

```bash
./scripts/launch-check.sh
./scripts/smoke.sh
./scripts/check-screenshots.sh
./scripts/bug-bash-check.sh
./scripts/release-freeze-check.sh
./scripts/check.sh
```

Expected local-environment warnings are acceptable for missing `vllm`, missing `nvidia-smi`, or an inactive controller in a packaging environment.

## Guardrails for future work

- v25.0 should be a release tag, not a feature dump.
- Electron remains preview-only.
- The public beta remains web-first.
- Post-beta product expansion starts in v26.x only after real beta feedback.
