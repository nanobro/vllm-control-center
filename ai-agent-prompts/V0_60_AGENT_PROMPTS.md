# v0.60 Agent Prompt — Playground Stop and First-Token Timeout Pass

Use v0.59 as base and ship v0.60.

Goal: fix the real tester blocker where Playground can appear stuck on a loaded model while waiting for streaming tokens. Keep Daily mode simple and do not add dashboard surface.

Required implementation:

- Add a local Playground Stop test control for streaming tests.
- Add first-token timeout guidance when no streaming tokens arrive.
- Add inactivity timeout guidance when a stream starts but then stalls.
- Preserve v0.57 loaded/warming model source of truth.
- Preserve v0.58 served-name auto-retry.
- Preserve v0.59 wildcard host loopback handling.
- Keep sidebar version badge sourced from package metadata.
- Keep Qwen3.6 and large Qwen text-generation models runnable.

Update package metadata, docs, milestones, release checks, and next-agent prompts to v0.60 / next v0.61.

Return `vllm-control-center-starter-v0.60.zip`.
