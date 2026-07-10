# v0.29 — Endpoint & Quick-Test Beta Fix Pass

v0.29 stays inside the public beta feedback lane. It does not add a new Daily-mode surface. It tightens the final handoff moment after a model is running: test the endpoint, copy the correct `/v1` base URL, and understand what to paste into OpenAI-compatible clients.

## Why this pass exists

Beta testers can easily confuse three related values:

- OpenAI-compatible base URL: `http://localhost:8000/v1`
- chat completions path: `/v1/chat/completions`
- served model name: the model alias passed to SDK calls

The UI already had copy buttons and SDK snippets, but the labels could still read like “copy endpoint” instead of “copy base URL.” v0.29 makes the handoff wording more explicit without widening the app.

## Product changes

- Run Model now labels the copied value as the `/v1` base URL.
- Quick-test success copy tells the user the model responded and the base URL is ready to hand off.
- Quick-test failure copy names `/v1/chat/completions`, making failures easier to report.
- The running model panel now includes a short base URL helper line.
- The advanced endpoint card now says “OpenAI-compatible base URL” and warns not to paste `/chat/completions` into SDK `baseURL` fields.
- Remote GPU endpoint copy mirrors the same base URL wording.

## Guardrails

- Daily mode remains frozen.
- No new generic chat UI.
- No new dashboard surface.
- No change to the web-first beta promise.
- Electron remains preview-only.

## Expected tester outcome

A tester who has loaded a model should understand:

1. Run Quick test first.
2. If it passes, copy the `/v1` base URL.
3. Use the served model name in SDK/API calls.
4. Use `/v1/chat/completions` only as the request path, not as the SDK base URL.
