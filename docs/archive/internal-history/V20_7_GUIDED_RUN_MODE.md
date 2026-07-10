# v20.7 — Guided Run Mode

v20.7 responds to a usability problem: the app had enough primitives, but it still asked users to understand instance/admin concepts too early.

## Goal

Make the main Server page feel closer to an LM Studio-style first-run flow:

1. Choose a model source.
2. Choose a model and optional Hugging Face variant.
3. Download if needed.
4. Load the model.
5. Test and copy the endpoint.

Advanced diagnostics, full load settings, command preview, logs, and metrics remain available, but are moved behind an explicit **Advanced cockpit** disclosure.

## What changed

- Added a Simple Mode card to the top of the Server page.
- Added four guided steps: Choose, Download, Load, Use.
- Kept Hugging Face discovery and quant/file variant selection in the simple path.
- Kept basic load settings visible: port and GPU memory utilization.
- Moved advanced cockpit content behind a collapsed disclosure by default.
- Preserved all existing backend behavior and API routes.

## Why

The product direction is still:

> LM Studio UX + vLLM power + remote GPU ops.

The issue was not missing backend power; it was too much cockpit surface area before the user completed the first successful model load.

## Verification

- Backend tests: 80 passed
- Backend lint: passed
- Frontend build: passed
- Desktop shell check script: passed

Note: Electron package installation can fail in sandboxed/offline environments because the Electron binary is downloaded from GitHub. The desktop static check script itself remains valid.
