# v0.61 — Easy Test Flow UX Pass

## Goal

Make testing obvious after a model is loaded. A tester should not need to hunt for Playground or understand running-instance wording just to confirm a model works.

## Product rules

- Keep Daily mode simple: Pick model → Start → Test → Copy OpenAI base URL.
- Do not add dashboard clutter.
- Keep exact logs, paths, snippets, and advanced controls in details/drawers.
- Keep Qwen3.6 and large Qwen text-generation models runnable.
- Do not block models just because they are large.

## Shipped

- Run Model now shows a direct **Test this model** panel for a loaded model.
- The test panel has an editable prompt box and starter prompt chips.
- The response renders as a small readable answer card instead of a debug-looking pre block.
- Main-path wording now says Test this model instead of centering Playground/Quick test jargon.
- Copy gating remains tied to the exact tested server run and tested model name.

## Verification

Run the usual beta gate: `scripts/check.sh`, frontend build, backend tests, backend lint, desktop shell check, version scheme check, release freeze check, bug-bash check, screenshot check, smoke check, and launch check.
