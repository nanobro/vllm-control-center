# v20.9 Agent Prompts

## Next agent baseline

Use v20.9 only. Do not merge with earlier zips.

Before editing:

1. Read `docs/dev/AGENT_HANDOFF.md`.
2. Read `docs/V20_9_ON_DEVICE_MODEL_SCANNER.md`.
3. Run backend tests and frontend build if possible.

## Product direction

The Server page should feel closer to LM Studio:

```text
This device → choose local model → Load Model → test → copy endpoint
```

Avoid exposing instance/admin concepts unless needed.

## Next useful milestone

v21 — On-device Scanner QA on DGX

Focus:

- verify `VCC_MODEL_DIRS` on DGX/Linux
- ensure downloaded Hugging Face models appear without manual refresh confusion
- ensure GGUF/HF snapshot detection is not too noisy
- add user-friendly empty state when no local models are found
- add UI affordance to show configured scan paths
- do not delete or mutate model files
