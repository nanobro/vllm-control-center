# v21.8 — Remote GPU Polish

## Goal

Make the **Remote** workflow feel as simple as the new Run Model flow.

The product positioning is still:

```text
LM Studio UX + vLLM power + remote GPU ops
```

v21.8 focuses on the last part: users should be able to open Remote and immediately understand:

1. Am I connected to my GPU box?
2. What model is running?
3. Is GPU memory healthy?
4. Where is the OpenAI-compatible endpoint?
5. Can I test, restart, or open logs quickly?

## UX changes

### Remote is now a simple command center

The primary **Remote** page now has one main view instead of feeling like a profile-management utility.

It shows:

- selected remote GPU controller
- connected / disconnected / not checked state
- latency
- running model count
- total remote instances
- auth status
- currently selected remote model
- endpoint copy action
- start / stop / restart / logs actions
- quick one-shot test for running remote models
- GPU health cards
- runtime metrics
- saved remote profiles

### Remote profiles are still available, but quieter

Adding a remote GPU is now tucked inside an **Add remote GPU** disclosure on the right side.

This reduces cognitive load for normal daily use. Most sessions should be:

```text
Open Remote -> Reconnect -> inspect running model -> copy endpoint / test / logs / restart
```

not:

```text
Manage remote profile records -> forward doctor -> jump to remote instances -> jump to remote playground
```

### Better endpoint behavior

The Remote page derives an OpenAI-compatible `/v1` endpoint from the selected remote profile and instance.

For instances bound to `0.0.0.0`, `127.0.0.1`, or `localhost`, the UI uses the remote profile hostname so users do not copy an unusable local-only host by accident.

### GPU health

GPU health pulls from remote instance metrics when a running instance is selected, and falls back to remote doctor data when available.

Shown per GPU:

- GPU index
- GPU name
- VRAM percentage
- used / total VRAM
- temperature when available

### Advanced details stay hidden

The old lower-level Remote Instances and Remote Playground pages remain under Advanced tools for power users, but the main Remote tab now covers the common remote ops loop.

## QA checklist

- Remote tab opens with no saved profiles.
- Add remote profile disclosure still creates a profile.
- Default profile is selected automatically.
- Reconnect probes the remote profile and updates status.
- Remote instances list refreshes.
- Selecting a remote model updates endpoint, metrics, logs, and actions.
- Endpoint copy uses profile hostname when instance host is localhost-style.
- Start / Stop / Restart actions invalidate the remote instance list.
- Quick test only appears for a running remote model.
- Logs stream inline and can be hidden.
- Frontend build passes.
- Backend tests pass.
