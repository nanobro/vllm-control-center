# v23.6 Agent Prompt — Release Kit Simplification

You are continuing vLLM Control Center from v23.5.

## Product positioning

LM Studio UX + vLLM power + remote GPU ops.

Not a generic chat UI.

## v23.6 goal

Simplify the Release Kit so it is a small practical beta readiness helper, not a dense internal milestone dashboard.

## Required behavior

- Remove stale version-specific copy from live UI where possible.
- Keep release guidance concise and maintainer-oriented.
- Preserve copyable beta summary, smoke path, and package commands.
- Keep readiness checks understandable:
  - first-run state readable
  - model can be selected
  - endpoint success can be shown
  - no broken demo leftovers
  - remote story is intentional
- Keep screenshot guidance compact.

## Verification

Run:

```bash
cd frontend && npm run build
cd ../controller && pytest -q
cd controller && ruff check app tests
```

Package without `node_modules`, `dist`, caches, local DBs, or secrets.
