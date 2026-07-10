# Beta Feedback Fix Lane

This project now uses public pre-1.0 beta versions starting at v0.25. Follow-up releases such as v0.26, v0.27, v0.28, v0.30, v0.31, v0.32, v0.33, v0.34, v0.35, v0.36, v0.37, v0.39, v0.43, v0.44, v0.45, v0.47, v0.50, v0.51, v0.52, v0.53, v0.54, v0.55, v0.56, v0.57, v0.58, and v0.60 should be driven by tester feedback, not speculative roadmap expansion.

## v0.x triage order

1. Fresh install or launch blockers.
2. Model detection/download/load blockers.
3. Quick test or `/v1` endpoint-copy blockers.
4. Remote GPU state confusion that prevents testing.
5. Documentation or screenshot issues that make beta onboarding unclear.
6. Everything else waits unless it removes confusion with very low risk.

## Allowed v0.x beta fixes

- Broken command or script.
- Missing required doc/file for release checks.
- Confusing beta wording.
- Incorrect version reference.
- Known limitation that should be explicit.
- Safe UI copy reduction that does not add a new surface.

## Not allowed without owner approval

- New Daily mode cards.
- New navigation sections.
- Generic chat UI.
- Signed installer promise.
- Auto-update promise.
- Hosted/cloud control-plane assumptions.
- Large post-beta features.

## Version rule

Use v0.62 for this release. Future public beta releases continue as v0.63, v0.64, and so on. Do not create v25.0, v26.x, or v24.10 unless the project owner explicitly reverses the version reset.
