# v0.58 Agent Prompt — Playground Served Name Auto-Retry Pass

Use v0.57 as base and ship v0.58.

Mission:

- Fix the next Playground reliability blocker without widening scope.
- Keep Playground tied to the actually loaded/warming local model.
- If Playground receives a served-model-name mismatch with a suggested `/v1/models` name, retry once automatically using that served name.
- Show only a lightweight recovery notice; do not add a new dashboard panel.
- Keep the visible app beta badge synced from package metadata.
- Keep Daily mode simple: Pick model -> Start -> Test -> Copy OpenAI base URL.
- Keep Qwen3.6 and large Qwen text-generation models runnable.

Update:

- README
- ROADMAP
- CHANGELOG
- docs/MILESTONES.md
- release docs
- release/check scripts
- NEXT_AGENT_PROMPTS.md

Verify:

- Frontend build
- Backend tests
- Backend lint
- Desktop shell check
- version scheme check
- release freeze check
- bug-bash check
- screenshot check
- smoke check
- launch check

Return `vllm-control-center-starter-v0.58.zip`.
