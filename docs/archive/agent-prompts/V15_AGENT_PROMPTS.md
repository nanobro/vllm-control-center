# v15 Agent Prompts

## Next recommended milestone: Desktop Shell Spike or Prometheus/Grafana Export Helper

Use v15 as the baseline. Give agents **v15 only**.

### Standard instruction

```text
Inspect this repository first. Do not rewrite it from scratch.

Continue from v15 of vLLM Control Center.

Product direction:
- This is an LM Studio-style control plane for vLLM.
- It is not another generic chat UI.
- The project is intended to be open source.
- Preserve FastAPI controller + React/Vite frontend architecture.
- Preserve safe subprocess execution. Never use shell=True.
- Preserve controller auth, remote profile security guardrails, and secret storage boundaries.
- Add backend tests for new behavior.
- Run ./scripts/check.sh.
- Summarize changed files and manual test steps.
```

## Option A — Desktop Shell Spike

Goal: evaluate wrapping the existing web/controller app in a desktop shell without changing core architecture.

Requirements:

1. Add `docs/spikes/desktop-shell.md` comparing Electron vs Tauri for this project.
2. Add a minimal shell proof-of-concept folder only if it does not disrupt current dev scripts.
3. Document how the shell would start/stop the local controller.
4. Document keep-alive behavior for running vLLM instances when the app closes.
5. Do not replace the React/Vite app.
6. Do not remove web-first workflows.

## Option B — Prometheus/Grafana Export Helper

Goal: make the metrics layer easier to integrate with production-ish observability.

Requirements:

1. Add export docs for Prometheus scrape config.
2. Add sample Grafana dashboard JSON placeholder or documented mapping.
3. Add endpoint/docs showing which metrics are scraped and normalized.
4. Keep the built-in dashboard simple.
5. Do not build a full observability stack.
```
