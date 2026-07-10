# v0.46 Agent Prompt — Suggested Served Name Retry Pass

Use the v0.44 package as base and produce v0.46.

Rules:
- Use public beta version `v0.46`.
- Bump package metadata to `0.46.0`.
- Next version after this is `v0.47`.
- Keep Daily mode simple: Pick → Start → Test → Copy OpenAI base URL.
- Keep Qwen3.6 and large Qwen text-generation models runnable. Do not block by size alone.

Goal:
When Quick test discovers a served-model-name mismatch, let the user test again using the suggested `/v1/models` name without restarting or digging into advanced settings. Snippets should use the model name that passed Quick test.

Return final zip as:
`vllm-control-center-starter-v0.46.zip`
