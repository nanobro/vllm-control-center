# v3 Agent Prompts

Use these after giving the agent `vllm-control-center-starter-v3.zip`.

## Agent Prompt 1: Remote Controller Profiles

```text
You are extending vLLM Control Center v3.

Inspect the repo first. Do not rewrite it from scratch.

Task: implement Remote Controller Profiles.

Backend:
- Add settings table helpers if needed.
- Add controller profile schema:
  - id
  - name
  - base_url
  - api_key optional
  - kind: local | remote | ssh_tunnel
  - created_at/updated_at
- Add CRUD routes under /api/controller-profiles.
- Add API key middleware support for controller access, but keep local dev easy.
- Add docs explaining safe remote mode.

Frontend:
- Add Settings page UI for controller profiles.
- Let user add/edit/delete profiles.
- Let user set the active controller profile in localStorage.
- Do not break existing API client; keep default localhost behavior.

Quality:
- Add backend tests.
- Run pytest.
- Run npm build.
```

## Agent Prompt 2: Model Download Queue

```text
You are extending vLLM Control Center v3.

Task: implement Hugging Face model download queue.

Backend:
- Add download jobs table.
- Add /api/models/{id}/download endpoint.
- Use huggingface_hub if available; otherwise return a clear setup error.
- Stream job logs/progress via SSE.
- Never log HF_TOKEN.
- Track status: queued | running | complete | failed | cancelled.

Frontend:
- Add Download button to Model Registry.
- Show progress/status/logs.
- Add HF token setting placeholder, but do not expose token after save.

Quality:
- Mock download behavior in tests.
- Do not require real HF network in tests.
```

## Agent Prompt 3: Playground Sessions

```text
You are extending vLLM Control Center v3.

Task: connect Playground to Chat History.

Backend:
- Ensure non-streaming and streaming playground can persist messages into a chosen session_id.
- Avoid duplicating system messages every turn if possible.
- Add tests for chat persistence.

Frontend:
- Add session selector in Playground.
- Add "Create new session" button.
- Save user and assistant messages after a run.
- Add "Continue from session" behavior that loads previous messages.

Quality:
- Keep streaming output responsive.
- Preserve raw JSON panel for non-streaming mode.
```

## Agent Prompt 4: Better Metrics Charts

```text
You are extending vLLM Control Center v3.

Task: turn metrics into a real dashboard.

Backend:
- Store metrics snapshots periodically or on each fetch.
- Add /api/instances/{id}/metrics/history.
- Compute prompt tokens/sec and generation tokens/sec from counter deltas.
- Include latency averages from sum/count metrics.

Frontend:
- Add line charts for KV cache, requests running/waiting, tokens/sec, latency.
- Use Recharts or plain SVG.
- Handle metrics unavailable states cleanly.

Quality:
- Add parser/rate tests.
- UI must not crash when vLLM /metrics is unavailable.
```
