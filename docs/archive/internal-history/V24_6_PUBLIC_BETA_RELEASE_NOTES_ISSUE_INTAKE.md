# v24.6 — Public Beta Release Notes & Issue Intake

v24.6 keeps the app feature-frozen and prepares the project for public beta feedback.

## Why this exists

v24.5 made screenshots and README presentation ready. The next release risk is not UI; it is feedback chaos. Beta testers need clear release notes, a known limitations list, and issue templates that tell maintainers what information matters.

## Added

- Public beta release notes draft: `docs/releases/PUBLIC_BETA_RELEASE_NOTES.md`
- Known limitations: `docs/releases/KNOWN_LIMITATIONS.md`
- Issue intake guide: `docs/releases/ISSUE_INTAKE.md`
- Beta feedback issue template: `.github/ISSUE_TEMPLATE/beta_feedback.md`

## Updated

- Bug report template now asks for the failed beta step, model source, model name, quick-test result, and sanitized logs.
- Feature request template now asks whether the idea belongs before v25.0 or after beta.
- README now links release notes, known limitations, and issue intake.
- Roadmap and milestones now mark v24.6 complete and keep v24.7 focused on desktop packaging decision only.
- Smoke checks now require the release-note and issue-intake files.

## Guardrails

- No new Daily mode surface was added.
- v24.6 should not change the product path.
- Bugs that do not block install, launch, load, quick test, endpoint copy, or clear remote states should usually wait until after v25.0.
