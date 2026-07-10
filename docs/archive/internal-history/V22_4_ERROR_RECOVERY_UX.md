# v22.4 — Error Recovery UX

## Goal

Make failures feel fixable. vLLM Control Center should not only say that a model failed; it should explain the likely cause in plain English and suggest the next safe action.

This keeps the product aligned with the LM Studio-style goal:

```text
choose model -> load -> if it fails, fix the obvious thing -> retry
```

## What changed

### Backend recovery advisor

Added a shared recovery classifier for common runtime and download failures:

- CUDA / GPU out of memory
- port already in use
- vLLM CLI missing
- Hugging Face gated/private/auth failures
- missing tokenizer files
- missing `config.json`
- bad or unavailable model path
- unsupported quantization / format hints
- network/download interruptions
- cancelled downloads
- unknown failures with a safe fallback checklist

The classifier intentionally returns user-facing guidance instead of raw stack traces first.

### New API endpoints

```text
GET /api/instances/{instance_id}/recovery
GET /api/downloads/{job_id}/recovery
```

Both return:

- category
- severity
- title
- summary
- likely cause
- immediate fixes
- suggested actions
- redacted matched log excerpt

### Better crashed-instance state

When a vLLM process exits with a non-zero code, the process watcher now looks at recent stderr/system logs and stores a concise human title in `last_error` when possible.

Example:

```text
GPU memory is not enough for this load
```

instead of only:

```text
exit code 1
```

### Frontend recovery cards

Added a shared `ErrorRecoveryCard` component and surfaced it in:

- **Run Model** when the selected instance has crashed or has a captured error
- **Models** when a selected download failed or a selected instance crashed

The card shows:

- likely cause
- top fixes
- action buttons such as Copy safe args, Retry, Open logs, Recheck, or switch to Low VRAM preset
- collapsed redacted log excerpt for advanced debugging

## UX principles

- Do not show stack traces first.
- Keep actions concrete.
- Prefer “try this next” over generic diagnosis.
- Keep logs one click away.
- Never expose tokens or Authorization headers in recovery excerpts.

## Manual QA checklist

1. Create a crashed instance with CUDA OOM text in logs.
   - Expected: recovery card says GPU memory is not enough.
   - Expected: Low VRAM / safe args action is shown.
2. Create a crashed instance with `address already in use`.
   - Expected: recovery card suggests changing port and copying `lsof -i :8000`.
3. Create a failed download with `401` or gated repo text.
   - Expected: recovery card explains HF token / gated access.
4. Select a healthy running model.
   - Expected: no recovery card appears.
5. Check raw excerpt.
   - Expected: token-like strings are redacted.

## Non-goals

- Full vLLM error ontology.
- Automatic mutation of user settings without confirmation.
- Hiding logs from advanced users.
- Perfect root-cause detection for every model-specific exception.
