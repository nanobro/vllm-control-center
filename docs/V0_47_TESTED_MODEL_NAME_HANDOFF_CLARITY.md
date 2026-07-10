# v0.47 — Tested Model Name Handoff Clarity Pass

This pass keeps the v0.46 auto served-name retry behavior and makes the result easier to use. When Quick test passes, users can see and copy the exact model name that succeeded, including the actual `/v1/models` served name after an alias mismatch.

## Why

The endpoint handoff needs two pieces:

1. OpenAI-compatible base URL, such as `http://localhost:8000/v1`.
2. Model name to use in SDK calls.

v0.46 fixed the mismatch automatically, but users could still miss which model string should go into their app. v0.47 makes that tested model name visible without adding another Daily mode step.

## Product rules preserved

- Daily mode remains Pick → Start → Test → Copy.
- Copy/snippets still unlock only after Quick test passes for the exact selected run.
- Qwen3.6 and large Qwen text-generation models remain runnable; size alone is not incompatibility.
- Details/logs remain behind drawers and advanced sections.
- Electron remains preview-only; beta remains web-first.

## Verification target

Run the normal release checks:

```bash
./scripts/version-scheme-check.sh
./scripts/release-freeze-check.sh
./scripts/bug-bash-check.sh
./scripts/smoke.sh
./scripts/check-screenshots.sh
./scripts/check.sh
```
