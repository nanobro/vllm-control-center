# v0.36 Agent Prompt — Low VRAM Retry Confidence Pass

Use the v0.35 package as base and produce v0.36.

Rules:

- Use public beta version `v0.36`.
- Bump package metadata to `0.36.0`.
- Next version after this is `v0.37`.
- Keep Daily mode simple: Pick -> Start -> Test -> Copy OpenAI base URL.
- Keep Electron preview-only and beta web-first.
- Do not return to v24.x, v25.0, or v26.x naming.
- Keep Qwen3.6 and large Qwen text-generation models runnable.
- Do not block models just because they are large.

Target:

Add a practical recovery path after local load crashes. Users should see a clear Low VRAM retry action instead of guessing vLLM flags or assuming a large text model cannot run.

Implementation notes:

- Add a local load preset for Low VRAM retry.
- Reuse stopped/crashed instances when retrying.
- Apply safer settings only when requested.
- Keep exact flags/logs in details.
- Keep the main rows calm and not operator-heavy.

Return package:

`vllm-control-center-starter-v0.36.zip`
