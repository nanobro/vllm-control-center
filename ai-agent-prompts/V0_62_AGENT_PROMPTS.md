# v0.62 Agent Prompt — GitHub Public Repo Cleanup Pass

Use this when auditing or continuing from v0.62.

## Intent

v0.62 is a repo hygiene pass for first public GitHub publication. Do not add app UI, dashboard cards, or generic chat surfaces.

## Must preserve

- Daily path: Pick model -> Start -> Test this model -> Copy `/v1` base URL.
- Web-first public beta.
- Electron preview-only.
- Qwen3.6 and large Qwen text-generation models remain runnable; never block by size alone.
- Sidebar version badge is sourced from frontend package metadata.

## Cleanup contract

- Old internal v3-v24 docs live under `docs/archive/internal-history/`.
- Older handoff prompts live under `docs/archive/agent-prompts/`.
- `ai-agent-prompts/` should stay small: NEXT plus the latest prompt window.
- README must show current beta status near the top.
- `docs/GITHUB_RELEASE_CHECKLIST.md` must exist and stay practical.

## Checks

Run version, release-freeze, bug-bash, screenshot, smoke, launch, frontend, backend, and desktop checks before packaging.
