# v0.57 Agent Prompt — Playground Loaded Model Source-of-Truth Pass

Use the v0.56 package as base and produce v0.57.

Objective:

Fix the real tester report where a model was loaded, but local Playground still showed `No loaded models` / `No running instances` and could wait forever for streaming tokens.

Rules:

- Continue public beta versioning as v0.57, next v0.58.
- Keep Daily mode simple: Pick model -> Start -> Test -> Copy OpenAI base URL.
- Do not add a generic chat product surface. Playground remains an Advanced/help tool.
- Keep Qwen3.6 and large Qwen text-generation models runnable; size alone is not incompatibility.
- Keep the sidebar beta badge sourced from package metadata so stale labels like old `v22.x beta` do not return.
- Playground should list running and warming local instances, preserve handoff-selected instances, show selected model/status/endpoint, and give next actions when streaming gets stuck.

Return `vllm-control-center-starter-v0.57.zip`.
