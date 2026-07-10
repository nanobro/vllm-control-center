# v0.32 Agent Prompt — Real Crash Diagnosis & Runnable Model Confidence

Continue development of the open-source vLLM Control Center project.

This is an LM Studio-style UI for vLLM:

- goal: LM Studio UX + vLLM power + remote GPU ops
- target user flow: Pick model -> Start -> Test -> Copy OpenAI base URL
- public version scheme uses v0.x
- current package for this pass: v0.32

Important product rules:

- Keep Daily mode simple.
- Do not add more dashboard clutter.
- Avoid operator-heavy wording in the main path.
- Keep Electron preview-only.
- Keep beta web-first.
- Continue versions as v0.32, v0.33, etc.
- Do not go back to v24.x, v25.0, or v26.x naming.
- Qwen3.6 and large Qwen text-generation models should remain runnable.
- Do not block a model just because it is large.
- Size alone is not incompatibility.
- Focus on load/crash diagnosis and making failures understandable.

v0.32 goal:

- Separate common vLLM failure types:
  - port already used
  - vLLM not installed / wrong env
  - unsupported architecture
  - missing tokenizer/config
  - bad Hugging Face snapshot path
  - insufficient GPU memory
  - wrong model type like image/audio/diffusion
  - unknown vLLM crash
- Show a plain-English reason beside CRASHED / failed load.
- Add clear next actions:
  - retry on another port
  - open logs
  - use safer settings / low VRAM preset
  - pick another model
- Keep exact paths/log details available in drawer/details, not noisy in main rows.
- Keep Run Model picker scrollable.

Required verification:

- scripts/check.sh
- frontend build
- backend tests
- backend lint
- version scheme check
- release freeze check
- bug-bash check
- screenshot check
- smoke check
- launch check
- desktop shell check

Package as `vllm-control-center-starter-v0.32.zip` after removing node_modules, dist, virtualenvs, caches, local DBs, and egg-info.
