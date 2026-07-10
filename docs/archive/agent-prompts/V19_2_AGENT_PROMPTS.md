# v19.2 Agent Prompt — Fresh Model Discovery

Inspect the repo first. Do not rewrite from scratch.

Continue from v19.2.

Preserve:
- FastAPI + React/Vite architecture
- no shell=True
- Server page as the primary LM Studio-like workflow
- built-in catalog for offline use
- live Hugging Face discovery for fresh model lists

If continuing this area, improve:
- pagination for Hugging Face discovery
- model detail fetch/card metadata
- license/gated warnings
- better vLLM compatibility hints per discovered model
- local caching of recent HF discovery results

Run:
- scripts/check.sh
- backend tests
- frontend build
- desktop shell check

Summarize changed files and manual test steps.
