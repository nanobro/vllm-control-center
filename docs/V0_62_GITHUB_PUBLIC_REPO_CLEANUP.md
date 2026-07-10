# v0.62 — GitHub Public Repo Cleanup Pass

Purpose: make the repository feel clean and trustworthy for first public GitHub publication without changing the app's Daily mode or adding new product surface.

## What changed

- Archived old internal v3-v24 history docs under `docs/archive/internal-history/`.
- Trimmed `ai-agent-prompts/` to the current maintenance window:
  - `NEXT_AGENT_PROMPTS.md`
  - `V0_58_AGENT_PROMPTS.md`
  - `V0_59_AGENT_PROMPTS.md`
  - `V0_60_AGENT_PROMPTS.md`
  - `V0_61_AGENT_PROMPTS.md`
  - `V0_62_AGENT_PROMPTS.md`
- Moved older handoff prompts under `docs/archive/agent-prompts/`.
- Added `docs/GITHUB_RELEASE_CHECKLIST.md` for first-push and first-release safety.
- Added README beta status near the top so first-time GitHub visitors know what works and what is still beta.
- Kept the web-first beta promise and Electron preview-only positioning.

## Non-goals

- No UI expansion.
- No new dashboard cards.
- No generic chat UI.
- No changes to Qwen3.6 or large Qwen text-generation runnability.
- No desktop installer promise.

## Manual audit notes

The repo may still contain old version numbers inside `CHANGELOG.md` and files under `docs/archive/`. That is acceptable as historical record. Current release guidance, live frontend copy, README current release, ROADMAP current package, package metadata, and release checks must point to v0.62.
