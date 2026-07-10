# Architecture

```text
React UI
  |
  | HTTP / polling / future SSE
  v
FastAPI Controller
  |-- environment doctor
  |-- vLLM config compiler
  |-- process manager
  |-- log store
  |-- metrics scraper
  |-- playground proxy
  |-- export generator
  v
vLLM OpenAI-compatible server
```

## Design rules

1. The frontend never spawns processes directly.
2. The controller is the only process owner.
3. Commands are built as argv arrays, never shell strings.
4. API keys and Hugging Face tokens must be redacted in logs and exports.
5. Local mode and remote mode should share the same controller API.
6. Advanced vLLM flags go through `extra_args`, but unsafe shell tokens are rejected.

## Current implemented modules

- `app.core.command_builder`: builds subprocess argv, YAML, Docker command, Compose.
- `app.core.doctor`: checks Python, vLLM, Docker, NVIDIA.
- `app.core.process_manager`: starts/stops/restarts local vLLM subprocesses.
- `app.core.metrics_parser`: parses Prometheus text exposition from `/metrics`.
- `app.core.export_helpers`: builds cURL, Python, TypeScript, Open WebUI snippets.
- `app.api.playground`: non-streaming OpenAI-compatible chat proxy.
- `app.api.metrics`: scrapes vLLM metrics and NVIDIA GPU data.
- `app.api.exports`: returns all useful snippets/configs for an instance.

## Next architectural step

Add a small background task registry:

- one task tails process logs
- one task watches process exit
- one optional task periodically scrapes metrics while running

This keeps the UI fast and avoids doing expensive checks only when a page is open.

## v7 open-source notes

For a compact diagram, see `docs/ARCHITECTURE_DIAGRAM.md`.

The most important public architecture promise is that the frontend talks to a controller, not directly to subprocesses. That lets the same UI control local vLLM processes and remote GPU controllers with the same mental model.
