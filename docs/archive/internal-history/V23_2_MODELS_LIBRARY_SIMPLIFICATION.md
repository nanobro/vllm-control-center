# v23.2 — Models Library Simplification

## Goal

Reduce cognitive load on the Models page after the Run Model simplification pass.

The Models page should feel like a library, not an operations dashboard. Daily model actions should be obvious, while setup/download/scanning controls stay available but quiet.

## What changed

- Simplified the Models hero into one plain purpose statement.
- Reduced the summary metrics to the four signals users need most:
  - On device
  - Running
  - Downloads
  - Needs help
- Moved download, scan-path, host, and port controls behind **Add or scan models**.
- Kept search and status filters visible as the primary library controls.
- Reduced row metadata to the useful first-glance chips:
  - compatibility
  - format
  - quantization
  - size
  - quiet path hint
- Removed the repeated footer card pointing users back to Run Model.
- Kept detailed metadata, compatibility reasons, recommended settings, endpoint actions, logs, and testing in the Model Detail Drawer.

## UX rule

The list answers: **What models do I have and what state are they in?**

The drawer answers: **What can I do with the selected model?**

Advanced setup answers stay one click away, but are not shown by default.

## Manual QA

1. Open Models with many local variants.
2. Confirm the top page does not stack setup, download, scan, and run guidance at once.
3. Search for a model by name, format, quantization, and path.
4. Filter All, This device, Downloads, Running, and Needs attention.
5. Select a model and confirm the drawer shows detailed metadata/actions.
6. Open **Add or scan models** and confirm download, scan path, host, and port controls still work.
7. Confirm failed download/crashed instance recovery still appears only when relevant.
