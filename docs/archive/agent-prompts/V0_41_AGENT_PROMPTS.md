# v0.41 Agent Prompt — Restart-safe Test Handoff Pass

Use the v0.40 package as base and produce v0.41.

Rules:
- Use public beta version `v0.41`.
- Bump package metadata to `0.41.0`.
- Next version after this is `v0.42`.
- Keep Daily mode simple: Pick -> Start -> Test -> Copy OpenAI base URL.
- Do not add dashboard clutter.
- Keep Electron preview-only and beta web-first.
- Do not block Qwen3.6 or large Qwen text-generation models just because they are large.

Goal:
Make Quick test handoff restart-safe. A passed Quick test should belong only to the exact selected local or remote server run. If the instance restarts, status changes, pid/start time changes, port changes, selected model changes, or remote profile changes, Copy should lock again until the current run is tested.

Return package:
`vllm-control-center-starter-v0.41.zip`
