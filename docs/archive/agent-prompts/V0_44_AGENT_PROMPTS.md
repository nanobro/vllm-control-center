# v0.44 Agent Prompt — Served Model Name Mismatch Guidance Pass

Use the v0.43 package as base and produce v0.44.

Rules:
- Use public beta version `v0.44`.
- Bump package metadata to `0.44.0`.
- Next version after this is `v0.47`.
- Keep Daily mode simple: Pick → Start → Test → Copy.
- Do not block Qwen3.6 or large Qwen text-generation models only because they are large.

Goal:
- If Quick test fails because the request model name does not match the vLLM served model name, fetch `/v1/models` when possible and show the actual served model name as a short copyable hint.
- Keep raw details in logs/details, not noisy main rows.

Expected package name:
`vllm-control-center-starter-v0.44.zip`
