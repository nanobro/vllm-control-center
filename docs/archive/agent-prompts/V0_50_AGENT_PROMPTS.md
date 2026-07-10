# Agent Prompt — v0.50 Safe Env Handoff Quoting Pass

Use the v0.49 package as base and produce v0.50.

Rules:
- Continue public beta versions as v0.50, then v0.51.
- Keep Daily mode simple: Pick → Start → Test → Copy OpenAI base URL.
- Do not block Qwen3.6 or large Qwen text-generation models by size alone.
- Keep endpoint copy/snippets gated by Quick test for the exact selected run.

Implementation target:
- Make local and remote `.env` handoff copy dotenv-safe.
- Quote unusual tested endpoint/model values only when needed.
- Keep raw paths/details out of main rows.
- Update README, ROADMAP, CHANGELOG, milestones, release checks, and bug-bash status.

Return:
`vllm-control-center-starter-v0.50.zip`
