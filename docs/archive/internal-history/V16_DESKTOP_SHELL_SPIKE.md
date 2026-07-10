# v16 — Desktop Shell Spike

v16 adds a low-risk desktop shell research/prototype layer while preserving the web-first architecture.

## Why this milestone exists

The product direction is LM Studio-style, but the core control plane should stay stable before packaging. v16 explores how the existing React/Vite frontend can run inside a desktop window without rewriting the controller or frontend.

## Decision

Use an Electron prototype for the first shell spike.

Reasons:

- It can load the existing Vite build directly.
- It is easy for contributors and AI agents to reason about.
- It keeps desktop packaging separate from the controller.
- It lets us test controller lifecycle questions before committing to production packaging.

Tauri remains a good future option after we understand packaging, updater, signing, and controller lifecycle requirements.

## Added files

```text
desktop/README.md
desktop/electron/package.json
desktop/electron/main.cjs
desktop/electron/preload.cjs
desktop/electron/scripts/check-desktop.mjs
```

## Prototype behavior

The Electron shell loads either:

1. `VCC_DESKTOP_DEV_URL`, if provided, or
2. `frontend/dist/index.html`, if the frontend has been built.

The shell does **not** auto-start the controller yet. Users should start the FastAPI controller separately.

## Security posture

The prototype uses conservative Electron settings:

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- static preload bridge only
- external links open in the system browser
- no controller auth bypass

## Controller lifecycle questions

Before production desktop packaging, decide:

- Should the shell start the controller automatically?
- Should the controller run as a child process or background daemon?
- Should closing the window stop vLLM instances?
- Should a tray menu expose Start/Stop Controller?
- How should controller logs be surfaced when packaged?
- How should controller auth be generated on first run?

## Current recommendation

For the next desktop milestone, implement a controller lifecycle prototype behind explicit scripts, not automatic behavior in production paths.
