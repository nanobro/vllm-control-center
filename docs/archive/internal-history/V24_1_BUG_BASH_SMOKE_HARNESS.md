# v24.1 — Public Beta Bug Bash & Smoke Harness

v24.1 keeps the v24.0 feature freeze intact. It adds release-confidence tooling rather than new user-facing surfaces.

## Why

After the simplification and public beta freeze, the biggest risk is not missing features. The risk is shipping a beta that feels good in one prepared state but confusing on a fresh machine.

v24.1 adds a repeatable bug-bash path so maintainers and testers can check first-run, local models, endpoint success, recovery, and remote states consistently.

## Added

- `scripts/smoke.sh`
- `make smoke`
- `docs/BETA_BUG_BASH.md`
- Updated Release kit commands to include the smoke harness
- Updated README and roadmap toward real-user bug bash instead of feature growth

## Smoke harness scope

The smoke script checks:

- repository shape
- required files
- Python / Node / npm availability
- optional vLLM / NVIDIA tooling
- stale milestone wording in live frontend copy
- public beta badge presence
- live core API endpoints when the controller is already running

It does not install GPU drivers, download models, or start vLLM. It is intentionally low-risk and safe to run on a fresh clone.

## Daily mode guardrail

v24.1 does not add new Daily mode cards. Any future beta work should follow the same pattern: add confidence, docs, tests, or replacement UI; do not widen the default surface.

## Manual bug bash path

See `docs/BETA_BUG_BASH.md` for the human test checklist.
