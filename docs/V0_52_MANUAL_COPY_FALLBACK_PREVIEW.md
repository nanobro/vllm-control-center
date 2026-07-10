# v0.52 — Manual Copy Fallback Preview Pass

## Goal

Make failed clipboard handoff less frustrating in preview shells, insecure browser origins, and locked-down WebViews. v0.51 added fallback copy attempts; v0.52 adds a visible manual-copy panel when all clipboard methods are blocked.

## Product rules

- Keep Daily mode simple: Pick → Start → Test → Copy OpenAI base URL.
- Do not add dashboard clutter. The panel only appears after copy failure.
- Keep exact endpoint/model handoff gated by Quick test success for the exact selected run.
- Keep Qwen3.6 and large Qwen text-generation models runnable; never block by size alone.
- Keep Electron preview-only and web-first beta positioning.

## Changes

- Local Run Model copy actions now reveal the exact payload in a selectable manual-copy card when browser copy is blocked.
- Remote GPU handoff copy actions now reveal the exact payload in the same manual-copy card.
- Manual-copy cards include a one-click Hide control and auto-select-on-focus textarea.
- Successful copy clears the manual fallback so the happy path stays clean.
- Existing Copy base URL, model name, handoff bundle, safe `.env`, curl, JS, and Python snippets remain gated by Quick test success.

## Verification

Run:

```bash
./scripts/version-scheme-check.sh
./scripts/release-freeze-check.sh
./scripts/bug-bash-check.sh
./scripts/smoke.sh
./scripts/launch-check.sh
./scripts/check.sh
```

Expected sandbox notes are unchanged: local vLLM, NVIDIA GPU, or controller runtime may be missing in CI-like environments.
