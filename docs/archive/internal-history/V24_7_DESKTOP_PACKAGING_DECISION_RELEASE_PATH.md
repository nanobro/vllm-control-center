# v24.7 — Desktop Packaging Decision & Release Path

v24.7 makes the desktop story explicit before the public beta tag. The decision is intentionally conservative: **v25.0 remains web-first, with Electron kept as a preview shell**.

## Decision

Ship the public beta as a browser-based local control center:

```text
React/Vite frontend -> FastAPI controller -> vLLM runtime
```

Keep the Electron shell in the repo as a preview for maintainers and early testers, but do not promise production installers for v25.0.

## Why

The daily workflow is already usable from the browser, and the controller lifecycle still needs real-user validation before the desktop shell owns it.

A production desktop installer would need to answer support-heavy questions:

- Should the desktop app start and stop the FastAPI controller automatically?
- Should closing the window stop running vLLM instances, or keep them alive?
- How should Python, vLLM, CUDA, and NVIDIA tools be detected across operating systems?
- How should local API keys be stored and passed without leaking into logs?
- How should app updates handle a running model server?

Those are solvable, but they are not beta-freeze work.

## v25.0 support promise

Supported for public beta:

- Fresh clone or ZIP package
- `./scripts/bootstrap.sh`
- `./scripts/dev.sh`
- Browser UI at the Vite URL
- FastAPI controller at `http://127.0.0.1:8787`
- `./scripts/launch-check.sh`, `./scripts/smoke.sh`, and `./scripts/check-screenshots.sh`

Preview only:

- `desktop/electron`
- `npm run dev` inside the Electron shell
- Loading the built frontend in a desktop window

Not promised for v25.0:

- Signed macOS `.dmg`
- Windows installer
- Linux AppImage/deb/rpm
- Auto-update
- Desktop-managed controller lifecycle
- OS keychain integration as the default auth path

## Desktop preview expectations

The Electron shell should remain honest:

- It wraps the existing frontend.
- It does not replace the browser path.
- It does not hide backend/controller errors.
- It does not bypass controller auth.
- It does not claim the controller is running when it is not.

## Post-beta path

A future desktop release can graduate only after beta feedback confirms the desired lifecycle:

1. Web-first beta proves install, load, quick test, endpoint copy, and remote GPU flows.
2. Maintainers choose controller lifecycle behavior.
3. Desktop preview gets a launch check that mirrors the browser path.
4. Packaging targets are chosen by real user demand.
5. Signed installers become a v26.x or later milestone.

## Guardrail

Do not add desktop installer promises to README, release notes, or screenshots before the controller lifecycle decision is made.
