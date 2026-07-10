# v19 Agent Prompts

## Baseline

Continue from **v19** only. Do not use older zip packages as the base.

## Product direction

This project is an LM Studio-style control plane for vLLM. The Server page is now the primary local workflow.

Keep focusing on:

```text
model catalog -> download/register -> create instance -> start/stop -> endpoint -> logs/metrics/test
```

Do not turn the project into another generic chat UI.

## Non-negotiables

- Preserve FastAPI controller + React/Vite frontend.
- Frontend must not spawn vLLM.
- Never use `shell=True`.
- Add backend tests for new backend behavior.
- Run `./scripts/check.sh`.
- Update `CHANGELOG.md`, `README.md`, `ROADMAP.md`, and `docs/dev/*` tracking docs when a milestone is completed.

## Recommended next milestone

### v19.1 — Real Install Server QA

Focus on what breaks when installed on DGX Spark / Linux workstation / Mac client:

- verify npm install uses public registry lockfile URLs
- verify vLLM CLI missing path is readable from Server page
- verify port conflict handling
- verify downloads page and Server page reflect the same job status
- verify inline test prompt error state when vLLM server is not actually reachable
- add screenshots or screenshot placeholders for Server page

## Later milestone

### v20 — Controller Lifecycle Prototype

Only after Server UX is stable:

- start local controller helper
- PID/log storage in `.vcc-runtime/`
- stop only helper-owned controller processes
- keep vLLM instances running unless user explicitly stops them
- do not auto-start controller from Electron by default until lifecycle tests exist
