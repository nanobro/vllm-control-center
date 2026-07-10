# v0.34 Agent Prompt — Start Honesty & Local Crash Memory Pass

Use the v0.33 package as base and produce v0.34.

Version rules:

- Use public beta version `v0.34`.
- Bump package metadata to `0.34.0`.
- Next version after this is `v0.35`.
- Do not return to v24.x, v25.0, or v26.x.

Product guardrails:

- Keep Daily mode simple.
- Do not add more dashboard clutter.
- Keep Electron preview-only.
- Keep beta web-first.
- Keep Qwen3.6 and large Qwen text-generation models runnable.
- Size alone is not incompatibility.

Implementation target:

- Distinguish `start requested / warming up` from `endpoint ready` in API responses and UI messages.
- Keep `running` tied to `/v1/models` or `/health` readiness.
- Preserve recent local model crash reasons near CRASHED/retryable rows without dumping raw logs in main rows.
- Return actual current instance config after backend port auto-selection.
- Keep paths and raw logs in details/logs.

Verification:

- `scripts/check.sh`
- frontend build
- backend tests
- backend lint
- version scheme check
- release freeze check
- bug-bash check
- screenshot check
- smoke check
- launch check
- desktop shell check
