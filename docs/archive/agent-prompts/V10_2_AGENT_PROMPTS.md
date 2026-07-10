# v10.2 Agent Prompts

## Next milestone prompt: v11 Controller Auth and Secret Handling

```text
Inspect this repository first. Do not rewrite it from scratch.

Continue from v10.2 of vLLM Control Center.

Read before editing:
- README.md
- docs/dev/PROJECT_STATUS.md
- docs/dev/DECISIONS.md
- docs/dev/TODO.md
- docs/dev/AGENT_HANDOFF.md
- SECURITY.md

Product direction:
- This is an LM Studio-style control plane for vLLM.
- It is not another generic chat UI.
- It is not an inference engine.
- Preserve FastAPI controller + React/Vite frontend architecture.
- Preserve safe subprocess execution. Never use shell=True.
- Preserve remote controller profile security guardrails.
- Add backend tests for new behavior.
- Run ./scripts/check.sh.
- Update CHANGELOG.md and docs/dev/PROJECT_STATUS.md if the milestone is completed.

Next milestone:
v11 — Controller Auth and Secret Handling.

Backend requirements:
1. Add controller API key settings.
2. Add authentication middleware/dependency for protected API routes.
3. Keep health endpoint public.
4. Support explicit dev mode for localhost-only workflows.
5. Add route or setting to generate/reset local controller API key.
6. Add secret redaction utilities for logs, exports, and remote profiles.
7. Add remote profile API key update/clear behavior.
8. Separate secret-like values from normal settings where practical for this starter.
9. Add tests for:
   - public health route
   - protected route without key
   - protected route with key
   - localhost/dev-mode behavior if implemented
   - redaction behavior
   - remote profile key update/clear

Frontend requirements:
1. Add Security/Settings section for local controller auth state.
2. Show clear guidance for local-only vs remote/public binding.
3. Mask API keys by default.
4. Add copy/regenerate/clear flows carefully.

Docs:
1. Update SECURITY.md.
2. Update README safety model if behavior changes.
3. Add docs/V11_CONTROLLER_AUTH_AND_SECRETS.md.
4. Update docs/dev/PROJECT_STATUS.md and CHANGELOG.md.

Quality:
- Do not break existing routes unless required for auth and documented.
- Keep auth configuration explicit, not magical.
- Never log secrets.
- Run backend tests, lint, and frontend build.
```

## Security review prompt after v11

```text
Review the v11 controller auth and secret handling implementation.

Focus on:
- auth bypasses
- accidental protection of health/docs routes
- missing protection on mutation routes
- secret leakage in logs/exports/errors
- remote profile key storage/update/clear behavior
- CORS assumptions
- whether dev mode can be accidentally exposed on 0.0.0.0

Return findings with severity and exact file references.
```
