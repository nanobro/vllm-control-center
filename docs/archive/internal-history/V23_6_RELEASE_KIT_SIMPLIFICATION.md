# v23.6 — Release Kit Simplification

v23.6 continues the simplification push by reducing the Release Kit from an internal milestone dashboard into a practical public beta checklist.

## Goal

Make the final support/release surface feel like a small maintainer tool, not another dense operations dashboard.

The Release Kit should answer:

1. Can a new user understand the core beta story?
2. Is there at least one model source to run?
3. Can the endpoint success state be shown?
4. Are there broken demo leftovers to clear?
5. Which screenshots still need to be captured?

## UX changes

- Removed stale version-specific release copy from the live page.
- Reframed the page around plain labels:
  - Release Kit
  - Readiness
  - Screenshots
  - Publish pack
- Reduced the number of visible cards.
- Replaced long RC wording with a compact beta readiness gate.
- Kept copyable beta summary, smoke path, and check/package commands.
- Updated the sidebar badge to `v23.6 beta RC`.

## Why this matters

The earlier release surface was useful for development, but it still exposed too much project history. v23.6 makes the page useful for a maintainer preparing the beta without reminding users of every previous milestone.

## QA checklist

- Open Release Kit with no controller running.
- Open Release Kit with controller running but no models.
- Open Release Kit with one local model detected.
- Open Release Kit with one loaded model.
- Confirm failed downloads or crashed instances appear as blockers.
- Confirm copy buttons still work.
- Confirm frontend build and backend tests pass.
