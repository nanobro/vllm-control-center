# Desktop Packaging Decision

For the public beta, vLLM Control Center is **web-first**.

## Public beta path

Use the browser UI with the local FastAPI controller:

```bash
./scripts/bootstrap.sh
./scripts/dev.sh
./scripts/launch-check.sh
```

This is the supported beta path for install, launch, model loading, quick test, and endpoint copy.

## Electron status

The Electron shell in `desktop/electron` is a **preview shell** for maintainers and early testers.

It is useful for validating whether the web UI can be wrapped cleanly, but it is not the production desktop app yet.

## What is not included yet

- Signed macOS, Windows, or Linux installers
- Auto-update
- Desktop-owned controller lifecycle
- Background service management
- OS keychain as the default secret path
- Desktop-specific support guarantees

## Why this decision was made

The hardest desktop question is not the window. It is lifecycle ownership:

- who starts the controller
- who stops running models
- where logs live
- how auth is passed
- how updates work while vLLM is serving

The beta should validate the core product before locking in those choices.

## Revisit after beta

Revisit desktop packaging after v0.26+ bug-bash feedback shows:

- which operating systems testers actually use
- whether users expect the app to own the controller lifecycle
- whether a browser-first workflow is already acceptable
- which install failures happen most often
