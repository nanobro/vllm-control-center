# v18.1 — Server UX Audit Fix

v18.1 is a focused bug-fix/polish pass after the first LM Studio-style Server page landed in v18.

## Goals

- Make the Server page safer to use as the primary entry point.
- Reduce accidental wrong-instance selection.
- Improve start/stop/create loading states.
- Add clearer empty/error/copy feedback.
- Warn before creating a new instance on an already-used host/port.
- Add a lightweight eject flow for stopped instances.

## Changes

### Frontend

- Persists the selected catalog model and selected instance in local storage.
- Clears stale selected instance IDs if the instance no longer exists.
- Avoids silently falling back to an unrelated old instance when a selected model has no matching instance.
- Adds disabled/loading states for start, stop, download, create, and eject actions.
- Adds clipboard feedback for endpoint and command copying.
- Adds readable API error formatting for FastAPI `detail` responses.
- Adds empty state when the catalog search has no results.
- Adds a host/port conflict warning before quick-launching a new instance.
- Routes Server → Playground and Server → Metrics with the selected instance ID.
- Marks supported endpoints as `ready` only when the selected instance is running.

### Backend

- Adds `DELETE /api/instances/{instance_id}` for ejecting stopped/crashed instances.
- Blocks deletion of running/starting/stopping instances.
- Deletes associated logs and metrics snapshots when ejecting an instance.

### Tests

- Adds instance deletion tests for stopped and running instance states.

## Non-goals

- No controller lifecycle auto-start yet.
- No desktop packaging behavior changes.
- No model catalog expansion.
- No vLLM runtime behavior changes.

## Manual checks

1. Open the Server page.
2. Search for a model and select it.
3. Create an instance without starting.
4. Verify the selected instance is preserved after refresh.
5. Start the instance and verify buttons show loading/disabled states.
6. Copy endpoint and command; verify success feedback appears.
7. Stop the instance.
8. Eject the instance; verify it disappears and model files are not deleted.
9. Try creating another instance on an occupied host/port; verify the warning appears.
