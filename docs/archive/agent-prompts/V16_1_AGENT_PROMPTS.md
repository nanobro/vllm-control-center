# v16.1 Agent Prompts

## Baseline

Continue from v16.1 of vLLM Control Center. Do not use v16 or earlier zips.

## Rules

- Inspect the repository first.
- Do not rewrite from scratch.
- Preserve FastAPI controller + React/Vite frontend.
- Preserve the Electron shell as a low-risk spike, not the main app architecture.
- Never use `shell=True`.
- Keep generic remote forwarding disabled unless a task explicitly requires it.
- Add tests for backend behavior changes.
- Run `scripts/check.sh` before packaging or handing off.
- Update `docs/dev/PROJECT_STATUS.md`, `docs/dev/TODO.md`, and `CHANGELOG.md` when completing a milestone.

## Recommended next milestone

v17 — Controller Lifecycle Prototype

Scope:

- Add a local controller start script.
- Store PID/logs under `.vcc-runtime/`.
- Stop only controller processes started by the lifecycle helper.
- Document keep-running-on-close behavior.
- Keep Electron controller auto-start disabled by default.
- Do not auto-stop vLLM instances on desktop close.
- Add smoke tests for PID ownership behavior.
