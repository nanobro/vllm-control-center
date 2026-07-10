# v12 Agent Prompts

## Current baseline

Continue from **v12** of vLLM Control Center.

Product direction:

- LM Studio-style control plane for vLLM.
- Not another generic chat UI.
- FastAPI controller + React/Vite frontend.
- vLLM remains the inference engine.
- Local/remote GPU ops remain the main differentiator.

## Completed in v12

Remote controller API keys were moved out of `remote_controller_profiles.api_key` and into the local `secrets` table. Public responses expose only `api_key_configured`. Legacy keys are migrated and cleared during `init_db()`.

## Non-negotiable rules

- Do not rewrite the project from scratch.
- Never use `shell=True`.
- Do not expose raw secret values in public API responses.
- Keep remote forwarding limited to safe `/api/...` paths.
- Add backend tests for new behavior.
- Run `./scripts/check.sh` before claiming completion.
- Update `CHANGELOG.md` and `docs/dev/PROJECT_STATUS.md` for completed milestones.

## Recommended next milestone option A: Advisor Accuracy and UX

Implement focused improvements to the Model Compatibility Advisor.

Backend requirements:

1. Add architecture presets for common model families:
   - Qwen
   - Llama
   - Mistral
   - Mixtral
   - DeepSeek
2. Allow estimates from an existing Model Registry record.
3. Add cache dtype option where useful.
4. Return clearer `recommended_settings` fields suitable for copy/create recipe.
5. Add tests for architecture preset selection and registry-based estimates.

Frontend requirements:

1. Add a better verdict card.
2. Add "Use detected GPU" action if doctor GPU data is available.
3. Add "Copy recommended settings".
4. Make "Create recipe" show a clear success and next step.

## Recommended next milestone option B: Metrics UX

Improve operator visibility without turning the project into Grafana.

Backend requirements:

1. Improve metrics history endpoint behavior.
2. Add derived status warnings for high KV cache, waiting requests, and latency spikes.
3. Add tests for derived warnings.

Frontend requirements:

1. Add clearer metric cards.
2. Add alert banners.
3. Add simple history charts for tokens/sec, KV cache, latency, and request queue.
4. Keep UI useful when `/metrics` is unavailable.

## Recommended next milestone option C: OS Keychain Research Spike

Do not implement full keychain support yet. Produce a docs/dev research note comparing:

- Python `keyring`
- macOS Keychain
- Windows Credential Manager
- Linux Secret Service
- encrypted local file fallback

Include recommendation, tradeoffs, and migration impact.
