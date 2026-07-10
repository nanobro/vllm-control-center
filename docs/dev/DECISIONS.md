# Development Decisions

Use this file to keep architecture decisions stable across human contributors and AI coding agents.

## ADR-001: Use FastAPI controller + React/Vite frontend

**Status:** Accepted

**Decision:** The project uses a Python FastAPI controller and a React/Vite TypeScript frontend.

**Reasoning:**

- vLLM is Python-first.
- FastAPI is easy to run locally and remotely.
- React/Vite keeps the frontend lightweight for a web-first starter.
- Desktop packaging can wrap the same local controller later.

**Consequences:**

- The controller is the source of truth for process management.
- The frontend must not spawn vLLM directly.
- API contracts should stay stable and typed as the project grows.

## ADR-002: Never use `shell=True` for process launch

**Status:** Accepted

**Decision:** All process execution must use argv arrays, not shell strings.

**Reasoning:**

- Users provide model IDs, paths, ports, and extra args.
- The app starts system processes.
- Shell interpolation would create unnecessary injection risk.

**Rule:**

- Use `asyncio.create_subprocess_exec` or equivalent safe argv APIs.
- Do not use `shell=True`.
- Extra args must be parsed and validated as a list of arguments.

## ADR-003: Web-first before desktop shell

**Status:** Accepted

**Decision:** The starter is a web app plus controller first. Electron/Tauri comes later.

**Reasoning:**

- Core workflows must be stable before packaging.
- Web-first is easier for AI coding agents and human contributors.
- Remote controller workflows naturally fit an HTTP controller model.

**Consequences:**

- Desktop-specific concerns are deferred.
- The controller must be safe and well documented before public remote deployment.

## ADR-004: Remote is first-class, not a plugin

**Status:** Accepted

**Decision:** The local UI always talks to a controller. That controller may manage local vLLM instances or bridge to remote controllers.

**Reasoning:**

- vLLM is often run on Linux GPU servers, not laptops.
- The strongest differentiation is laptop UI -> remote GPU workstation control.

**Consequences:**

- APIs should avoid assuming local-only state.
- Remote controller profiles must stay secure and explicit.
- Remote forwarding must not become a general-purpose proxy.

## ADR-005: SQLite is acceptable for starter local state

**Status:** Accepted for starter phase

**Decision:** SQLite stores local application state for models, recipes, instances, downloads, chat history, and remote profiles.

**Reasoning:**

- Local-first workflow.
- No external database setup.
- Easy tests and packaging.

**Consequences:**

- SQLite DB files should be treated as sensitive.
- Secret handling needs improvement before broad remote deployment.
- Future versions may move secrets into OS keychain or a dedicated secret provider.

## ADR-006: Keep vLLM as the engine

**Status:** Accepted

**Decision:** The project launches, configures, proxies, observes, and exports vLLM workflows. It does not implement model inference.

**Reasoning:**

- vLLM is the core inference engine.
- The project’s value is operator/developer UX.

**Consequences:**

- Avoid duplicating vLLM internals.
- Prefer wrapping official vLLM CLI/API/metrics when possible.
- Keep compatibility with OpenAI-compatible clients.

## ADR-007: Controller auth is optional but first-class

Status: Accepted

Decision:
- The controller remains local-first and does not require auth unless `VCC_CONTROLLER_API_KEY` is configured.
- When configured, `/api/*` is protected except `/api/health`.
- Bearer token and `X-VCC-API-Key` headers are accepted.
- SSE endpoints may accept `?api_key=` because browser EventSource cannot set headers.

Reason:
- Local development should remain simple.
- LAN/remote controller use needs a clear auth path before open-source launch.

Consequences:
- Query-token auth must be documented as localhost/HTTPS-only.
- A future milestone should move remote secrets into the `secrets` table and eventually OS keychain support.


## ADR-008: Store remote profile API keys in the secrets table

Status: Accepted

Decision:
- Remote controller profile API keys are stored under deterministic keys in the local `secrets` table.
- Public remote profile rows and API responses expose only `api_key_configured`.
- The legacy `remote_controller_profiles.api_key` column remains only for backward compatibility and migration.
- `init_db()` migrates legacy plaintext values into `secrets` and clears the legacy column.

Reason:
- Remote profile records are normal domain state and are frequently listed/returned.
- Separating secrets reduces accidental exposure in API responses, logs, exports, and future UI surfaces.
- A deterministic key lets profile delete/update flows reliably clear or rotate the associated secret.

Consequences:
- The SQLite database still contains sensitive data and must be protected.
- Future work can swap the secret helper implementation for OS keychain or another provider without changing public remote profile APIs.
- Tests must cover create, update, clear, delete cleanup, and legacy migration.

## ADR-009: Compatibility Advisor is a heuristic guardrail

Status: Accepted

Decision:
- The Compatibility Advisor estimates model fit with transparent heuristics, not guaranteed runtime predictions.
- Architecture presets provide useful defaults for common families, but users can manually override hidden size, layers, attention heads, KV heads, and head dimension.
- The API must return assumptions and warnings alongside verdicts.

Reason:
- Exact memory behavior depends on the real model config, quantization backend, scheduler/runtime settings, GPU stack, and vLLM version.
- A pre-launch warning system is still valuable if it helps users avoid obvious OOM cases and choose safer settings.

Consequences:
- UI copy must avoid overpromising.
- New architecture presets should include tests and explanatory notes.
- Future work may pull model config metadata directly from Hugging Face/local config files for higher accuracy.

## ADR-010: Keep SQLite active while preparing OS keychain adapter

Status: Accepted for v15

Decision:
- v15 adds keyring availability detection and a prototype keyring adapter boundary.
- SQLite remains the active secret backend for production reads/writes in this starter.
- `VCC_SECRET_BACKEND=keyring` is treated as research/status reporting, not an activation switch yet.

Reason:
- OS keychain behavior differs across macOS, Windows, desktop Linux, headless Linux, CI, SSH sessions, and packaged desktop apps.
- A premature migration could make remote/headless controller deployments brittle.
- The adapter boundary lets future work test fake keyring behavior without changing public APIs.

Consequences:
- The local SQLite database still must be treated as sensitive.
- A future milestone must define fallback behavior before activating keyring-backed secret storage.
- Public API responses must continue to return secret status only, never raw secret values.

## ADR-020: Load/Unload is a model lifecycle, not raw instance management

Status: Accepted

Decision:
- User-facing UI should say Load, Unload, and Eject.
- Load should reuse an existing running instance first.
- Load should reuse and update a stopped/crashed matching instance before creating a new one.
- Creating duplicate instances for the same model must be explicit via `force_new`.

Reason:
LM Studio users think in terms of loaded models, not internal instance rows. Reusing existing instances avoids surprising duplicate vLLM servers and port conflicts while keeping the underlying process model intact.

Consequences:
- Instance admin pages remain available under Advanced tools.
- Server and Local Models pages should hide most instance details unless they help explain state.
- Unload stops a server instance but keeps model files and instance state.
- Eject removes stopped instance state/logs/metrics but keeps model files.
