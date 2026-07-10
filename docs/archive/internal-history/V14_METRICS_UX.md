# v14 — Metrics UX

v14 improves the operator dashboard for local vLLM instances while keeping the project focused on the original goal: an LM Studio-style control plane for vLLM, not another generic chat UI.

## Added

- Metrics snapshot persistence in SQLite.
- `GET /api/instances/{instance_id}/metrics/history` for lightweight local history.
- Average latency fields derived from vLLM histogram sum/count values.
- Prompt and generation token throughput rates derived from consecutive snapshots.
- Alert cards for:
  - metrics endpoint unavailable
  - high KV cache pressure
  - waiting requests
  - GPU VRAM pressure
  - high GPU temperature
- GPU VRAM percentage normalization.
- Simple SVG history charts in the frontend.
- GPU pressure bars.

## Non-goals

v14 intentionally does not add a full observability stack. Prometheus/Grafana/Perses remain future integrations. The built-in metrics page is meant to be a human-friendly local cockpit for quick operational decisions.

## Manual test flow

1. Start the controller and frontend.
2. Start a vLLM instance.
3. Open Metrics.
4. Confirm the selected running instance appears.
5. Wait for multiple refresh cycles.
6. Confirm cards show current values and charts populate when enough samples exist.
7. Stop or break the vLLM `/metrics` endpoint and confirm the unavailable alert appears.

## Notes

Token throughput rates require at least two snapshots and reset to blank if counters reset or the instance restarts.
