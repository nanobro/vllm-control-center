# v24.2 Agent Prompt — Install & Launch Path Hardening

You are working on vLLM Control Center after v24.2.

Current state:
- Public beta UI is frozen.
- Daily mode should stay limited to Run Model, Models, Remote, and Settings.
- Advanced/support tools should remain behind Advanced mode.
- v24.2 added install/launch helpers:
  - `scripts/bootstrap.sh`
  - `scripts/launch-check.sh`
  - `make bootstrap`
  - `make launch-check`

Guardrails:
- Do not add new daily-mode cards unless replacing an existing surface.
- Prefer launch/readme/test hardening over visible UI expansion.
- Keep install commands copyable and beginner-safe.
- If you touch scripts, keep them POSIX-ish Bash and readable.
- Verify with `./scripts/smoke.sh`, `./scripts/check.sh`, frontend build, backend tests, backend lint, and desktop shell check.

Likely next work:
- v24.3 screenshot/release asset capture, or
- installer/desktop packaging decision if release assets are already done.
