# v19.1 Agent Prompts

Baseline: v19.1 only.

## Next recommended milestone: Real Install Server QA

Inspect the repo first. Do not rewrite from scratch.

Focus on testing v19.1 on a real DGX/local machine:

- Verify public npm registry install works.
- Verify Hugging Face search works with and without HF_TOKEN.
- Verify private/gated model guidance is clear.
- Verify Server page can search HF, register, download, create instance, and start.
- Verify inline test errors are readable when vLLM is missing or server is unreachable.
- Add any minimal bug fixes and tests.

Preserve:

- FastAPI + React/Vite architecture.
- Safe subprocess execution; never use shell=True.
- Controller auth and secret handling.
- Built-in catalog offline fallback.

Run:

- scripts/check.sh
- npm audit where practical

Summarize changed files and manual test steps.
