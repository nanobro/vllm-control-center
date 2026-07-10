# v24.8 — Beta Bug-Bash Fix Pass

v24.8 is a release-confidence pass. It does not add new product surfaces. It tightens the public beta checklist so maintainers can decide whether the package is ready for a v24.9 re-freeze and v25.0 public beta tag.

## Goals

- Keep the public beta web-first and Daily mode focused.
- Make bug-bash status explicit instead of scattered across release notes.
- Add a lightweight blocker checklist that can run before packaging.
- Require each beta concern to be classified as blocker, polish, post-beta, or not planned.
- Keep Electron preview-only for v25.0.

## What changed

- Added `docs/releases/BETA_BUG_BASH_STATUS.md` for blocker tracking.
- Added `scripts/bug-bash-check.sh` for release-readiness sanity checks.
- Added `make bug-bash-check`.
- Updated `docs/BETA_BUG_BASH.md` with triage rules and required outcomes.
- Updated `docs/MILESTONES.md` so v24.8 has clear ship criteria and a gate.
- Updated smoke checks to require the new v24.8 files.

## v24.8 decision

This pass found no reason to reopen feature work before v25.0. The next intended milestone is v24.9 public beta re-freeze.

Only fix blockers before v24.9:

- fresh install cannot complete
- app cannot launch with documented commands
- Daily mode opens confusingly
- model scan/download/load path is broken
- Quick test or endpoint copy is broken after a successful load
- release docs/screenshots/known limitations are missing or misleading

Everything else should move to post-beta unless it removes a clear first-five-minute confusion point.
