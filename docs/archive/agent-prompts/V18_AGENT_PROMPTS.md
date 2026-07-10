# v18 AI Agent Prompts

## Baseline

Use **v18 only**. Do not mix older zips.

Before editing, read:

1. `README.md`
2. `docs/dev/PROJECT_STATUS.md`
3. `docs/dev/AGENT_HANDOFF.md`
4. `docs/V18_SERVER_PAGE_POLISH.md`

## General rules

- Do not rewrite the repository from scratch.
- Preserve FastAPI controller + React/Vite frontend architecture.
- Preserve safe subprocess execution. Never use `shell=True`.
- Keep the Server page as the primary local launch UX.
- Add tests for backend behavior when backend changes are made.
- Run `./scripts/check.sh` before handing off.

## Suggested next task: v18.1 Server UX Audit Fix

Inspect the v18 Server page with a local controller and a real or fake vLLM instance.

Fix only obvious UX issues:

- selected model/instance persistence
- disabled button states during start/stop/create
- clearer errors when vLLM CLI is missing
- clearer empty states when there are no instances/catalog models
- copy feedback for endpoint/command buttons
- avoid selecting a random old instance when a model is selected

Do not add controller lifecycle or desktop auto-start in v18.1.

## Suggested v19 task: Server Page Real-World Polish

Add:

- local storage for selected server model/instance
- Start Server from registered/local model records, not only catalog models
- Eject/Delete instance action with confirmation
- port conflict pre-check if available
- inline mini playground smoke prompt
- better model inspector metadata from model registry

Keep scope focused on the core LM Studio-like local server flow.
