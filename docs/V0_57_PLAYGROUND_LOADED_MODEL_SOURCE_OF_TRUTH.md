# v0.57 — Playground Loaded Model Source-of-Truth Pass

## Why

A tester loaded a model, opened Playground, and still saw an empty running-instance selector while the response panel waited for tokens. That breaks confidence because the app looks like the model is missing even when Run Model has already started it.

## What changed

- Playground now treats running and warming local instances as selectable.
- A model opened from Run Model/Models/Downloads stays selected even while it is warming up.
- The selector label says whether the model is Loaded or Warming and includes the served/local model name plus port.
- A compact selected-model summary shows model, status, and `/v1` endpoint.
- Streaming tests now time out with readable next actions instead of waiting forever.
- The visible beta badge remains sourced from package metadata, so version bumps continue to update the sidebar label.

## UX boundary

This does not add a new Daily mode panel and does not turn the product into a generic chat UI. The Daily path remains Run Model -> Start -> Quick test -> Copy OpenAI base URL. Playground remains an advanced confirmation/debug surface.

## Guardrails

- Qwen3.6 and large Qwen text-generation models remain runnable.
- Size alone is not incompatibility.
- Exact paths/log details stay in details/logs, not in main rows.
- Future releases must keep the visible version badge tied to package metadata.

The public beta line continues as v0.57, then v0.58.
