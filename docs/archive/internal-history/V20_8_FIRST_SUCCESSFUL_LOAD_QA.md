# v20.8 — First Successful Load QA

v20.8 focuses on making the first successful Server run easier to understand.

## What changed

- Added a first-success checklist to the Server Simple Mode.
- The checklist tracks: model selected, available to load, server loaded, quick test passed, and endpoint copied.
- The guided download step now recognizes when the selected model already exists on the device.
- Server Load now prefers the local/on-device model record when one is available, then falls back to catalog quick launch.
- Inline quick test success is now part of the guided completion state.

## Why

The app had many powerful controls but still felt hard to use. This pass makes the top-level path explicit: choose a model, make sure it is available, load it, test it, and copy the endpoint.

## Non-goals

- No model files are deleted.
- No new inference engine behavior is introduced.
- Advanced cockpit functionality remains available but is not the first thing users see.
