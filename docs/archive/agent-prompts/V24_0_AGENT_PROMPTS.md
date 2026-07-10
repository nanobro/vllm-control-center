# v24.0 Agent Prompt — Public Beta Freeze

You are continuing vLLM Control Center from v24.0.

Positioning:
- LM Studio-style UI for vLLM
- vLLM power plus remote GPU ops
- Not a generic chat UI

Current beta flow:
1. choose model
2. load
3. quick test
4. copy OpenAI-compatible `/v1` endpoint

Current UI boundary:
- Daily mode: Run Model, Models, Remote, Settings
- Advanced mode: setup check, logs, metrics, playground, release kit, compatibility/debug/operator tools

Important rule:
Do not add new daily-mode surfaces by default. Replace, collapse, or hide instead.

Recommended next milestone:
v24.1 — Real-user bug bash and smoke-test fixes.

v24.1 should focus on:
- fresh clone test
- empty install test
- one local model test
- one Hugging Face download test
- one failed load recovery test
- one remote empty state test
- one remote connected profile test

Avoid:
- new catalogs
- new dashboards
- new advanced cards
- milestone/version labels in live daily UI
