# v24.5 Agent Prompts — Screenshot Capture & README Image Wiring

Use this when continuing after v24.5.

## Current state

v24.5 wires the public beta screenshot gallery into README and adds repeatable screenshot tooling.

New files:

- `scripts/capture-screenshots.sh`
- `scripts/check-screenshots.sh`
- `docs/screenshots/MANIFEST.md`
- `docs/V24_5_SCREENSHOT_CAPTURE_README_WIRING.md`

The app supports hidden screenshot routing with query params:

- `?page=server&mode=daily`
- `?page=models-library&mode=daily`
- `?page=remote&mode=daily`
- `?page=setup&mode=advanced`

Do not turn this into visible navigation or add new Daily mode cards.

## Next recommended milestone

v24.6 — Public Beta Release Notes & Issue Intake.

Focus on:

- GitHub release notes draft.
- Known limitations. 
- Bug report rubric.
- Tester instructions.
- Issue templates aligned to the beta happy path.

Avoid new product surfaces unless a release-readiness gap requires a small copy-only fix.
