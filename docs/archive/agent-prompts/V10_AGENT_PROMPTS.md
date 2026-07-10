# v10 Agent Prompts

Use v10 as the baseline. Do not rewrite from scratch.

## Next recommended milestone: Advisor Accuracy and UX

```text
Inspect this repository first. Continue from v10.

Product direction:
- This is an LM Studio-style control plane for vLLM.
- It is open-source and should remain contributor-friendly.
- Preserve FastAPI + React/Vite architecture.
- Preserve safe subprocess execution. Never use shell=True.

Milestone:
Improve Model Compatibility Advisor accuracy and UX.

Backend:
1. Add optional architecture presets for common model families:
   - Qwen
   - Llama
   - Mistral/Mixtral
   - DeepSeek
2. Add cache dtype option if supported by the estimator.
3. Add batch/concurrency notes.
4. Add endpoint to estimate from an existing model registry record.
5. Add tests for family inference and edge cases.

Frontend:
1. Add architecture preset selector.
2. Add "Use detected GPU" button for each detected GPU.
3. Add stronger visual treatment for likely/borderline/unlikely.
4. Add copyable recommended vLLM settings.
5. Add direct "Create recipe and open Recipes" action.

Quality:
- Run pytest.
- Run frontend build.
- Update docs if behavior changes.
- Summarize changed files and manual test steps.
```

## Alternative milestone: Local Installer Polish

```text
Add first-run install guidance for vLLM, CUDA checks, and Docker mode docs. Keep it additive and tested.
```
