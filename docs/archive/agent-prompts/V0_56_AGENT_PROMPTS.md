# v0.56 Agent Prompt — Visible Version Badge Sync Pass

Use the v0.55 package as base and produce v0.56.

Objective:

Fix stale visible version labels. The app must not show old strings like old `v22.x beta` labels; it should show the current public beta version and keep that label easy to update on every release.

Rules:

- Continue public beta versioning as v0.56, next v0.57.
- Keep Daily mode simple: Pick model -> Start -> Test -> Copy OpenAI base URL.
- Do not add dashboard clutter.
- Keep Electron preview-only and beta web-first.
- Do not block Qwen3.6 or large Qwen text-generation models because of size alone.
- Prefer wiring the visible badge to package metadata over hardcoding a stale release string.
- Update README, ROADMAP, CHANGELOG, release docs, milestones, release checks, smoke checks, and next-agent handoff.
- Run verification and clean the package before zipping.

Return `vllm-control-center-starter-v0.56.zip`.
