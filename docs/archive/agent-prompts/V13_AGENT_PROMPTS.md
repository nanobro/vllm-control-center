# v13 Agent Prompts

## Baseline instruction

```text
Inspect this repository first. Do not rewrite it from scratch.

Continue from v13 of vLLM Control Center.

Product direction:
- This is an LM Studio-style control plane for vLLM.
- It is not another generic chat UI.
- Preserve FastAPI controller + React/Vite frontend architecture.
- Preserve safe subprocess execution. Never use shell=True.
- Preserve controller auth and secret storage guardrails.
- Keep API responses redacted where secrets are involved.
- Add backend tests for new behavior.
- Run ./scripts/check.sh.
- Update docs/dev/PROJECT_STATUS.md, docs/dev/TODO.md, and CHANGELOG.md when completing a milestone.
- Summarize changed files and manual test steps.
```

## Recommended v14 milestone: Metrics UX

```text
Implement v14 — Metrics UX.

Backend requirements:
1. Add metrics history endpoint if missing or incomplete.
2. Store lightweight periodic metrics snapshots for running instances.
3. Add alert derivation helpers for:
   - high KV cache usage
   - requests waiting
   - metrics endpoint unavailable
   - high GPU memory usage
   - high temperature if available
4. Add tests for alert derivation and metrics history serialization.

Frontend requirements:
1. Improve Metrics page with clearer cards and simple charts.
2. Show human-readable alert cards.
3. Add empty/loading/error states.
4. Keep charts dependency lightweight.

Quality:
- Do not add Prometheus/Grafana as required dependencies.
- This should remain a human-readable local dashboard.
- Run ./scripts/check.sh.
```

## Alternative v14 milestone: OS Keychain Spike

```text
Create a research spike for optional OS keychain integration.

Deliverables:
- docs/research/OS_KEYCHAIN.md
- Compare macOS Keychain, Windows Credential Manager, Linux Secret Service/libsecret.
- Recommend a Python library or adapter approach.
- Do not change production storage yet unless the approach is low-risk and well-tested.
```
