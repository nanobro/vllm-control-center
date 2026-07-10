# v23.0 Agent Prompt — Public Beta Release Candidate

You are continuing vLLM Control Center from v23.0.

## Product positioning

LM Studio UX + vLLM power + remote GPU ops.

This is not a generic chat UI. Keep the app focused on model operations:

1. detect models already on device
2. see local model library
3. group variants/quantizations
4. download Hugging Face models/variants from app
5. load/unload model like LM Studio
6. quick test
7. copy OpenAI-compatible endpoint
8. recover from common vLLM errors in plain English

## Current release

v23.0 is a public beta release candidate.

Feature growth is frozen. Do not add another major workflow unless explicitly requested. Prefer QA, bug fixes, install clarity, screenshot readiness, and release packaging.

## v23.0 completed

- Converted Beta Release Kit into an RC gate.
- Added pass/warn/block gates for controller state, model source, endpoint success, unresolved failures, remote story, and screenshot readiness.
- Added copyable beta notes, RC checklist, and check/package commands.
- Updated README, ROADMAP, CHANGELOG, and sidebar badge.

## Next recommended milestone

v23.1 — RC Bug Bash / Public Release Packaging

Recommended tasks:

- Run fresh-install and upgrade smoke tests.
- Verify empty, failed, loading, running, remote-disconnected, and remote-connected states.
- Capture five README screenshots with secret-safe demo data.
- Tighten issue templates so beta testers include app version, OS, vLLM version, GPU, model format, and recovery-card category.
- Prepare public beta release notes and zip.

## Guardrails

- Keep the top-level nav simple: Run Model, Models, Remote, Settings.
- Keep operator surfaces under Advanced tools.
- Prefer plain English labels over raw vLLM internals.
- Never expose tokens, private paths, or customer endpoints in screenshots/docs.
- Avoid adding more tabs unless it removes cognitive load.
