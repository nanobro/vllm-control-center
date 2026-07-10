# v21.8 Agent Prompt — Remote GPU Polish

You are continuing vLLM Control Center from v21.7 only.

## Product positioning

LM Studio UX + vLLM power + remote GPU ops.

This is not a generic chat UI. The app should make local and remote vLLM model operations easy.

## v21.8 goal

Polish the primary Remote workflow so it feels like a simple remote GPU command center rather than an operator console.

Users should be able to answer these questions quickly:

- Am I connected to the remote GPU box?
- What model is running there?
- How much GPU memory is used?
- What endpoint do I copy into OpenAI-compatible clients?
- How do I test, restart, or open logs?

## Implementation guidance

Keep the primary Remote page simple:

- connected / disconnected status
- latency
- remote GPU health
- selected/running model summary
- OpenAI `/v1` endpoint copy
- start / stop / restart
- inline logs
- one-shot quick test
- saved remote profiles
- add remote profile tucked in a disclosure

Keep advanced/operator details under Advanced tools.

Do not add new top-level navigation unless absolutely necessary.

## Guardrails

- Do not expose raw remote forwarding as the primary UX.
- Do not turn Remote into a generic infrastructure dashboard.
- Do not require users to understand controller/profile/instance terminology before they can copy an endpoint.
- Keep old advanced pages wired for power users.

## Verification

- Run frontend build.
- Run backend tests.
- Update README, ROADMAP, CHANGELOG, and this prompt.
