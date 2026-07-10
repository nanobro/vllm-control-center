# v0.56 — Visible Version Badge Sync Pass

## Goal

Remove stale visible version confusion. Testers should not see old sidebar labels such as old `v22.x beta` labels while using a newer public beta package.

## What changed

- Added `frontend/src/version.ts` as the single frontend source for the compact public beta label.
- The sidebar badge now renders `v${package.json version without trailing .0} beta`, for example `v0.56 beta`.
- The badge is sourced from `frontend/package.json`, so the normal package-version bump updates the visible app label too.
- Release and smoke checks now require the live frontend shell to use the current version label wiring.
- Historical documentation no longer advertises the old exact visible string old `v22.x beta` labels as active UI copy.

## UX guardrails

- This is a compact shell badge only; no new dashboard card was added.
- Daily mode remains Pick model -> Start -> Test -> Copy OpenAI base URL.
- Exact logs, paths, and advanced release details remain in drawers/details/Advanced mode.
- Qwen3.6 and large Qwen text-generation models remain runnable; size alone is not incompatibility.

## Verification

Required checks:

- `./scripts/version-scheme-check.sh`
- `./scripts/release-freeze-check.sh`
- `./scripts/bug-bash-check.sh`
- `./scripts/smoke.sh`
- `./scripts/check-screenshots.sh`
- Frontend build
- Backend tests and lint
- Desktop shell check

## Next

The public beta line continues as v0.56, then v0.57.
