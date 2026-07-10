# v21.7 Agent Prompt — Human vLLM Presets

You are continuing vLLM Control Center from v21.6 only.

## Product positioning

vLLM Control Center is an open-source LM Studio-style UI for vLLM.

Positioning:

- LM Studio UX
- vLLM power
- remote GPU ops
- not a generic chat UI

## Latest version

v21.7 — Human vLLM Presets

## What changed in v21.7

The Run Model page now hides raw vLLM knobs behind simple intent presets:

- Fast test
- Balanced
- Long context
- High throughput
- Low VRAM
- Custom

The Load Settings card now starts with “Choose how to run it.” It shows the active preset plus simple chips for dtype, GPU memory, max context, tensor parallel, and preset args.

Advanced load settings still exist. When a non-Custom preset is selected, exact low-level fields are disabled to avoid confusing users. Choosing Custom re-enables exact fields.

The Model Detail Drawer now shows the active preset in Recommended vLLM settings.

## Key UX principle

Keep making the app easier, not more complex.

Do not add more top-level tabs unless absolutely necessary. Prefer progressive disclosure.

## Validation expectations

Before packaging a new version:

- frontend build passes
- backend tests pass
- README, ROADMAP, CHANGELOG, and docs are updated
- new version zip is created

## Suggested next milestone

v21.8 — Remote GPU polish

Goal:

Make Remote feel as simple as Run Model:

- clearer connected/disconnected status
- remote GPU health summary
- running model summary
- endpoint copy
- logs shortcut
- restart / reconnect affordances
- keep advanced remote details hidden
