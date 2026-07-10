# v17 Agent Prompts

## Next milestone: Server Page Polish / Model Hub Integration

Inspect the repo first. Do not rewrite from scratch.

Continue from v17. The product priority has shifted after LM Studio screenshot review: the primary UX must be model selection and start/stop, not hidden admin pages.

Goal: build a unified Server page that feels like LM Studio's local inference server view, adapted for vLLM.

Requirements:

1. Preserve FastAPI + React/Vite architecture.
2. Preserve safe subprocess execution; never use `shell=True`.
3. Keep Model Hub as the catalog/download entry point.
4. Add or improve a Server page with:
   - selected model picker from Model Hub + registered models
   - current server status
   - start/stop/restart buttons
   - port/host settings
   - supported OpenAI-compatible endpoints list
   - model inspector panel
   - live logs panel
   - command preview panel
5. Do not remove lower-level Models, Downloads, or Instances pages; they remain advanced views.
6. Add tests for any new backend routes.
7. Run `./scripts/check.sh`.
8. Update `docs/dev/PROJECT_STATUS.md`, `docs/dev/TODO.md`, and `CHANGELOG.md`.

Acceptance:

- A new user can open the app, choose a model, create/start a vLLM server, see endpoint info, and stop it from one coherent page.
- Advanced pages still work.
