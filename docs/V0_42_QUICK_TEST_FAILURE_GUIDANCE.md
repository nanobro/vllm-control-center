# v0.42 — Quick Test Failure Guidance Pass

v0.42 is a focused beta polish pass for the Daily handoff path after the restart-safe test gate work.

## Goal

Keep the default flow simple:

```text
Pick model -> Start -> Test -> Copy OpenAI base URL
```

When Quick test fails, the app should not make the user parse raw vLLM/httpx output in the main path. The controller classifies the failure and the UI shows a plain-English reason plus useful next actions.

## What changed

- Added Quick test diagnosis fields to `/api/playground/chat` responses:
  - `error_type`
  - `user_message`
  - `next_actions`
- Classified common test failures:
  - endpoint not reachable
  - timeout / still warming
  - auth mismatch
  - wrong route / non-vLLM OpenAI server
  - served model name mismatch
  - request too large
  - GPU memory pressure
  - endpoint not ready
  - generic server error
- Local Run Model Quick test panels show the readable reason and up to three next actions.
- Remote Quick test panels consume the same response fields when the remote controller is new enough to provide them.
- Copy/snippet gates remain unchanged: Copy unlocks only after Quick test passes for the exact selected run.

## Non-goals

- Do not block Qwen3.6 or large Qwen text-generation models by size alone.
- Do not add dashboard clutter.
- Do not turn Daily mode into an operator console.
- Keep exact raw errors and logs available in details/log surfaces.
- Keep Electron preview-only and beta web-first.

## Verification expectations

Run:

```bash
scripts/check.sh
python -m pytest
python -m ruff check .
npm --prefix frontend run build
scripts/version-scheme-check.sh
scripts/release-freeze-check.sh
scripts/bug-bash-check.sh
scripts/smoke.sh
scripts/launch-check.sh
make desktop-check
```

If a sandbox lacks vLLM, NVIDIA tools, or Electron download network access, document those as environment warnings rather than product regressions.
