# Agent Prompt — v0.49 Environment Handoff Copy Pass

Use the v0.48 package as base and produce v0.49.

Implement a focused handoff polish pass:
- Add tested `.env` copy for local and remote handoff surfaces.
- Include `OPENAI_BASE_URL`, `OPENAI_MODEL`, and an API-key placeholder.
- Keep `.env` copy locked until Quick test passes for the exact selected run.
- Preserve the simple Daily flow and do not add dashboard clutter.
- Keep Qwen3.6 and large Qwen text-generation models runnable; size alone is not incompatibility.

Return package:
`vllm-control-center-starter-v0.49.zip`
