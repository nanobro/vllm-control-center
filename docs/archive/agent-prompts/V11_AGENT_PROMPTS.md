# v11 Agent Prompts

## Baseline instruction

Inspect this repository first. Do not rewrite it from scratch.

Continue from v11 of vLLM Control Center.

Product direction:
- This is an LM Studio-style control plane for vLLM.
- It is not another generic chat UI.
- The project is intended to be open source.
- Preserve FastAPI controller + React/Vite frontend architecture.
- Preserve safe subprocess execution. Never use shell=True.
- Preserve controller auth and remote controller security guardrails.
- Add tests for new backend behavior.
- Run `scripts/check.sh`.
- Summarize changed files and manual test steps.

## Recommended next milestone: v12 — Secret Storage Hardening

Backend requirements:
1. Move remote controller API keys out of `remote_controller_profiles.api_key` into the `secrets` table.
2. Keep a migration/backward-compat path for existing rows.
3. Return only `api_key_configured`, never secret values.
4. Add secret create/update/delete helper functions.
5. Add tests for migration, update, clear, and redaction.
6. Update SECURITY.md and docs/dev/DECISIONS.md.

Frontend requirements:
1. Keep the existing API key UX.
2. Add clearer copy that remote API keys are stored locally.
3. Do not display existing secret values.

Quality:
- Run backend tests.
- Run frontend build.
- Keep changes small and reviewable.
