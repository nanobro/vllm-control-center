# v23.11 — Endpoint Copy & Developer Handoff Polish

## Goal

After a model is running, the user should immediately know how to connect it to another app.

The daily flow remains:

```text
choose model -> load -> quick test -> copy /v1 endpoint
```

v23.11 improves the final handoff moment without adding another page or large setup wizard.

## What changed

- Added a compact **Use this endpoint in your app** disclosure inside the running model panel.
- Added copyable cards for:
  - OpenAI-compatible base URL
  - served model name
- Added one-click copy actions for:
  - curl example
  - JavaScript OpenAI SDK example
  - Python OpenAI SDK example
- Added the same copy actions to the advanced endpoint card.

## UX rule

Do not turn Run Model into documentation.

The snippets are there when the user asks for them, but the default page still emphasizes:

- Quick test
- Copy endpoint
- Logs
- Unload

## QA checklist

- Load a model and verify the running state appears.
- Copy endpoint from the main action row.
- Open **Use this endpoint in your app**.
- Copy the model name.
- Copy curl, JS, and Python snippets.
- Confirm snippets use the selected instance `/v1` base URL.
- Confirm Advanced mode endpoint card shows the same copy options.
