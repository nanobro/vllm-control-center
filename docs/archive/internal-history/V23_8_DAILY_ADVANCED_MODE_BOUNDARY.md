# v23.8 — Daily / Advanced Mode Boundary

## Goal

Make the app feel less like every historical feature is visible at once.

The normal UI should answer one question:

> How do I run a model and get the `/v1` endpoint?

Everything else should remain available, but it should clearly live in Advanced mode.

## What changed

- Added a sidebar mode card:
  - **Daily mode** shows only everyday surfaces.
  - **Advanced mode** reveals support and operator tools.
- Daily mode keeps the primary nav focused on:
  - Run Model
  - Models
  - Remote
  - Settings
- Help & support is hidden by default until the user switches to Advanced mode or opens an advanced page.
- Opening logs, metrics, playground, setup, release kit, or More tools automatically enables Advanced mode.
- More tools now introduces itself as Advanced mode instead of another everyday page.

## UX rule

Daily mode is for:

1. choose model
2. load
3. quick test
4. copy endpoint

Advanced mode is for:

- setup doctor
- logs
- release checks
- metrics
- raw instances
- compatibility lab
- support bundles
- remote debugging

## Why this matters

Earlier versions hid advanced panels inside pages, but the sidebar still implied that all tools were equally important. v23.8 creates a stronger visual boundary so first-time users see a calmer app.

## QA checklist

- Fresh open starts in Daily mode.
- Sidebar shows only Run Model, Models, Remote, Settings.
- Advanced mode toggle reveals Help & support.
- Opening Logs from Run Model enables Advanced mode automatically.
- Returning to Daily mode hides Help & support when on a primary page.
- Hidden tools remain reachable through More tools.
