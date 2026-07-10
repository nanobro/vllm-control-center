# v0.48 Agent Prompt — Endpoint Handoff Bundle Copy Pass

Use the v0.47 package as base and produce v0.48.

Rules:
- Use public beta version `v0.48`.
- Bump package metadata to `0.48.0`.
- Next version after this is `v0.49`.
- Keep Daily mode simple: Pick → Start → Test → Copy OpenAI base URL.
- Do not block Qwen3.6 or large Qwen text-generation models because of size alone.
- Keep Electron preview-only and beta web-first.

Goal:
- Add a tested handoff bundle after Quick test passes.
- The bundle should copy both the `/v1` base URL and the exact tested model name.
- Gate the bundle with the same exact-run Quick test rule as base URL and snippets.

Return package:
`vllm-control-center-starter-v0.48.zip`
