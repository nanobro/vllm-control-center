# v23.11 Agent Prompt — Endpoint Copy & Developer Handoff Polish

You are continuing vLLM Control Center from v23.11.

Product positioning:

LM Studio UX + vLLM power + remote GPU ops.

Core daily flow:

1. choose model
2. load
3. quick test
4. copy OpenAI-compatible `/v1` endpoint
5. paste into an app, SDK, Open WebUI, or agent

v23.11 added:

- compact developer handoff controls when a model is running
- copyable base URL and served model name
- copyable curl, JavaScript SDK, and Python SDK snippets
- SDK-copy shortcuts in the advanced endpoint card

Important UX direction:

Keep Run Model calm. Do not add another large documentation card. Developer handoff should remain compact and optional.

Recommended next milestone:

v23.12 — Visual Density Screenshot QA

Goal:

Audit the app visually after the simplification series. Use screenshots/manual QA to find remaining clutter, inconsistent spacing, repeated helper text, oversized cards, or confusing labels.

Focus areas:

- Run Model daily state
- Run Model first-launch state
- Models library
- Remote daily state
- Settings
- Help & support / More tools in Advanced mode

Do not add major new features unless required to remove friction.
