# v0.39 Agent Prompt — Remote Test-before-Copy Handoff Pass

Use the v0.38 package as base and produce v0.39.

Version rules:
- Use public beta version `v0.39`.
- Bump package metadata to `0.39.0`.
- Next version after this is `v0.42`.
- Do not return to v24.x, v25.0, or v26.x naming.

Product rules:
- Keep Daily mode simple: Pick model -> Start -> Test -> Copy OpenAI base URL.
- Keep beta web-first and Electron preview-only.
- Do not block Qwen3.6 or large Qwen text-generation models because of size alone.

Implementation target:
- Remote Copy base URL should unlock only after Quick test passes for the selected running remote model.
- Keep the selected remote model as the source of truth.
- Reset test/copy state when remote profile, selected model, or status changes.
- Keep logs/details available without adding main dashboard clutter.

Return package:
`vllm-control-center-starter-v0.39.zip`
