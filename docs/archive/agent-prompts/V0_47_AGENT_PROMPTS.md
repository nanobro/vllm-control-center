# v0.47 Agent Prompt — Tested Model Name Handoff Clarity Pass

Use the v0.46 package as base and produce v0.47.

Rules:
- Use public beta version `v0.47`.
- Bump package metadata to `0.47.0`.
- Next version after this is `v0.48`.
- Keep Daily mode simple: Pick → Start → Test → Copy OpenAI base URL.
- Keep Qwen3.6 and large Qwen text-generation models runnable; size alone is not incompatibility.
- Do not add dashboard clutter or operator-heavy wording.
- Keep Electron preview-only and beta web-first.

Goal:
- After Quick test passes, show and allow copying the exact model name that passed, including auto-retried `/v1/models` served names.
- Apply this to both local Run Model and Remote GPU handoff.
- Keep endpoint Copy/snippets gated by Quick test for the exact selected run.

Return:
`vllm-control-center-starter-v0.47.zip`
