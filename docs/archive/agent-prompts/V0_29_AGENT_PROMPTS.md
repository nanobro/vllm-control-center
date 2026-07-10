# v0.29 Agent Prompt — Endpoint & Quick-Test Beta Fix Pass

Start from v0.28. Public releases use the v0.x scheme. Do not return to v24.x, v25.0, or v26.x numbering.

## Scope

Ship v0.29 only as a beta feedback fix pass for endpoint handoff clarity.

Allowed work:

- Clarify `/v1` base URL wording.
- Clarify quick-test pass/fail states.
- Clarify SDK/curl handoff wording.
- Keep release checks, package metadata, and docs aligned with v0.29.

Forbidden work:

- No new Daily-mode cards.
- No generic chat UI.
- No new product tabs.
- No signed desktop installer promise.
- No old v25.0/v26.x public version targets.

## Required verification

Run:

```bash
./scripts/version-scheme-check.sh
./scripts/release-freeze-check.sh
./scripts/bug-bash-check.sh
./scripts/check-screenshots.sh
./scripts/smoke.sh
./scripts/launch-check.sh
./scripts/check.sh
```

Expected local warnings are acceptable for missing `vllm`, missing `nvidia-smi`, or inactive controller in a packaging environment.
