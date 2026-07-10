# v0.42 Agent Prompt — Quick Test Failure Guidance Pass

Use the v0.41 package as base and produce v0.42.

Rules:

- Use public beta version `v0.42`.
- Bump package metadata to `0.42.0`.
- Next version after this is `v0.43`.
- Keep Daily mode simple: Pick -> Start -> Test -> Copy OpenAI base URL.
- Keep Electron preview-only and beta web-first.
- Do not block Qwen3.6 or large Qwen text-generation models only because they are large.

Implementation target:

- Make failed Quick test results understandable.
- Return plain-English diagnosis fields from the local playground chat endpoint.
- Show concise next actions in local and remote Quick test panels.
- Keep raw logs/details out of the main rows but available via logs/details.
- Preserve the restart-safe test-before-copy gate from v0.41.

Expected package:

`vllm-control-center-starter-v0.42.zip`
