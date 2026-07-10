# v0.26 — Beta Feedback Fix Lane

v0.26 keeps the public beta line moving without reopening feature work.

v0.25 reset the public version scheme and established the first beta tag. v0.26 is the first follow-up release in the new scheme. Its purpose is to make beta feedback safe to process: classify issues, fix blockers, document non-blockers, and prevent the project from drifting back into the old v24/v25 numbering.

## Scope

v0.26 is allowed to change:

- install and launch checks,
- beta feedback intake docs,
- release-gate wording,
- known limitations,
- package/version metadata,
- version-scheme guardrails,
- low-risk copy that removes confusion.

v0.26 should not add:

- new Daily mode cards,
- new top-level navigation,
- a generic chat UI,
- signed desktop installer promises,
- cloud account assumptions,
- speculative model/provider features without tester evidence.

## What changed

- Bumped public package metadata to `0.26.0`.
- Updated README, ROADMAP, CHANGELOG, and milestone docs to show v0.26 as the current beta feedback lane.
- Added a dedicated version-scheme check so future agents do not accidentally revive `v25.0`, `v26.x`, or `v24.10` as public version targets.
- Updated beta bug-bash status to separate v0.25 tag history from v0.26 follow-up fixes.
- Kept Electron preview-only and web-first.
- Kept Daily mode frozen.

## Release rule

Ship v0.26 only if at least one of these is true:

1. It fixes a blocker found by beta testing.
2. It improves release checks or documentation used by beta testers.
3. It corrects version-scheme drift.
4. It clarifies a known limitation that would otherwise create support noise.

Do not use v0.26 as a feature dump.

## Verification expectation

Before packaging v0.26, run:

```bash
./scripts/version-scheme-check.sh
./scripts/launch-check.sh
./scripts/smoke.sh
./scripts/check-screenshots.sh
./scripts/bug-bash-check.sh
./scripts/release-freeze-check.sh
```

Then run backend tests/lint, frontend build, and the desktop shell check.
