# v22.1 Agent Prompt — First-Run Setup Doctor

You are continuing vLLM Control Center after v22.1.

Current release: v22.1 only.

Positioning:
LM Studio UX + vLLM power + remote GPU ops.
Not a generic chat UI.

Core UX goal:
A new user should be able to open the app and understand how to get to a working OpenAI-compatible `/v1` endpoint without reading docs.

What v22.1 added:
- Run Model now has a v22.1 setup doctor card.
- The setup doctor summarizes vLLM, GPU, model source, HF token, port, and endpoint readiness.
- Missing items have simple actions: copy install command, recheck, add `./models`, scan HF cache, download starter, browse HF.
- The Setup Doctor page was rewritten into a first-run support page.
- Backend doctor now reports optional Hugging Face token availability through `HF_TOKEN` or `HUGGING_FACE_HUB_TOKEN` without exposing the token.
- Run Model checks the selected port through `/api/system/ports/{port}` while treating an already-running endpoint as healthy.
- Starter recommendations are intentionally small and simple: Qwen3 0.6B, Qwen2.5 Coder 7B, Qwen3 14B.

Important product preference:
Keep making the app easier, not more complex. Do not add new primary tabs unless absolutely necessary. Hide operator concepts until the user asks for them.

Likely next milestone:
v22.2 — Release Page / Screenshots / Demo Data

Recommended v22.2 scope:
- Add README screenshot placeholders or demo screenshots.
- Add quickstart docs for local workstation and remote GPU host.
- Add Open WebUI and OpenAI SDK endpoint setup examples.
- Add public beta release checklist.
- Keep UI feature work frozen unless it fixes first-run confusion.

QA expectations before packaging:
- Frontend typecheck/build passes.
- Backend tests pass.
- Backend lint passes.
- Desktop shell check passes.
- Manual first-run smoke test from `docs/V22_1_FIRST_RUN_SETUP_DOCTOR.md` is still valid.
