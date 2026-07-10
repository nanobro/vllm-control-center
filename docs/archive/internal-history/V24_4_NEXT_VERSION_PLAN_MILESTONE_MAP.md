# v24.4 — Next-Version Plan & Milestone Map

v24.4 does not add product UI. It turns the post-freeze roadmap into an explicit milestone plan so future work does not drift back into feature creep.

## Why this version exists

After v24.0 froze the public beta surface, v24.1-v24.3 hardened beta readiness:

- smoke checks,
- install and launch checks,
- README positioning,
- screenshot contracts,
- and beta walkthrough docs.

The next risk is unclear direction. Without a plan, the project could start adding cards and tools again. v24.4 creates a clear path from beta readiness to public beta release.

## Added

- `docs/MILESTONES.md` with lanes for:
  - v24.x beta confidence work,
  - v25.0 public beta tag,
  - v26.x post-beta expansion.
- Explicit ship criteria for v24.5 through v24.9.
- Decision gates for screenshots, desktop preview, and public beta tag.
- Guardrails for future agents and maintainers.

## Changed

- README current release and package command now reference v24.4.
- ROADMAP now uses the milestone map instead of conflicting v24.3/v24.4 entries.
- Demo docs now use the current `Setup check` naming and v24.3 screenshot filename contract.
- Smoke checks now require the milestone docs.

## Not changed

- No new Daily mode UI.
- No new sidebar surfaces.
- No endpoint behavior changes.
- No new model/download feature.

## Next recommended milestone

v24.5 should capture the real screenshot set and wire those images into README/release pages, using `docs/screenshots/CAPTIONS.md`.
