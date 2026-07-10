# v24.5 — Screenshot Capture & README Image Wiring

v24.5 turns the beta screenshot plan into a repeatable release step and wires safe placeholder cards into the README until real screenshots are captured.

## Why this exists

v24.3 documented the screenshot contract and v24.4 added the milestone gate. v24.5 wires the screenshots into the README, adds capture/check scripts, and makes missing screenshots visible before a public beta tag.

## What changed

- Added `scripts/capture-screenshots.sh`.
- Added `scripts/check-screenshots.sh`.
- Added Makefile targets:
  - `make capture-screenshots`
  - `make screenshot-check`
- Added screenshot gallery wiring to `README.md`.
- Added a screenshot manifest for release review.
- Updated smoke checks to require screenshot scripts and files.
- Added secret-safe placeholder PNGs so README image links are not broken before final capture.

## Required screenshots

The public beta gallery uses exactly these files:

- `docs/screenshots/01-run-model.png`
- `docs/screenshots/02-models.png`
- `docs/screenshots/03-endpoint-success.png`
- `docs/screenshots/04-remote.png`
- `docs/screenshots/05-setup-check.png`

## Capture flow

Start the app first:

```bash
./scripts/dev.sh
```

Then capture screenshots from another terminal:

```bash
./scripts/capture-screenshots.sh
./scripts/check-screenshots.sh
```

The capture script uses a hidden query-parameter route for deterministic screenshots, such as `?page=remote&mode=daily`. This does not add visible UI or widen Daily mode. In locked-down browser environments, Chromium may block all local URLs; in that case keep the placeholders and recapture on a normal dev machine.

## Release rule

Before publishing the README or a GitHub release, manually review every screenshot for:

- API keys
- Hugging Face tokens
- private file paths
- real customer endpoints
- SSH hostnames
- cloud account identifiers
- local usernames

If a screenshot shows a real path or machine name, recapture with demo data.
