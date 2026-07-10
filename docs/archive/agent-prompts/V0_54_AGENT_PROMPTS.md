# v0.54 Agent Prompt — Copy Success Confirmation & Last Copied State Pass

Use the v0.53 package as base and produce v0.54.

Goal:

- Improve handoff confidence without adding dashboard clutter.
- After a successful copy, show a lightweight confirmation of exactly what kind of payload was copied.
- Include a short preview and character count.
- Clear confirmation when selected run/model/profile changes so stale copy state is not trusted.

Rules:

- Continue public beta versioning as v0.54, next v0.55.
- Keep Daily mode simple: Pick model → Start → Test → Copy OpenAI base URL.
- Keep exact paths/log details in drawer/details/manual-copy fallback.
- Keep copy/snippets gated by Quick test success for the exact selected run.
- Do not block Qwen3.6 or large Qwen text-generation models because of size alone.
- Keep Electron preview-only and beta web-first.

Return `vllm-control-center-starter-v0.54.zip`.
