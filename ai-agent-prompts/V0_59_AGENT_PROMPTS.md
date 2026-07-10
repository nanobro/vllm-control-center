# v0.59 Agent Prompt — Playground Wildcard Host Connection Pass

Use v0.58 as base and ship v0.59.

Goal: fix the real local Playground reliability blocker where a model is loaded, but vLLM is bound to `0.0.0.0` or `::`, so Playground may try to test through a wildcard bind address instead of a dependable loopback address.

Requirements:

- Keep Daily mode simple.
- Do not add dashboard clutter.
- Keep Playground tied to loaded/warming local models from v0.57.
- Keep served-name auto-retry from v0.58.
- Normalize wildcard bind hosts to `127.0.0.1` for controller-to-vLLM Playground requests.
- Display wildcard local endpoints as `localhost` in Playground, matching other handoff surfaces.
- Keep Qwen3.6 and large Qwen text-generation models runnable.
- Do not block models by size alone.
- Update package metadata, docs, milestones, release checks, and next-agent prompts to v0.59 / next v0.60.

Return `vllm-control-center-starter-v0.59.zip`.
