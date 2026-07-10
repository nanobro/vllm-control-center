# v23.1 — Run Model Simplification Pass

## Why

A screenshot from an older beta showed the core issue clearly: Run Model had become useful but visually repetitive. Users saw quick start, setup doctor, one-click run flow, model running status, simple mode, checklist, detail drawer, logs, and advanced controls all on one page.

That made the app feel more complex than LM Studio even though the product direction is LM Studio UX + vLLM power + remote GPU ops.

## Goal

Make the daily path feel like one cockpit:

```text
select model -> load/unload -> quick test -> copy /v1 endpoint
```

Everything else should be details on demand.

## What changed

- Replaced the stacked Run Model surfaces with one simple workbench.
- The workbench shows only:
  - selected model
  - model source
  - endpoint state
  - primary Load / Unload / Quick test / Copy endpoint actions
  - compact model picker
  - Model Detail Drawer
- Setup Doctor is collapsed into a helper. It opens automatically only when vLLM, GPU, model source, or port needs attention.
- The first-run checklist is still available, but behind a small disclosure.
- Advanced cockpit still contains full QA, model picker, presets, exact vLLM settings, endpoint details, inline test, logs, metrics, and command preview.

## UX rule added

Do not add another top-level card to Run Model unless it replaces an existing card.

Run Model should have one primary panel. New guidance must be contextual, collapsed, or moved to Advanced tools.

## QA checklist

- Fresh install with no models shows one workbench plus setup helper.
- Machine with local models shows a selected or recommended model without needing multiple explanation cards.
- Running model shows one live endpoint panel with Quick test, Copy endpoint, Logs, and Unload.
- Failed/crashed model shows recovery helper, not duplicate setup guidance.
- Advanced cockpit still contains full settings and logs for operators.
