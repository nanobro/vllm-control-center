# v23.3 Agent Prompt — Remote Page Simplification

## Context

The user showed an older screenshot where the app felt too busy and repetitive. v23.1 simplified Run Model. v23.2 simplified Models. v23.3 simplified Remote.

## Intent

Remote should feel like a simple GPU command center, not an ops dashboard.

Main flow:

1. Choose remote GPU.
2. See connected/disconnected status.
3. See running/selected model.
4. Copy OpenAI-compatible `/v1` endpoint.
5. Start/Stop/Restart.
6. Quick test.
7. Open logs only when needed.

## Rules for future agents

- Do not reintroduce large always-visible remote setup forms.
- Do not put GPU metrics, runtime metrics, saved profiles, and instance lists all on screen by default.
- Keep add/manage remote GPUs behind disclosure unless it is a first-run empty state.
- Treat Remote as a daily-use page for people who already have a GPU box.
- Keep deeper operations in Advanced tools or disclosures.

## Acceptance criteria

- Remote has one primary workbench.
- Main path answers: connected? model running? endpoint? test/logs?
- Remote model list, GPU health, metrics, and saved remotes are still accessible.
- Frontend build and backend checks pass.
