# v0.43 Agent Prompt — Streaming Test Failure Guidance Pass

Use the v0.42 package as base and produce v0.43.

Rules:
- Use public beta version `v0.43`.
- Bump package metadata to `0.43.0`.
- Next version after this is `v0.44`.
- Keep Daily mode simple: Pick → Start → Test → Copy OpenAI base URL.
- Keep Electron preview-only and web-first.
- Do not block Qwen3.6 or large Qwen text-generation models just because they are large.

Goal:
- Make streaming playground failures as understandable as non-streaming Quick test failures.

Required output zip:
`vllm-control-center-starter-v0.43.zip`
