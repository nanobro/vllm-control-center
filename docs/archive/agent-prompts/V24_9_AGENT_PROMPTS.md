# v24.9 Agent Prompt — Public Beta Re-Freeze

Use v24.9 as the final pre-tag freeze candidate before v25.0.

Do not add product features. Do not add Daily mode surfaces. Do not widen navigation.

The task is release confidence:

- Keep the daily path focused on choose model -> load -> quick test -> copy `/v1` endpoint.
- Keep v25.0 web-first.
- Keep Electron preview-only.
- Make version naming consistent across README, ROADMAP, CHANGELOG, milestones, release notes, and package commands.
- Run launch, smoke, screenshot, bug-bash, release-freeze, backend, frontend, and desktop shell checks.
- If the real vLLM happy path has not been tested, say so clearly in `docs/releases/BETA_BUG_BASH_STATUS.md`.

Ship v24.9 only as a re-freeze package. The next step should be v25.0 public beta tag or a blocker fix, not new feature work.
