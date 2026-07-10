# Beta issue intake guide

Use this guide to triage public beta feedback without turning every request into a feature.

## Labels to use

- `bug`: broken behavior that blocks or confuses the beta path.
- `install`: bootstrap, dependency, virtualenv, Node/npm, Python, or port issue.
- `model-load`: local model detection, compatibility, vLLM serve command, OOM, or unload issue.
- `download`: Hugging Face catalog/download/auth/gated model issue.
- `endpoint`: quick test, `/v1` endpoint, SDK snippet, or OpenAI-compatible client issue.
- `remote`: remote GPU profile, connection, start/stop/restart, or remote empty state issue.
- `docs`: README, screenshot, walkthrough, or release note issue.
- `beta-blocker`: issue should be fixed before publishing the current beta package.
- `post-beta`: valid idea, but not needed for the current beta lane.

## Triage order

1. Can the tester install and launch the app?
2. Can they reach Run Model in Daily mode?
3. Can they detect or download at least one model?
4. Can they load or get clear recovery guidance?
5. Can Quick test prove endpoint health?
6. Can they copy the `/v1` endpoint or SDK snippet?
7. Is Remote clear when empty or connected?

## What counts as a beta blocker

- Fresh install path is wrong or misleading.
- Daily mode has duplicated/conflicting setup surfaces.
- Run Model cannot explain the next action.
- A common load failure has no useful recovery message.
- Quick test fails without showing a plain-English reason.
- Endpoint copy is unclear after a successful load.
- README/demo/screenshot instructions contradict the app.

## What should wait until after the current beta lane

- New model provider integrations.
- Generic chat UI.
- Hosted service assumptions.
- More dashboard panels.
- Large desktop installer work unless the desktop decision doc explicitly changes the Electron preview path.
- Deep remote fleet management.

## Minimum bug report data

Ask for this when missing:

```text
OS:
GPU:
Python version:
Node/npm version:
vLLM version:
Model name:
Model source: local / Hugging Face download / remote
Step that failed: install / launch / scan / download / load / quick test / endpoint / remote
Sanitized logs:
```
