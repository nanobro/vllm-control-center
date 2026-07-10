# v10.1 — Audit Fix Pass

This pass fixes the practical issues found during the v10 audit before new feature work continues.

## Changes

- Updated README verification status from stale v7-era counts to the current v10.1 test count.
- Replaced deprecated `datetime.utcnow()` usage with timezone-aware UTC timestamps in remote profile code.
- Clarified that the controller is localhost-first and should not be exposed publicly without auth, TLS, and network controls.
- Documented that remote profile API keys are currently stored in the local SQLite database and must be treated as sensitive.
- Pinned frontend dependency versions instead of using `latest`.
- Added additional remote bridge path validation tests for query strings, encoded traversal attempts, and backslash traversal.

## Why this exists

v10 introduced enough product surface area that an audit pass was worthwhile before continuing to v11. This pass deliberately avoids large feature work and keeps the repository stable for open-source publication.
