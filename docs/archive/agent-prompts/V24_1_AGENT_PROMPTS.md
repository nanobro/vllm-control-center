# v24.1 Agent Prompt — Public Beta Bug Bash & Smoke Harness

You are continuing vLLM Control Center after v24.1.

Current package: v24.1 Public Beta Bug Bash & Smoke Harness.

Positioning remains:

- LM Studio-style UX for vLLM
- local model management
- remote GPU ops
- not a generic chat UI

Feature freeze remains active. Do not add new Daily mode cards unless replacing/removing an existing one.

What v24.1 added:

- `scripts/smoke.sh`
- `make smoke`
- `docs/BETA_BUG_BASH.md`
- `docs/V24_1_BUG_BASH_SMOKE_HARNESS.md`
- Release kit commands now mention the smoke harness

Next recommended work:

v24.2 — Screenshot and release asset capture.

Focus on GitHub/public release presentation:

- screenshot filenames and guidance
- README screenshot placeholders
- short beta release notes
- no new core UI unless required to remove confusion

Guardrails:

- Daily mode must remain: Run Model, Models, Remote, Settings.
- Advanced/support tools must stay behind Advanced mode or explicit navigation.
- Do not reintroduce milestone/version labels into live Daily mode.
- Keep `/v1` endpoint handoff obvious after quick test succeeds.
