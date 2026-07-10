# v0.53 Agent Prompt — Manual Copy Select-All Confidence Pass

Use the v0.52 package as base and produce v0.53.

Focus only on manual-copy confidence after clipboard fallback failure:

- Add an explicit Select all action to local and remote manual-copy fallback panels.
- Show a lightweight payload length hint so users know they are copying the full handoff text.
- Keep successful clipboard copy paths unchanged.
- Keep Copy/snippets gated by Quick test success for the exact selected run.
- Keep Daily mode simple: Pick → Start → Test → Copy OpenAI base URL.
- Do not block Qwen3.6 or large Qwen text-generation models just because they are large.
- Continue public beta versioning as v0.53, next v0.54.
- Do not return to v24.x, v25.0, or v26.x naming.

Return `vllm-control-center-starter-v0.53.zip`.
