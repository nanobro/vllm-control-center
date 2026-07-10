# vLLM Control Center Backlog

## P0 - Make the starter usable

### 1. Streaming playground
- Add SSE or fetch streaming support for `/api/playground/chat/stream`.
- Parse OpenAI-compatible streaming chunks.
- Show token deltas in the UI.
- Acceptance: user sees tokens while vLLM is generating.

### 2. Real-time logs
- Current API supports tail logs; add SSE streaming endpoint.
- Frontend should subscribe and append lines without polling.
- Acceptance: logs update while model starts.

### 3. Metrics history
- Store snapshots in SQLite every N seconds while instance is running.
- Add history endpoint.
- Add line charts for KV cache, tokens/sec, latency.
- Acceptance: dashboard shows trend over time.

### 4. Better error explainer
- Detect CUDA OOM, port conflict, HF auth, gated model, trust remote code, missing vLLM.
- Convert raw log lines into friendly recommendations.
- Acceptance: common failures display actionable fixes.

### 5. Remote controller mode
- Add controller API key.
- Add Settings page for remote controller base URL.
- Add warning if controller binds `0.0.0.0` without API key.
- Acceptance: laptop frontend can control a GPU server controller.

## P1 - Developer polish

### 6. Recipes
- Persist named runtime configs.
- Duplicate, export, run recipe.
- Seed presets: Local Dev, LAN Server, Coding Agent, Long Context, Max Throughput.

### 7. Model registry
- Add models by Hugging Face ID or local path.
- Store notes/tags/context/dtype hints.
- Later: probe Hugging Face metadata.

### 8. Docker mode
- Let user choose subprocess or Docker runtime.
- Start/stop Docker container.
- Show container logs.

### 9. Open WebUI helper
- Generate Open WebUI base URL/API key/model instructions.
- Optionally test the connection.

### 10. Desktop shell
- Wrap frontend/controller in Electron or Tauri.
- Start controller automatically.
- Tray menu: Open UI, Stop all, Quit.

## P2 - Serious ops

### 11. Multi-instance dashboard
- Multiple vLLM servers on different ports.
- Filter by local/remote/running/crashed.

### 12. Benchmark runner
- Wrap `vllm bench`.
- Store benchmark results.
- Compare recipes.

### 13. Security hardening
- CORS allowlist.
- Redact secrets everywhere.
- Safer process ownership checks.
- Path validation for local models.

### 14. Versioned vLLM args schema
- Track vLLM CLI changes by version.
- Hide unsupported flags depending on detected vLLM version.
