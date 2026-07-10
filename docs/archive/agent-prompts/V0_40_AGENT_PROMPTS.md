# v0.40 Agent Prompt — Tested Endpoint State Label Pass

Use the v0.39 package as base and produce v0.40.

Rules:
- Use public beta version `v0.40`.
- Bump package metadata to `0.40.0`.
- Next version after this is `v0.41`.
- Keep Daily mode simple: Pick -> Start -> Test -> Copy OpenAI base URL.
- Do not add dashboard clutter.
- Keep Electron preview-only and beta web-first.
- Do not block Qwen3.6 or large Qwen text-generation models just because they are large.

Goal:
Make endpoint state labels honest. Running but untested endpoints should not look fully ready. Tested endpoints should clearly show that Quick test passed and Copy is safe.

Return package:
`vllm-control-center-starter-v0.40.zip`
