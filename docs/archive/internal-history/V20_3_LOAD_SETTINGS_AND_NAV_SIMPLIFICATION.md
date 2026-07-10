# v20.3 — Load Settings and Navigation Simplification

v20.3 responds to two LM Studio UX gaps:

1. The primary app navigation had too many tabs compared with LM Studio.
2. Loading a model needed a visible settings panel instead of forcing users into instance/config pages.

## What changed

### Compact primary navigation

The sidebar now keeps only the high-frequency workflows visible:

- Server
- Local Models
- Downloads
- Remote
- Settings

Lower-frequency/operator/developer pages move into an **Advanced tools** disclosure. They still exist, but the default app shape is less overwhelming and closer to LM Studio's focused sidebar.

### Server Load Settings panel

The Server page now exposes the most important vLLM launch controls in one place:

- host
- port
- dtype
- GPU memory utilization
- max model length
- served model name
- server API key
- tensor parallel size
- pipeline parallel size
- KV cache memory
- trust remote code
- auto tool choice
- tool call parser
- reasoning parser
- extra vLLM args

The normal flow stays simple; advanced controls are collapsed under **Advanced load settings**.

### Backend support for advanced load settings

Quick-launch and local-load endpoints now preserve the expanded load settings in `VllmServeConfig` instead of ignoring them.

### Local model metadata continuity

This package also keeps the Local Models metadata polish expected after v20.2:

- `config.json` metadata reading
- GGUF file detection
- quantization inference from filenames
- architecture/context-length inference where available
- variant count and metadata warning fields

## Design rule

The Server page should remain the user's primary home. Advanced pages are implementation/debug tools, not the default path.

