# v23.13 — UX Audit & Dead-Surface Removal

This pass audits the simplified beta UI for duplicate guidance, stale milestone labels, and daily-mode clutter.

## Product standard

The app should feel like an LM Studio-style local server UI for vLLM:

1. choose a model
2. load it
3. quick-test it
4. copy the OpenAI-compatible `/v1` endpoint

Remote GPU operations, diagnostics, logs, release checks, and compatibility tools remain available, but they should not crowd the daily path.

## Audit findings

- The main Daily mode surfaces are now limited to Run Model, Models, Remote, and Settings.
- Help/support tools remain behind Advanced mode.
- Live UI still had a few leftover version/milestone labels, especially the inline setup card and release copy.
- Release Kit still referenced an older package command.
- Setup Doctor naming was useful internally, but a little clinical for the daily UI.

## Changes in v23.13

- Renamed the live sidebar item from **Setup Doctor** to **Setup check**.
- Renamed **Release Kit** to **Release kit** for calmer product tone.
- Removed the live `v22.1 setup doctor` label from Run Model and replaced it with **Setup check**.
- Updated release screenshot naming from `05-setup-doctor.png` to `05-setup-check.png`.
- Updated the copyable package command to `v23.13`.
- Added an audit guardrail to future-agent handoff: do not add new cards to Daily mode unless they replace an existing surface.

## Keep / remove decision

Kept:

- Setup check, because users need a path when first-run readiness fails.
- Release kit, because maintainers need beta screenshot and release helpers.
- More tools, because legacy/debug pages still matter for operators and contributors.

Removed or toned down:

- Live milestone labels.
- Version-specific setup wording.
- Older package command copy.

## QA checklist

- Daily mode shows only core user pages.
- First launch shows one next action, not a stack of helpers.
- Loaded model state makes endpoint/test/copy obvious.
- Remote page does not look like an ops dashboard by default.
- Advanced mode remains one click away.
