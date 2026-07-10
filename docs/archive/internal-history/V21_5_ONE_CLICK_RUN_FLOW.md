# v21.5 — One-Click Run Flow

v21.5 makes the Server page feel more like a focused **Run Model** home base instead of an operator cockpit.

## Goal

Reduce cognitive load for the core LM Studio-style workflow:

1. choose a model
2. download only if needed
3. load it
4. quick test it
5. copy the OpenAI-compatible endpoint

This milestone intentionally avoids adding deep vLLM controls. Advanced controls stay behind the existing Advanced cockpit disclosure.

## What changed

### Run Model navigation

The primary navigation now labels the server page as **Run Model**. The route is unchanged, but the product language now matches the user's real goal.

### One-click run entry card

A new top card gives users three obvious starting points:

- **This device** — pick detected local files first.
- **Download from Hugging Face** — switch to fresh HF discovery and variant picking.
- **Continue running** — jump back to a currently running instance.

This card keeps the app from feeling like a collection of tabs.

### Recommended local model

When a model is already available on disk, the page surfaces a **Best ready-to-run model on this device** card with:

- model family / display name
- variant, format, quantization, and size when known
- local path
- Select
- Load now

The recommendation prefers running models first, then local-path models, then better-ranked variants with fewer metadata warnings.

### Readiness labels

The selected model now gets a simple readiness label:

- Running
- Ready
- Downloaded
- Downloading
- Needs HF access
- Needs download
- Choose model

These replace guesswork with a plain next-step signal.

### Post-load success panel

When a model is running, a success panel appears above the guided flow with the actions most users need next:

- Quick test
- Copy endpoint
- Logs
- Unload

The endpoint is shown directly in the success panel so the first successful load has a clear finish line.

## UX decisions

- Keep one main path instead of adding another page.
- Make local/on-device models the default because that is usually the fastest success path.
- Keep Hugging Face discovery fresh but clearly a download path.
- Keep raw vLLM details hidden unless the user opens Advanced cockpit or the detail drawer.
- Do not delete model files from run-flow actions.

## Verification

- Frontend build passes.
- Backend tests pass.
- Existing Local Models, Downloads, and Model Detail Drawer flows remain compatible.
