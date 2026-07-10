# v0.55 — Long Model ID Overflow Polish Pass

## Goal

Make the main path feel calm when users choose real-world model names. Hugging Face IDs, served model names, snapshot filenames, and local filesystem paths can be extremely long, but they should not stretch rows, cards, or handoff panels.

## Changes

- Added layout containment for long model IDs and paths across Run Model, Models, Downloads, Remote, and detail surfaces.
- Long values now truncate or wrap safely in main rows instead of pushing buttons and status chips off-screen.
- Served-model-name mismatch hints and tested-model strips stay readable when vLLM reports a long served name.
- Download cards keep long current-file and local-path values contained.
- Variant chips and recommendation cards keep long quantization or snapshot labels inside their cards.
- Copy confirmation and manual-copy fallback panels keep their previews contained.

## Product rules kept

- Daily mode remains: Pick model -> Start -> Test -> Copy OpenAI base URL.
- No new dashboard surface was added.
- Full values remain available in details, titles/tooltips, drawers, or copy/manual-copy areas.
- Qwen3.6 and large Qwen text-generation models remain runnable; size alone is not a blocker.
- Electron remains preview-only.
- The public beta line continues as v0.55, then v0.56.
