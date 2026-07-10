# v22.0 Agent Prompt — Public Beta Polish

You are working on vLLM Control Center v22.0 only.

## Positioning

LM Studio UX + vLLM power + remote GPU ops.
Not a generic chat UI.

## v22.0 objective

Polish the app for public beta without adding a new complex feature surface.

Focus on:

- first-run clarity
- actionable empty states
- release-identifiable UI
- simple copy
- install and docs polish

## Keep the app simple

Do not add another primary tab unless absolutely necessary.
Do not expose more raw vLLM knobs in the default path.
Do not force users through a setup wizard before they can inspect models.
Prefer small cards, labels, and helpful actions over dense documentation in the UI.

## Expected UX

A new user should understand this flow quickly:

1. Open Run Model.
2. Use local model or download from Hugging Face.
3. Load the model with a human preset.
4. Quick test.
5. Copy the OpenAI-compatible `/v1` endpoint.

## QA

Run:

- frontend build
- controller tests
- controller lint
- desktop shell check when available

Manually inspect:

- empty local model library
- empty download queue
- no running instance
- one running instance
- vLLM missing in Setup Doctor
- advanced tools still tucked away
