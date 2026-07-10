# v0.46 — Auto Served Name Retry Pass

v0.46 reduces one more confusing tester loop in the Pick → Start → Test → Copy path.

When Quick test discovers that vLLM is running but the selected alias does not match the actual served model name from `/v1/models`, the UI now automatically retries once with that served name. If the retry passes, Copy and SDK snippets unlock using the tested served name.

## What changed

- Local Quick test auto-retries once with `suggested_model_name` when the first request fails because of a served-model-name mismatch.
- Remote Quick test uses the same one-time auto retry behavior through the remote bridge.
- Copy and snippets still unlock only after the exact selected run passes Quick test.
- The tested served model name is shown in the last-test note so users know why snippets use a different name.
- Manual **Test with this name** remains available when auto retry also fails.

## Product guardrails

- Daily mode stays simple: Pick → Start → Test → Copy OpenAI base URL.
- The app still does not block Qwen3.6 or large Qwen text-generation models only because they are large.
- Exact paths and low-level logs stay in details/logs, not in the main rows.
- Electron remains preview-only; beta stays web-first.
