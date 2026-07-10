# v0.37 Agent Prompt — Test-before-Copy Handoff Pass

Use the v0.36 package as base and produce v0.37.

Rules:
- Use public beta version `v0.37`.
- Bump package metadata to `0.37.0`.
- Next version after this is `v0.38`.
- Do not create v24.x, v25.0, or v26.x release names.
- Keep Daily mode simple: Pick model -> Start -> Test -> Copy OpenAI base URL.
- Keep Electron preview-only and beta web-first.
- Do not block Qwen3.6 or large Qwen text-generation models just because they are large.

Goal:
- Make local endpoint handoff follow the visible daily flow.
- The `/v1` endpoint can be shown while running, but copy actions should unlock only after Quick test passes for the selected local instance.
- Keep exact details in drawers/logs, not main rows.

Expected output:
`vllm-control-center-starter-v0.37.zip`
