# v0.49 — Environment Handoff Copy Pass

## Goal

Make the final SDK handoff easier for real apps without adding another Daily mode step. After Quick test passes, users can copy a small `.env` block containing the tested OpenAI-compatible base URL and the exact model name that passed.

## Product rules

- Keep Daily mode simple: Pick → Start → Test → Copy.
- Do not add dashboard clutter.
- Keep endpoint and model copy gated by Quick test success for the exact selected run.
- Keep Qwen3.6 and large Qwen text-generation models runnable; size alone is not incompatibility.

## Implementation

- Local Run Model adds `Copy .env` beside `Copy handoff`, using the tested `/v1` base URL and tested model name.
- Remote GPU handoff adds the same `Copy .env` action.
- `.env` copy stays locked until Quick test passes for the exact selected run.
- Local `.env` uses `OPENAI_API_KEY=not-needed-for-local`; remote `.env` uses `OPENAI_API_KEY=replace-with-your-key-if-enabled`.

## Verification

Run the usual release checks, frontend build, backend tests/lint, screenshot check, smoke check, launch check, and desktop shell check.
