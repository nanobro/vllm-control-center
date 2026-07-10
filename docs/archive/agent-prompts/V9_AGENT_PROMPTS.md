# v9 Agent Prompts

Use v9 as the baseline. Do not rewrite the repository from scratch.

## Recommended v10 milestone — Model Compatibility Advisor

Implement a model compatibility advisor that estimates whether a model is likely to run on the available GPU/controller profile.

Backend requirements:

1. Add API route `POST /api/compatibility/estimate`.
2. Input fields:
   - model_id
   - parameter_count_billion optional
   - quantization optional
   - dtype optional
   - max_model_len optional
   - target_gpu_memory_mb optional
   - gpu_count optional
3. Output fields:
   - verdict: `likely_fits`, `borderline`, `unlikely_fits`, `unknown`
   - estimated_model_memory_mb
   - estimated_kv_cache_memory_mb
   - recommended_gpu_memory_utilization
   - suggested_changes
   - warnings
4. Keep estimates conservative and clearly labeled as estimates.
5. Add unit tests for known simple cases.
6. Do not call Hugging Face network APIs in tests.

Frontend requirements:

1. Add Compatibility page.
2. Let user choose registered model or type model ID.
3. Let user choose local GPU or remote profile later; for now allow manual GPU memory input.
4. Show verdict cards and suggested settings.
5. Add a button to create a recipe from suggested settings.

Quality requirements:

- Run `./scripts/check.sh`.
- Preserve safe process execution.
- Preserve existing download queue behavior.
- Update README and ROADMAP.
