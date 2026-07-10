# v20.6 Agent Prompts

## Continue from v20.6

Use v20.6 only. Do not rewrite the repo from scratch.

Product direction:
- This is an LM Studio-style control plane for vLLM.
- The Server and Local Models pages should use user language: Load, Unload, Eject.
- Avoid turning the UI back into an instance-admin dashboard.

Rules:
- Preserve FastAPI + React/Vite architecture.
- Never use shell=True.
- Preserve tests and add tests for backend behavior.
- Run backend tests, ruff, frontend build, and desktop shell check.

Important lifecycle semantics:
- Load = start/reuse a vLLM instance for a model.
- Unload = stop the instance and keep files.
- Eject = delete stopped instance state/logs/metrics and keep files.
- force_new should be required for intentional duplicate instances.

Recommended next milestone:
- v20.7 — Real DGX Install QA and Screenshot Capture.
