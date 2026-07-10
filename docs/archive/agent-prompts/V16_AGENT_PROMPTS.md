# v16 Agent Prompts

## Baseline instruction

Inspect this repository first. Do not rewrite it from scratch.

Continue from v16 of vLLM Control Center.

Product direction:

- LM Studio-style control plane for vLLM.
- Web-first architecture remains the source of truth.
- Desktop shell must wrap the existing frontend/controller, not replace them.
- Preserve safe process execution. Never use `shell=True`.
- Preserve controller auth and secret handling.
- Add tests or checks for new behavior.
- Run `scripts/check.sh` and any desktop-specific checks you add.
- Update `docs/dev/PROJECT_STATUS.md`, `docs/dev/TODO.md`, and `CHANGELOG.md` when completing a milestone.

## Recommended v17 milestone: Controller Lifecycle Prototype

Implement a safe desktop/controller lifecycle prototype.

Requirements:

1. Add a script that starts the local FastAPI controller on `127.0.0.1:8787`.
2. Add a script that stops only the controller process it started.
3. Store controller PID/logs in a local runtime directory such as `.vcc-runtime/`.
4. Do not stop vLLM model processes automatically.
5. Add docs explaining the lifecycle model.
6. Add tests or smoke checks for PID file behavior where practical.
7. Keep Electron auto-start disabled unless explicitly requested by env/config.

Acceptance:

- Existing backend tests pass.
- Frontend build passes.
- Desktop shell check passes.
- Starting/stopping the controller script does not use unsafe shell execution.
