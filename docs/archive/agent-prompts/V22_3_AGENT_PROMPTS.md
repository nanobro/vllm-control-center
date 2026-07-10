# v22.3 Agent Prompt — Real Model Compatibility Pass

You are working on vLLM Control Center, an open-source LM Studio-style UI for vLLM.

Current version: v22.3.

Positioning:
- LM Studio UX + vLLM power + remote GPU ops.
- Not a generic chat UI.
- Keep advanced/operator complexity hidden until needed.

Recently completed:
- v21.4 Model Detail Drawer
- v21.5 One-Click Run Flow
- v21.6 Unified Models library
- v21.7 Human vLLM presets
- v21.8 Remote GPU polish
- v22.0 Public beta polish
- v22.1 First-Run Setup Doctor
- v22.2 Beta Release Kit / screenshots / demo data
- v22.3 Real model compatibility pass

v22.3 details:
- Local scanner detects Safetensors, PyTorch bin, GGUF, AWQ, GPTQ, bitsandbytes hints, FP16/BF16/FP32 dtype hints, tokenizer/config presence, context length, weight file count, and multi-file shards.
- Local model records include simple compatibility fields: ready, likely, limited, attention, or unknown.
- Models library and Model Detail Drawer show plain-English compatibility chips and reasons.
- Run Model recommendations slightly prefer vLLM-ready local models.

Important UX rule:
Do not turn this into a dense compatibility database UI. The main path should still be: choose model -> load -> test -> copy endpoint.

Recommended next milestone:
v22.4 — Error Recovery UX.

Goal for v22.4:
Turn common vLLM failures into human recovery cards:
- out of memory
- port already in use
- missing tokenizer/config
- unsupported quantization/format
- bad model path
- missing trust_remote_code
- Hugging Face auth/gated repo
- CUDA/NVIDIA visibility issue

Keep it actionable with simple buttons: lower context, switch preset, copy logs, open setup doctor, choose another variant, or change port.
