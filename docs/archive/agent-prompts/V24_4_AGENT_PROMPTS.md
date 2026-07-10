# v24.4 Agent Prompt — Next-Version Plan & Milestone Map

You are working on vLLM Control Center at v24.4.

The public beta UI surface is frozen. Do not add new Daily mode cards or widen navigation.

v24.4 focus:

- Create a clear next-version milestone plan.
- Align README, ROADMAP, CHANGELOG, smoke checks, and future-agent prompts.
- Keep the project pointed toward v25.0 public beta instead of feature creep.

Product positioning:

```text
LM Studio UX + vLLM power + remote GPU ops
```

Core daily flow:

```text
choose model -> load -> quick test -> copy OpenAI-compatible /v1 endpoint
```

Validation:

```bash
./scripts/launch-check.sh
./scripts/smoke.sh
cd controller && pytest -q
cd controller && ruff check app tests
npm --prefix frontend run build
```

Next recommended work after v24.4:

## v24.5 — Screenshot Capture & README Image Wiring

- Capture the five required screenshots from `docs/screenshots/README.md`.
- Ensure screenshots are secret-safe.
- Add images to README using captions from `docs/screenshots/CAPTIONS.md`.
- Do not add new UI unless screenshot capture exposes a real blocker.
