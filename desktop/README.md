# Desktop Preview

The desktop folder contains an Electron **preview shell**. It is not the production desktop app and it is not a supported installer path for the v0.25 public beta.

The supported beta path remains web-first:

```text
React/Vite frontend -> FastAPI controller -> vLLM runtime
```

Run the beta with:

```bash
./scripts/bootstrap.sh
./scripts/dev.sh
./scripts/launch-check.sh
```

## v24.7 decision

v24.7 keeps Electron as a preview only.

Do not promise:

- signed installers
- auto-update
- desktop-managed controller lifecycle
- OS keychain as the default secret path
- production desktop support guarantees

before the controller lifecycle is validated by beta testers.

## Why this is preview-only

The window wrapper is straightforward. The support-heavy part is deciding how desktop owns local processes:

- Should the shell start the FastAPI controller?
- Should closing the window stop running vLLM instances?
- Should the controller run as a child process, background service, or user-managed daemon?
- Where should logs and local API keys live?
- How should updates behave while a model is serving?

Those choices should be made after the web-first public beta, not during freeze work.

## Prototype run flow

Terminal 1:

```bash
cd controller
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8787
```

Terminal 2:

```bash
cd frontend
npm install
npm run build
```

Terminal 3:

```bash
cd desktop/electron
npm install
npm run dev
```

The shell loads `frontend/dist/index.html` by default. Set `VCC_DESKTOP_DEV_URL=http://127.0.0.1:5173` to load the Vite dev server instead.

## Security defaults

- The renderer is sandboxed.
- `nodeIntegration` is disabled.
- Context isolation is enabled.
- The preload API exposes only static environment metadata.
- External links open in the system browser.
- The desktop shell does not bypass controller auth.

## Graduation criteria

The desktop preview can become a product track only when:

- the controller lifecycle is documented and agreed
- desktop launch failures are visible rather than hidden
- packaging targets are chosen from real beta feedback
- install/update behavior is testable
- the browser path remains fully supported
