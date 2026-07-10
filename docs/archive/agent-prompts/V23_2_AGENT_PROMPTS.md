# v23.2 Agent Prompt — Models Library Simplification

You are continuing vLLM Control Center from v23.1.

## Context

The user showed an older screenshot where the UI felt too busy and repeated the same guidance in multiple places. v23.1 simplified Run Model. v23.2 should simplify Models.

## Product direction

Positioning remains:

- LM Studio UX
- vLLM power
- remote GPU ops
- not a generic chat UI

Core flow:

1. detect models already on device
2. see local model library
3. group variants/quantizations
4. download Hugging Face models/variants from app
5. load/unload model like LM Studio
6. quick test
7. copy OpenAI-compatible endpoint

## v23.2 intent

Make Models feel like a clean model library, not a setup dashboard.

Keep visible:

- model search
- simple status filters
- concise status/compatibility chips
- selected model detail drawer
- Load/Unload/Retry/Cancel actions

Hide by default:

- Hugging Face download form
- scan path form
- host/port load target fields
- excessive metadata chips
- repeated Run Model guidance

## Acceptance criteria

- Models page no longer repeats the Run Model flow.
- Download/scan controls are in a disclosure named Add or scan models.
- Row metadata is reduced to first-glance chips only.
- Detail drawer remains the place for full metadata and actions.
- Existing backend APIs and tests remain compatible.
