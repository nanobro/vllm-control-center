# Project Status

Last updated: v0.48

## Current baseline

- **Current package:** v0.48 Endpoint Handoff Bundle Copy Pass
- **Current focus:** make Start -> warming-up -> endpoint-ready -> Quick test -> copy `/v1` trustworthy for beta testers
- **Recommended next milestone:** v0.49 feedback fixes only if real testers hit fresh-install, remote, or model-library confusion
- **Product direction:** LM Studio UX + vLLM power + remote GPU ops; not another generic chat UI
- **Architecture:** FastAPI controller + React/Vite frontend + SQLite local state

## Verification snapshot

Run the current checks before publishing the package:

```text
scripts/version-scheme-check.sh
scripts/launch-check.sh
scripts/smoke.sh
scripts/check-screenshots.sh
scripts/bug-bash-check.sh
scripts/release-freeze-check.sh
scripts/check.sh
```

## Current status

Daily mode is intentionally narrow: **Run Model**, **Models**, **Remote**, and **Settings**. The main path is still Pick -> Start -> Test -> Copy OpenAI base URL.

v0.47 improves handoff clarity: after Quick test passes, the local and remote surfaces show the exact tested model name to use in SDK calls. The default load path stays simple: Pick, Start, Test, Copy.

Qwen3.6 and large Qwen text-generation models remain eligible to run. Size alone is not treated as incompatibility.

## Recent completed beta passes

- v0.30: LM Studio familiarity and auto-detect pass.
- v0.31: model picker scroll and load reliability pass.
- v0.32: crash diagnosis and runnable-model confidence pass.
- v0.33: real vLLM happy-path validation pass.
- v0.34: start honesty and local crash memory pass.
- v0.35: remote endpoint handoff guard pass.
- v0.36: Low VRAM retry confidence pass.
- v0.37: Test-before-copy handoff pass.
- v0.39: Remote test-before-copy handoff pass.
- v0.40: Tested endpoint state label pass.
- v0.41: Restart-safe test handoff pass.
- v0.43: Quick test failure guidance pass.
- v0.44: Served model name mismatch guidance pass.
- v0.46: Auto served-name retry pass.
- v0.47: Tested model name handoff clarity pass.
- v0.48: Endpoint handoff bundle copy pass.

## Current gaps and debt

- A real vLLM-capable manual run is still required before a public GitHub release can claim actual model-load success.
- Compatibility estimates remain heuristic.
- Electron remains preview-only.
- Remote onboarding should only be expanded after real tester confusion is observed.
- No end-to-end browser test suite exists yet.

## Recommended next milestone

### v0.49 — Next beta feedback pass

Only fix real tester blockers or confusion around fresh install, local model recovery, remote setup, connection state, and endpoint handoff. Do not widen Daily mode or add dashboard clutter.
