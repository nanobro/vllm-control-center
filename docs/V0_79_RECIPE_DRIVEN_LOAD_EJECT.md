# v0.79 — Recipe-driven Load / Eject

v0.79 changes the default Daily workflow from a generic vLLM argument form into a one-click runtime recipe.

## First integration target

- Model: `unsloth/Qwen3.6-35B-A3B-NVFP4-Fast`
- Hardware target: one NVIDIA DGX Spark / GB10
- Evidence baseline: vLLM 0.24.x with CUDA 13 compatible PyTorch
- Startup deadline: 10 minutes
- Automatic warm-up: 3 requests
- Speculative decoding: checkpoint-native MTP, `k=3`

The controller applies the recipe as one unit:

- `VLLM_USE_DEEP_GEMM=0`
- `CUTE_DSL_ARCH=sm_121a`
- `TORCHINDUCTOR_COMPILE_THREADS=2`
- `MAX_JOBS=4`
- FlashInfer B12x MoE backend (`--moe-backend flashinfer_b12x`)
- 262,144-token model context
- 4 GiB deterministic KV cache
- 0.85 GPU memory utilization
- 4 maximum sequences
- 8,192 maximum batched tokens

## Daily-mode contract

Daily mode shows only the model reference, port, runtime/checkpoint readiness, current status, **Load model**, **Eject**, logs, and the resulting OpenAI-compatible `/v1` endpoint.

Advanced mode keeps the existing general-purpose Server page for manual arguments and non-recipe models.

## Eject safety

Eject terminates the owned process group, waits for shutdown, escalates to `SIGKILL` only when needed, clears the run record, and does not delete checkpoint files.

## Honest compatibility boundary

The app warns rather than silently changing the installed runtime when the detected vLLM, architecture, or GPU differs from the measured recipe. In particular, vLLM 0.25.x remains an attempted-but-unverified combination until a real DGX Spark run produces fresh evidence.

The SM121a architecture and FlashInfer B12x MoE settings follow the current Hugging Face model-card guidance for this exact checkpoint. vLLM 0.25.1 exposes `flashinfer_b12x` in its extended serve help on the target DGX, but end-to-end compatibility remains gated on the real-hardware lifecycle above.

This implementation was not run on a DGX Spark during development. GitHub CI validates software contracts only; real-hardware load, warm-up, endpoint test, and memory release remain the release gate.
