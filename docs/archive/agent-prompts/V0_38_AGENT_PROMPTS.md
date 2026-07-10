# v0.38 Agent Prompt — Detail Drawer Handoff Guard Pass

Use the v0.37 package as base and produce v0.38.

Rules:
- Use public beta version `v0.38`.
- Bump package metadata to `0.38.0`.
- Next version after this is `v0.39`.
- Do not create v24.x, v25.0, or v26.x release names.
- Keep Daily mode simple: Pick model -> Start -> Test -> Copy OpenAI base URL.
- Keep Electron preview-only and beta web-first.
- Do not block Qwen3.6 or large Qwen text-generation models just because they are large.

Goal:
- Close the detail-drawer copy loophole from v0.37.
- The drawer may show the `/v1` endpoint, but Copy URL should follow the same selected-instance Quick test gate as the main Run Model buttons.
- Keep exact details in drawers/logs, not main rows.

Expected output:
`vllm-control-center-starter-v0.38.zip`
