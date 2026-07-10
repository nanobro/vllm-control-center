# v18.1 Agent Prompts

## Baseline

Use `vllm-control-center-starter-v18.1.zip` only. Do not mix with earlier zips.

## Next recommended milestone

v19 — Server Page Real-Use Polish

Focus on the Server page as the core LM Studio-like workflow.

### Requirements

- Inspect the repo first.
- Do not rewrite the app from scratch.
- Preserve FastAPI + React/Vite.
- Preserve safe process execution. Never use `shell=True`.
- Preserve dedicated remote routes and keep generic remote forwarding disabled by default.
- Run `scripts/check.sh` before packaging.

### Suggested v19 scope

- Add model catalog filters/tags in the Server page.
- Add “download status” detail near the selected model.
- Add more model inspector fields from registry/catalog.
- Add a first-run empty state that guides users to Model Hub/Downloads.
- Add a small inline test prompt box on Server page for a running instance.
- Add clearer vLLM CLI missing guidance from Server start errors.

### Non-goals

- Do not start desktop controller lifecycle work unless explicitly requested.
- Do not add RAG/MCP/K8s.
- Do not make the Server page depend on remote controllers yet.
