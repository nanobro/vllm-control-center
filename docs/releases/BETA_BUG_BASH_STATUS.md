# Beta Bug-Bash Status

Use this file as the single beta-readiness ledger for the v0.62 GitHub Public Repo Cleanup beta pass and follow-up beta fixes.

## Current decision

**Status:** v0.62 is a focused public-repo cleanup pass for first GitHub publication: old internal history is archived, public agent prompts are trimmed, and the current beta path is easier to review. The sidebar beta badge must still come from package metadata so testers do not see stale labels such as old historical beta labels. Automated release checks are expected to pass, but the real local and remote vLLM happy paths still require a manual run on a vLLM-capable machine or an explicit untested note before a public GitHub release.

v0.25 was the first public beta tag after the internal release-candidate line. v0.62 keeps the beta scoped correctly:

```text
pick model -> Start -> warming up -> endpoint ready -> Test -> copy OpenAI base URL
```

Qwen3.6 and large Qwen text-generation models stay eligible to run. Size alone is not incompatibility. After a local or remote CRASHED state, users should get an understandable reason plus a test-before-copy handoff path before assuming the model is incompatible.

## Blocker policy

A bug is a **beta blocker** only if it prevents a new tester from completing or understanding the daily path.

| Severity | Meaning | Action |
| --- | --- | --- |
| Blocker | Fresh install, launch, model selection, load, quick test, endpoint copy, version consistency, or release package is broken. | Fix before publishing the current beta package. |
| Beta polish | Confusing copy, missing doc detail, rough empty state, or non-critical check warning. | Fix if low-risk; otherwise document. |
| Post-beta | New capability, expanded provider support, installer polish, desktop lifecycle, telemetry-free export, or advanced workflow. | Defer until real beta feedback justifies it. |
| Not planned | Generic chat UI, hosted control plane, cloud account assumptions, or widening the default nav. | Do not schedule before beta. |

## Manual happy-path result

Manual happy-path status: **not yet run in this packaging environment**. Fill this before publishing the current beta package, or mark why it could not be run:

- Date:
- Tester:
- Machine/GPU:
- OS:
- Model used:
- Install command passed: yes/no
- Launch command passed: yes/no
- Model detected or downloaded: yes/no
- Model loaded: yes/no
- Quick test passed: yes/no
- `/v1` endpoint copied and used externally: yes/no
- Notes:

## Known non-blockers for v0.62

- Electron shell is preview-only.
- Signed installers are not promised.
- Remote GPU onboarding is intentionally lightweight.
- Advanced vLLM knobs remain outside Daily mode.
- Screenshot placeholders may remain in source packages, but public release screenshots should be recaptured and checked.
- Auto-detected scan roots that do not exist are expected and should not block beta testing.
- Large model size alone is not a blocker; use warming-up state, crash diagnosis, and Low VRAM guidance instead.

## v0.62 entry checklist

Before publishing v0.62 publicly, confirm:

- Playground retries once on a served-model-name mismatch when the controller suggests the actual `/v1/models` name.

- `./scripts/version-scheme-check.sh` passes.
- `./scripts/launch-check.sh` passes with only expected local warnings.
- `./scripts/smoke.sh` passes with only expected local warnings.
- `./scripts/check-screenshots.sh` passes.
- `./scripts/bug-bash-check.sh` passes.
- `./scripts/release-freeze-check.sh` passes.
- README, release notes, known limitations, issue intake, and desktop decision docs agree on web-first beta status.
- No new Daily mode surface has been added unless it replaced an older/confusing one.
