# Contributing to vLLM Control Center

Thanks for helping build an LM Studio-style control plane for vLLM.

This project is intentionally narrow: vLLM-first, controller-first, remote-GPU-first. Please keep contributions aligned with that direction.

## Product direction

This project is not another generic chat UI. Please optimize for:

- launching and controlling vLLM safely
- clear runtime configuration and reproducible exports
- local and remote GPU workstation workflows
- useful logs, metrics, and playground testing
- small, reviewable changes

## Development setup

Recommended:

```bash
./scripts/dev.sh
```

This starts the backend and frontend together.

Manual backend:

```bash
cd controller
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload --port 8787
```

Manual frontend:

```bash
cd frontend
npm install
npm run dev
```

## Check before opening a PR

Recommended:

```bash
./scripts/check.sh
```

Manual checks:

```bash
cd controller
pytest -q
ruff check app tests
```

```bash
cd frontend
npm run typecheck
npm run build
```

## Code rules

- Never use `shell=True` for process launch.
- Prefer argv arrays for commands.
- Do not log raw API keys, Hugging Face tokens, or bearer tokens.
- Add backend tests for every new route, lifecycle behavior, or safety rule.
- Keep frontend changes simple and typed.
- Do not rewrite the repository from scratch.
- Do not add broad product scope without updating the roadmap.

## Working with AI coding agents

AI agents are welcome, but keep them constrained:

1. Give the agent the latest zip/repo only.
2. Tell it to inspect the existing repo first.
3. Give it one milestone at a time.
4. Require tests and frontend build.
5. Review diffs before asking for the next milestone.

Use the prompts in `ai-agent-prompts/` as starting points.

## Pull request checklist

- [ ] Change is scoped and reviewable.
- [ ] Backend tests pass.
- [ ] Frontend typecheck/build passes.
- [ ] Backend lint passes.
- [ ] New routes are documented when user-facing.
- [ ] Secrets are redacted in logs/exports.
- [ ] Remote forwarding still only targets safe `/api/...` paths.
- [ ] No unsafe `shell=True` usage.
- [ ] Manual test steps are included in the PR.


## Internal development tracking

Before taking a larger task, read:

- `docs/dev/PROJECT_STATUS.md`
- `docs/dev/TODO.md`
- `docs/dev/DECISIONS.md`
- `docs/dev/AGENT_HANDOFF.md`

When completing a milestone, update:

- `CHANGELOG.md`
- `docs/dev/PROJECT_STATUS.md`
- `ROADMAP.md` if the milestone order changed
- milestone docs under `docs/` when useful
