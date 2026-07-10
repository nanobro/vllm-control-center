# v20.3 Agent Prompts

Use v20.3 only. Do not merge older zips.

## Product direction

This project is an LM Studio-style control plane for vLLM. Keep the default UX focused:

- Server
- Local Models
- Downloads
- Remote
- Settings

Do not add more top-level tabs unless the workflow is used constantly.

## Next suggested milestone

### v20.4 — Server Page UI Density Pass

Goal: make the Server page feel closer to LM Studio visually without adding scope.

Requirements:

- Convert the model picker into a two-pane layout: model list on left, selected model details on right.
- Keep Load Settings visible but compact.
- Add a loaded-model strip near the top, similar to LM Studio's loaded models row.
- Show Download status inline in the selected model panel.
- Keep advanced settings collapsed by default.
- Do not remove existing advanced pages; keep them under Advanced tools.
- Run backend tests, backend lint, frontend build, and desktop shell check.

