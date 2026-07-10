# v0.33 Agent Prompt — Real vLLM Happy-Path Validation Pass

Use `vllm-control-center-starter-v0.32.zip` as the base and ship `vllm-control-center-starter-v0.33.zip`.

Rules:

- Keep public versioning on `v0.x`; this release is `v0.33` and the next release is `v0.34`.
- Keep Daily mode simple: Pick -> Start -> Test -> Copy OpenAI base URL.
- Keep Electron preview-only and web-first beta.
- Keep Qwen3.6 and large Qwen text-generation models runnable. Size alone is not incompatibility.

Goal:

- Do not mark a vLLM process as fully running immediately after spawn.
- Keep the instance in starting / warming-up state until `/v1/models` or `/health` responds.
- If the process exits before readiness, preserve v0.32 crash diagnosis.
- Keep logs and exact details in drawers/details, not noisy main rows.

Update code, docs, README, ROADMAP, CHANGELOG, milestones, release checks, and next-agent handoff. Run the full verification suite and package as `vllm-control-center-starter-v0.33.zip`.
