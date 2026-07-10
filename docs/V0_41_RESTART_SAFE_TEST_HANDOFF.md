# v0.41 — Restart-safe Test Handoff Pass

v0.41 is a small confidence fix after the test-before-copy and endpoint-label passes.

## Goal

A passed Quick test must prove the exact endpoint run the user is about to copy. If the selected instance restarts, changes port, changes pid/start time, changes status, or the user switches local/remote selection, Copy should lock again until the new run is tested.

## Product rules

- Keep Daily mode simple: Pick model -> Start -> Test -> Copy OpenAI base URL.
- Keep endpoint URLs visible for orientation.
- Do not add dashboard clutter.
- Keep exact process details in logs/details, not noisy main rows.
- Do not block Qwen3.6 or large Qwen text-generation models just because they are large.

## Implementation notes

- Local handoff uses a selected-run key built from instance id, status, pid/start time, host, and port.
- Remote handoff uses a selected-run key built from remote profile, instance id, status, pid/start time, host, and port.
- Quick test success stores the key that was tested.
- Copy unlocks only when the current selected-run key matches the tested key and the endpoint is running.
- Stop/start/restart, profile switches, selected model changes, and port changes clear the tested state.

## Verification focus

- Start a local model, pass Quick test, confirm Copy unlocks.
- Restart or stop/start the same instance and confirm Copy locks again.
- Switch to another local model and confirm Copy stays locked until retested.
- Repeat the same flow on the Remote page.
