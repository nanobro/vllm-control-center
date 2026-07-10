# v0.50 — Safe Env Handoff Quoting Pass

Goal: make the tested `.env` handoff safe to paste into real apps without widening Daily mode.

## Scope

- Keep Pick → Start → Test → Copy as the Daily mode path.
- Keep Copy/snippets gated by Quick test success for the exact selected local or remote run.
- Generate `.env` handoff lines from the tested base URL and tested model name.
- Quote unusual values only when needed so dotenv parsers do not break on spaces, quotes, or other special characters.
- Keep Qwen3.6 and large Qwen text-generation models runnable; size alone is not incompatibility.

## Shipped

- Local Run Model `.env` handoff uses dotenv-safe values.
- Remote `.env` handoff uses dotenv-safe values.
- The copy action is labeled `Copy safe .env`.
- The generated `.env` block includes a small comment explaining that the values came from vLLM Control Center after Quick test.

## Non-goals

- No generic chat UI.
- No new Daily mode dashboard cards.
- No desktop installer promises.
- No model-size blocking for Qwen text-generation models.
