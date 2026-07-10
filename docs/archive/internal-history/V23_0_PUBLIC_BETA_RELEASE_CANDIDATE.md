# v23.0 — Public Beta Release Candidate

## Goal

Freeze visible feature growth and make the project safe to publish as a public beta candidate.

The product now has the core LM Studio-style loop:

```text
Detect/download model -> choose variant -> load/unload -> quick test -> copy OpenAI-compatible /v1 endpoint
```

v23.0 does not add another user workflow. It turns the existing Beta Release Kit into a release-candidate gate so maintainers can see whether the current app state is publishable.

## What changed

### RC readiness gates

The Beta Release Kit now shows pass/warn/block gates for:

- controller readiness state
- local or downloaded model source availability
- endpoint success visibility
- unresolved failed downloads or crashed instances
- remote GPU story coverage
- screenshot readiness

Warnings are allowed when intentional. Blockers should be resolved before publishing beta screenshots or tagging a release.

### Copyable launch helpers

The Release Kit now includes copyable text for:

- public beta notes
- RC smoke checklist
- check/package command snippets

This keeps GitHub release prep consistent and reduces maintainer copy/paste drift.

### Feature freeze messaging

Docs now frame the next cycle as QA and packaging rather than feature expansion.

## Manual RC smoke path

Before publishing:

1. Fresh clone the repo.
2. Run `./scripts/dev.sh`.
3. Open Run Model.
4. Confirm Setup Doctor is readable and plain-English.
5. Scan `./models` or Hugging Face cache.
6. Load one small model.
7. Run Quick Test.
8. Copy the `/v1` endpoint.
9. Open Models and confirm the running model is visible.
10. Open Remote with zero profiles and with one safe demo profile.
11. Capture the five README screenshots.
12. Run `./scripts/check.sh`.
13. Package without generated junk, local DBs, or secrets.

## Non-goals

- No new model catalog expansion.
- No new vLLM argument surfaces.
- No benchmark runner yet.
- No desktop signing/autoupdate work yet.
- No generic chat UI positioning.

## Acceptance criteria

- Sidebar badge reads `v23.0 beta RC`.
- Beta Release Kit clearly shows RC blockers and warnings.
- Maintainers can copy release notes, RC checklist, and package commands from the app.
- README, ROADMAP, and CHANGELOG identify v23.0 as the current release candidate.
- Build, tests, lint, and desktop shell checks pass.
