# v20.1 Agent Prompts

Use v20.1 only. Do not use older zips.

## Next milestone: v20.2 Local Model Metadata Polish

Inspect the repo first. Do not rewrite it from scratch.

Preserve:
- FastAPI controller + React/Vite frontend
- Server page as the core UX
- Model Hub + Local Models + Load/Unload terminology
- safe subprocess execution; never use shell=True
- controller auth and secret handling

Implement local model metadata polishing:

Backend:
1. Improve local model scanning.
2. Read `config.json` from HF snapshots when present.
3. Detect format: safetensors, GGUF, MLX, PyTorch bin.
4. Detect quantization from filenames and config where possible.
5. Add fields to LocalModelRecord:
   - format
   - quantization
   - architecture
   - context_length
   - file_count
   - variant_count
6. Add tests with fake local model directories.

Frontend:
1. Show format/quant/arch/context in Local Models.
2. Improve model inspector panel.
3. Add warning when a local path is missing.
4. Keep Load/Unload language.

Quality:
- Run backend tests, backend lint, frontend build, desktop check.
- Update CHANGELOG and docs/dev tracking.
