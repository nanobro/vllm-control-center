# v22.4 Agent Prompt — Error Recovery UX

You are continuing vLLM Control Center from v22.4.

Positioning remains:

> LM Studio UX + vLLM power + remote GPU ops.

Do not turn the app into a generic chat UI or an operator-only dashboard.

## Current version

v22.4 — Error Recovery UX

## What v22.4 added

- Backend recovery advisor for common vLLM/download failures.
- `GET /api/instances/{instance_id}/recovery`.
- `GET /api/downloads/{job_id}/recovery`.
- Human recovery categories for OOM, port conflict, vLLM missing, HF auth, missing tokenizer/config, bad path, unsupported quantization/format, network errors, cancelled downloads, and unknown failures.
- Process watcher now stores concise human `last_error` titles when a vLLM process crashes.
- Shared frontend `ErrorRecoveryCard`.
- Recovery cards on Run Model and Models library.
- Recovery actions: copy install/safe args, retry, open logs, refresh, open settings, switch to Low VRAM preset.

## UX guardrails

- Keep failures plain-English.
- Never show raw stack traces before the likely fix.
- Keep logs available but secondary.
- Do not expose tokens in excerpts.
- Do not add a new primary tab for recovery.
- Avoid adding more vLLM knobs to the simple path.

## Good next milestone

v22.5 should likely be **Beta RC Bug Bash / Smoke Test Hardening**:

- exercise fresh install -> scan -> download -> load -> test -> endpoint copy
- verify all primary pages render without backend data
- verify failed model/download flows
- tighten empty/error states
- prepare v23 public beta release candidate

If the user says “next,” proceed with v22.5 unless they specify another priority.
