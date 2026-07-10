# v10.1 Agent Prompt

Use this repository version as the baseline for future work.

Rules:

- Do not rewrite the project from scratch.
- Preserve FastAPI controller + React/Vite frontend architecture.
- Preserve safe subprocess execution; never use `shell=True`.
- Preserve remote forwarding guardrails.
- Treat remote profile API keys as sensitive.
- Keep the local controller localhost-first unless implementing a deliberate auth milestone.
- Run `./scripts/check.sh` before handing work back.

Recommended next milestone: Controller Auth and Secret Handling.
