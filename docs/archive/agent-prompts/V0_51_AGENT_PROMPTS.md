# Agent Prompt — v0.51 Clipboard Fallback Handoff Reliability Pass

Use the v0.50 package as base and produce v0.51.

Rules:
- Continue public beta versions as v0.51, then v0.52.
- Keep Daily mode simple: Pick → Start → Test → Copy OpenAI base URL.
- Do not add dashboard clutter.
- Do not block Qwen3.6 or large Qwen text-generation models by size alone.
- Keep Copy/snippets gated by Quick test success for the exact selected local or remote run.

Focus:
- Make copy actions reliable when `navigator.clipboard` is unavailable or blocked.
- Apply fallback copy behavior to local Run Model, Remote, Setup, and Release surfaces.
- Update docs, checks, milestones, and package metadata.

Return:
`vllm-control-center-starter-v0.51.zip`
