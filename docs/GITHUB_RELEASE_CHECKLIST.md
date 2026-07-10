# GitHub Release Checklist

Use this before the first public push and before each tagged beta release.

## Before first public push

- Confirm the repo opens with a clean README current release and beta status section.
- Confirm old internal history lives under `docs/archive/` instead of the main docs list.
- Confirm `ai-agent-prompts/` contains only `NEXT_AGENT_PROMPTS.md` and the latest prompt window.
- Confirm no real API keys, cloud hostnames, private paths, or customer names are in screenshots/docs.
- Confirm Electron is described as preview-only, not a production desktop app.
- Confirm Qwen3.6 and large Qwen text-generation models are not blocked by size alone.

## Required checks

```bash
./scripts/version-scheme-check.sh
./scripts/release-freeze-check.sh
./scripts/bug-bash-check.sh
./scripts/check-screenshots.sh
./scripts/smoke.sh
./scripts/launch-check.sh
./scripts/check.sh
```

If `scripts/check.sh` times out in a constrained sandbox, run the underlying checks separately and document that in the release note.

## Before creating a GitHub release

- Re-run the checks from a clean clone if possible.
- Replace placeholder screenshots with real safe screenshots when available.
- Run a manual vLLM happy path on a GPU machine when possible:
  - pick model
  - start
  - wait for ready
  - test this model
  - copy `/v1` base URL
  - use the copied values in a tiny OpenAI-compatible client
- Add any untested limitation directly to the release notes.

## Tag format

Use public beta tags such as `v0.62`, `v0.63`, and so on. Do not return to old internal version lines unless the maintainer intentionally changes the scheme.
