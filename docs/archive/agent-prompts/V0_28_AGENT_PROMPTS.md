# v0.28 Agent Prompt — Model Library Beta Fix Pass

Start from the latest v0.27/v0.28 beta package. Public releases use the v0.x scheme. Do not return to v24.x, v25.0, or v26.x numbering.

## Product position

vLLM Control Center is:

LM Studio UX + vLLM power + remote GPU ops.

It is not a generic chat UI.

## v0.28 scope

Keep this release focused on the Models page and beta clarity:

- Reduce row noise.
- Keep long local paths in the detail drawer, not default rows.
- Improve search/filter empty-state recovery.
- Keep load/unload/test/copy endpoint as the core path.
- Keep Daily mode frozen.
- Keep Electron preview-only.
- Keep beta web-first.

## Do not add

- New Daily mode cards.
- New sidebar pages.
- New generic chat features.
- Installer or auto-update promises.
- Broad model catalog redesign unless requested.

## Required checks

Run version-scheme, release-freeze, bug-bash, screenshot, smoke, frontend build, backend tests/lint, and desktop shell checks before packaging.
