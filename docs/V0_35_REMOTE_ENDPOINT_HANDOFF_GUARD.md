# v0.35 — Remote Endpoint Handoff Guard Pass

v0.35 is a focused beta fix for Remote GPU handoff clarity.

The problem: Remote could feel like LM Studio's simple endpoint flow, but still let the visible/copyable `/v1` endpoint drift away from the selected remote model. If another remote model was running, or if the selected model was stopped, users could see a URL that looked ready when it was not the selected endpoint they intended to hand off.

## What changed

- The selected remote model is now the source of truth for Remote endpoint handoff.
- The `/v1` base URL is shown as copyable only when:
  - a remote GPU profile is selected,
  - the remote controller is connected, and
  - the selected remote model is `running`.
- Stopped, starting, crashed, disconnected, or missing selections show a plain reason instead of a stale endpoint.
- Quick test appears only for the selected ready remote endpoint.
- Test/copy state resets when switching remote profiles, switching selected models, or when the selected model status changes.
- If other remote models are already running, the UI says so without silently switching the handoff target.

## Product guardrails kept

- Daily mode stays simple: Pick -> Start -> Test -> Copy OpenAI base URL.
- No new dashboard surface was added.
- Remote logs and GPU health stay available in existing secondary/details areas.
- Electron remains preview-only.
- The beta remains web-first.
- Qwen3.6 and large Qwen text-generation models remain runnable; size alone is not incompatibility.

## Verification checklist

Run before packaging:

```bash
./scripts/version-scheme-check.sh
./scripts/release-freeze-check.sh
./scripts/bug-bash-check.sh
./scripts/smoke.sh
./scripts/check-screenshots.sh
./scripts/launch-check.sh
./scripts/check.sh
```
