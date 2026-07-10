# v22.2 — Release Page / Screenshots / Demo Data

## Goal

Make the public beta easier to explain, demo, and release without adding more model-operation complexity.

v22.2 is a release-readiness pass. The core product loop already exists:

```text
Detect/download model -> load/unload -> quick test -> copy OpenAI-compatible endpoint
```

This milestone adds a maintainer-facing **Beta Release Kit** so contributors know what to capture, what demo states to prepare, and how to describe the project publicly.

## Product principle

Do not add another daily-use tab for normal users. Keep **Run Model**, **Models**, **Remote**, and **Settings** as the simple primary navigation. Put release/demo work in **Advanced tools** so the app remains LM Studio-like for operators and first-run users.

## Added

### Beta Release Kit page

A new advanced page helps maintainers prepare public beta assets:

- screenshot capture plan
- demo state checklist
- current beta state summary
- copyable release notes
- tight GitHub positioning reminder

The page reads existing controller state only:

- local model count
- active/completed/failed downloads
- running endpoint
- remote profile count
- server QA availability

It does not create instances, mutate settings, or queue downloads. That keeps it safe for demos and support sessions.

### Screenshot capture plan

Recommended public beta screenshots:

1. `01-run-model-first-run.png` — Run Model quick start + setup doctor.
2. `02-models-library.png` — unified local/download/running model library.
3. `03-loaded-endpoint.png` — model running, quick test, copy endpoint.
4. `04-remote-gpu.png` — remote GPU command center.
5. `05-setup-doctor.png` — plain-English first-run checks.

### Demo states

The page tracks whether these states are available:

- fresh install / empty device
- local model detected
- download manager activity
- running OpenAI-compatible endpoint
- remote GPU profile configured

## QA checklist

- Open **Run Model** and confirm normal users still start there.
- Open **Advanced tools → Beta Release Kit**.
- Confirm the page renders when the controller has no models and no remote profile.
- Confirm screenshot states change when a model is detected, downloaded, running, or remote profile exists.
- Confirm Copy release notes works where Clipboard API is available.
- Confirm no secrets are displayed.
- Confirm the page does not mutate local models, downloads, instances, or remote profiles.

## Files touched

- `frontend/src/pages/ReleasePage.tsx`
- `frontend/src/pages/App.tsx`
- `frontend/src/style.css`
- `docs/screenshots/README.md`
- `docs/demo/beta-demo-data.md`
- `docs/dev/RELEASE_CHECKLIST.md`
- `README.md`
- `ROADMAP.md`
- `CHANGELOG.md`
- `ai-agent-prompts/V22_2_AGENT_PROMPTS.md`
