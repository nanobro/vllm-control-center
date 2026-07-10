# v23.5 Agent Prompt — Final UX Consistency & Copy Reduction

You are continuing vLLM Control Center after v23.5.

Current version: v23.5 beta RC.

Positioning remains:
- LM Studio UX + vLLM power + remote GPU ops.
- Not a generic chat UI.
- Daily user flow: select model -> load -> quick test -> copy OpenAI-compatible `/v1` endpoint.

v23.5 changed the tone and IA:
- Sidebar disclosure is now **Support tools**, not Advanced tools.
- Release entry is **Release Kit**, not Beta Release Kit.
- Live UI should avoid stale milestone labels like `v22 beta quick start`, `v23.1 simple run`, and `v22.4 recovery helper`.
- Use product/task labels instead: Daily flow, Setup check, Recovery helper, Support tools.
- Keep advanced/operator details available, but behind disclosures.

Next recommended work:
- v23.6 RC Bug Bash / Public Release Packaging.
- Do not add large new UI surfaces.
- Run fresh-install and upgrade smoke tests.
- Verify empty/loading/running/failed/remote-disconnected states.
- Capture README screenshots with safe demo data.
- Tighten bug-report and release packaging docs.
