# v0.26 Agent Prompt — Beta Feedback Fix Lane

Start from v0.25.

v0.26 is the first follow-up after the public version reset. Keep the project on the pre-1.0 public beta line:

- v0.25 = first public beta tag and version-scheme reset.
- v0.26 = beta feedback fixes and release-lane hardening.
- v0.27+ = future beta fixes from real feedback.
- Do not create v25.0, v26.x, or v24.10 unless explicitly told.

## Work allowed in v0.26

- Fix beta blockers from install, launch, model scan/download/load, quick test, endpoint copy, remote state, release docs, or version consistency.
- Update known limitations and bug-bash status.
- Add release/check scripts if they prevent version drift or packaging mistakes.
- Reduce confusing copy.

## Work not allowed

- No new Daily mode cards.
- No new top-level nav.
- No generic chat UI.
- No signed desktop installer promises.
- No hosted/cloud account assumptions.
- No speculative feature expansion.

## Required checks

Run:

```bash
./scripts/version-scheme-check.sh
./scripts/launch-check.sh
./scripts/smoke.sh
./scripts/check-screenshots.sh
./scripts/bug-bash-check.sh
./scripts/release-freeze-check.sh
```

Then run backend tests/lint, frontend build, and desktop shell check.
