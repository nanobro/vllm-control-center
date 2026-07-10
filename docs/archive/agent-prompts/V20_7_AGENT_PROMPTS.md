# v20.7 Agent Prompt — Guided Run Mode

Use v20.7 only. Inspect the repository first. Do not rewrite it from scratch.

## Product direction

This is an LM Studio-style control plane for vLLM. The main UX should feel like:

1. choose model
2. choose variant/quant if relevant
3. download if needed
4. load model
5. test/copy endpoint

Do not push users into instance/admin concepts before the first successful load.

## Preserve

- FastAPI controller + React/Vite frontend
- safe subprocess execution; never use `shell=True`
- Local Models / Downloads / Server as the primary flow
- Advanced tools as secondary
- existing tests and docs

## Next recommended work

v20.8 — First Successful Load QA

Implement only small, reviewable fixes from real use on DGX/local machines:

- make the guided flow detect if a model is already local and skip download guidance
- improve load failure messages from real vLLM logs
- show one obvious "Open in Playground" after a successful quick test
- add a small success checklist after first successful load
- keep Advanced cockpit collapsed by default
- do not add new major pages

Run:

- backend tests
- backend lint
- frontend build
- desktop shell check script if possible

Summarize changed files and manual test steps.
