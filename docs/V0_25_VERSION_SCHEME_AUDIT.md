# v0.25 — Version Scheme Reset Audit

This audit resets the public beta version from the internal v24.x/v25.0 plan to **v0.25**.

## Audit scope

Checked and updated the release-facing surfaces that a user, tester, or future agent is likely to read first:

- `README.md`
- `ROADMAP.md`
- `CHANGELOG.md`
- `docs/MILESTONES.md`
- `docs/releases/*`
- `docs/BETA_BUG_BASH.md`
- `desktop/README.md`
- `.github/ISSUE_TEMPLATE/*`
- `ai-agent-prompts/NEXT_AGENT_PROMPTS.md`
- `frontend/src/pages/ReleasePage.tsx`
- `scripts/smoke.sh`
- `scripts/release-freeze-check.sh`

## Decision

- Public beta starts at **v0.25**.
- The old v24.x line remains historical/internal.
- Future beta fixes continue as **v0.26**, **v0.27**, and onward.
- v1.0 remains a later stable milestone.

## Findings

- The product surface is still appropriately frozen around Daily mode.
- The desktop promise remains web-first with Electron preview-only.
- The main risk was mixed public wording that pointed to `v25.0`. This pass updates the release-facing docs and checks to avoid that confusion.
- Historical implementation notes still contain old version numbers by design. They are not public release instructions.

## Remaining honest note

The real vLLM happy path still needs to be run on a vLLM-capable machine or explicitly marked untested in `docs/releases/BETA_BUG_BASH_STATUS.md`.
