# v20.4 — Server Page UI Density Pass

v20.4 tightens the Server page toward the LM Studio mental model: model selection on the left, load/server controls in the center, and model/runtime inspection on the right.

## Goals

- Reduce visual clutter on the primary Server page.
- Keep advanced/dev pages available without making them first-run navigation noise.
- Make the main flow visible without tab-hopping: discover/select model, choose variant, load/unload, copy endpoint, test, inspect, and watch logs.
- Preserve the web-first architecture and avoid adding new backend surface area.

## UI layout

The Server page now behaves like a cockpit:

```text
Left column     Center column                  Right column
-----------     ----------------------------   ---------------------
Model source    Load settings                  Model inspector
HF discovery    Endpoint + supported routes    Live metrics
Variant picker  Quick test prompt              Command preview
Download card   Server logs
```

At narrower widths it falls back to two columns, then one column on smaller displays.

## Navigation

The primary sidebar remains intentionally small:

- Server
- Local Models
- Downloads
- Remote
- Settings

Everything else stays under Advanced tools. This keeps the app closer to LM Studio's focused navigation while preserving power-user pages.

## Notes

This milestone is intentionally frontend-heavy. It does not change instance behavior, download behavior, auth, or local model metadata parsing. It prepares the UI for real QA on DGX/local machines.

## Manual QA

1. Open the Server page at desktop width.
2. Confirm three-column layout appears.
3. Switch between Built-in and Hugging Face sources.
4. Confirm HF discovery controls stay in the left column.
5. Select a model/variant.
6. Confirm load settings, endpoint, quick test, and logs stay in the center column.
7. Confirm inspector, metrics, and command preview stay in the right column.
8. Resize below 980px and confirm layout becomes a single-column flow.
