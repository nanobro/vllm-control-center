# v0.48 — Endpoint Handoff Bundle Copy Pass

## Goal

Make the final SDK handoff less error-prone without adding a new Daily mode step. After Quick test passes, users can copy one small bundle containing both the OpenAI-compatible `/v1` base URL and the exact tested model name.

## Product rules

- Keep Daily mode simple: Pick → Start → Test → Copy.
- Do not add dashboard clutter.
- Keep exact paths/log details in details/log surfaces.
- Keep Qwen3.6 and large Qwen text-generation models runnable; size alone is not incompatibility.

## Implementation

- Local Run Model adds `Copy handoff` beside the tested model name and SDK snippets.
- Remote GPU handoff adds the same `Copy handoff` action.
- The handoff bundle stays gated by Quick test success for the exact selected run.
- The bundle uses the tested served model name when auto served-name retry changed the configured alias.

## Verification

Run the usual release checks, frontend build, backend tests/lint, screenshot check, smoke check, launch check, and desktop shell check.
