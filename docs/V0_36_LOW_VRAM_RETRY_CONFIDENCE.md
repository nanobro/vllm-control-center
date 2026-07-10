# v0.36 — Low VRAM Retry Confidence Pass

v0.36 is a focused beta fix for local model load recovery.

Previous passes made failures easier to understand, but users still needed to decide what to do after a model crashed. This version adds a single calm next action: retry the same local model with Low VRAM settings.

## Goals

- Keep Qwen3.6 and large Qwen text-generation models runnable.
- Do not block models just because they are large.
- Reuse stopped/crashed instances instead of creating duplicate rows.
- Apply safer settings only when the user chooses Low VRAM retry.
- Keep Daily mode simple: Pick -> Start -> Test -> Copy OpenAI base URL.
- Keep exact flags and logs in details, not noisy main rows.

## What changed

- Added `load_preset: low_vram` to the local model load API.
- Low VRAM retry lowers GPU memory utilization, caps max context, and adds a smaller max sequence setting.
- Local load responses include `applied_preset` so the UI can explain what happened.
- Local Models shows a compact Low VRAM retry action only for crashed rows.
- The model detail drawer shows Retry Low VRAM when a recent failed load makes that action useful.

## Non-goals

- No new dashboard cards.
- No generic chat UI.
- No size-only incompatibility filter.
- No desktop production promises.
