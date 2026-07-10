# v24.0 Public Beta Freeze

## Goal

Freeze the beta surface so vLLM Control Center feels like one coherent LM Studio-style vLLM app, not a long chain of milestone experiments.

The default flow is:

```text
choose model -> load -> quick test -> copy /v1 endpoint
```

## What changed

- Live sidebar badge now says **Public beta**.
- Release kit copy is framed as a compact beta checklist.
- README was rewritten around the final product shape.
- Roadmap now points to real-user bug bash, screenshots, and release packaging rather than new UI features.
- Package command references `vllm-control-center-starter-v24.0.zip`.

## Audit result

Daily mode should show only:

- Run Model
- Models
- Remote
- Settings

Help and operator surfaces stay behind Advanced mode.

## Guardrails for future agents

Do not add new Daily mode cards unless one of these is true:

1. The new card replaces an existing card.
2. The card is shown only for a concrete failure state.
3. The card directly shortens the load/test/copy endpoint path.

Avoid live UI labels that reference old milestone versions such as v21, v22, or v23. Version history belongs in docs and changelog, not the daily product path.
