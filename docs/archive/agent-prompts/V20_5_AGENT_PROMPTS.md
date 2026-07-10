# v20.5 Agent Prompts

## Continue from v20.5

Use v20.5 only. Inspect the repo before editing. Do not rewrite from scratch.

Preserve:

- FastAPI controller + React/Vite frontend.
- vLLM as the engine, not replaced.
- safe subprocess execution; never use `shell=True`.
- compact primary navigation.
- Server page as the main LM Studio-style workflow.

Before changes:

1. Read `README.md`.
2. Read `docs/dev/PROJECT_STATUS.md`.
3. Read `docs/dev/AGENT_HANDOFF.md`.
4. Read `docs/V20_5_SERVER_REAL_QA_FIXES.md`.
5. Run `scripts/check.sh` when possible.

Recommended next milestone:

`v20.6 — Load/Unload State Machine Polish`

Goals:

- Make loaded/unloaded state clearer when multiple instances reference the same model.
- Prefer the running instance for the selected model.
- Add explicit `Load existing instance` vs `Create new instance` choices.
- Add safer duplicate instance warnings.
- Add UI copy that explains unload vs eject vs delete model files.
- Keep model files untouched.

Quality:

- Add backend tests for any changed route behavior.
- Run backend tests, backend lint, frontend build, and desktop shell check.
- Update changelog and dev tracking docs.
