# v24.7 Agent Prompts — Desktop Packaging Decision & Release Path

Use this package as a beta-freeze release. Do not add new daily UI surfaces.

## What changed

- v25.0 public beta is web-first.
- Electron remains preview-only.
- Desktop packaging promises are intentionally deferred until controller lifecycle decisions are validated.
- Release docs now explain supported, preview-only, and not-yet-supported desktop expectations.

## Guardrails

- Do not promise signed installers before v25.0.
- Do not imply Electron owns controller startup/shutdown.
- Do not hide the browser launch path behind desktop language.
- Keep Daily mode focused on choose model -> load -> quick test -> copy /v1 endpoint.

## Recommended next version

v24.8 should be beta bug-bash fixes only: fix real tester blockers, update known limitations, and keep feature creep out.
