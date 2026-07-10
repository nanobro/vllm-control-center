# v0.46 — Suggested Served Name Retry Pass

v0.46 focuses on the next step after served-model-name mismatch guidance. When vLLM is alive but the request uses a stale alias, the app can now test again with the actual name returned by `/v1/models` without forcing users to restart or edit advanced settings first.

## Goals

- Keep Daily mode simple: Pick, Start, Test, Copy.
- Do not block Qwen3.6 or large Qwen text-generation models just because they are large.
- Let users recover from served-name mismatch by testing the suggested name directly.
- Keep exact logs and advanced settings in details, not in the main path.

## Changes

- Added `model_override` to local playground requests.
- Added `model_override` to remote playground bridge requests.
- Local Quick test shows **Test with this name** beside the suggested `/v1/models` name.
- Remote Quick test shows the same action for selected remote models.
- Snippet generation uses the model name that actually passed Quick test, avoiding handoff with a stale alias.

## Verification

Run:

```bash
scripts/check.sh
scripts/version-scheme-check.sh
scripts/release-freeze-check.sh
scripts/bug-bash-check.sh
scripts/smoke.sh
scripts/launch-check.sh
```
