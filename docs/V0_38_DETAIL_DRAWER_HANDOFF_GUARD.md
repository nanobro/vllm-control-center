# v0.38 — Detail Drawer Handoff Guard Pass

v0.38 is a focused beta fix for endpoint handoff consistency.

## Problem

v0.37 correctly locked the main Run Model copy buttons until Quick test passed, but the model detail drawer could still expose a direct Copy URL action for the selected instance. That made the simple Daily path inconsistent: the main card said Test first, while the drawer could still copy. Tiny loophole, very beta-annoying.

## What changed

- The model detail drawer now accepts endpoint copy readiness from the Run Model page.
- Drawer Copy URL is disabled until the selected running model passes Quick test.
- The drawer still shows the `/v1` endpoint for visibility.
- The drawer explains whether the user should start the model or run Quick test first.
- The main path remains unchanged: Pick model -> Start -> Test -> Copy OpenAI base URL.

## Guardrails

- Do not add dashboard clutter.
- Do not hide exact endpoint/path details from advanced users.
- Do not block Qwen3.6 or large Qwen text-generation models because of size alone.
- Keep Electron preview-only and beta web-first.
