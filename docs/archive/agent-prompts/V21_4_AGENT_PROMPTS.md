# v21.4 Agent Prompts

Use v21.4 only.

## QA prompt

Install v21.4 and focus on the new Model Detail Drawer.

Verify:

1. Server Simple Mode shows a right-side drawer when selecting a model from This device.
2. Local Models rows are selectable and update the drawer.
3. Downloads cards are selectable and update the drawer.
4. The drawer shows path, source, format, quantization, size, architecture/context when available, loaded status, download status, and recommended vLLM settings.
5. Recommended vLLM settings are simple chips, not intimidating raw JSON.
6. Load / Unload actions work from the drawer where applicable.
7. Test / Logs / Copy endpoint are enabled only when a model instance exists.
8. Download cards still support cancel, retry, Load now, View in Local Models, and Delete job.
9. The drawer collapses to a single-column layout on smaller screens.
10. Advanced cockpit remains optional and does not become the main path.

Preferred DGX/local test:

- Select an already-detected local HF snapshot.
- Select a GGUF quantized variant if available.
- Load it from the drawer.
- Confirm endpoint copy points to `/v1`.
- Open logs and quick test from the drawer.
- Unload from the drawer and confirm model files remain on disk.
