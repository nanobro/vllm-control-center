# v0.55 Agent Prompt — Long Model ID Overflow Polish Pass

Use the v0.54 package as base and produce v0.55.

Goal:

- Improve readability confidence without adding dashboard clutter.
- Keep long Hugging Face IDs, served model names, snapshot filenames, quantization labels, and local paths from stretching or breaking the main UI.
- Keep full exact values in drawers, details, titles/tooltips, or copy/manual-copy areas.

Rules:

- Continue public beta versioning as v0.55, next v0.56.
- Keep Daily mode simple: Pick model -> Start -> Test -> Copy OpenAI base URL.
- Keep exact paths/log details in drawer/details/manual-copy fallback.
- Keep copy/snippets gated by Quick test success for the exact selected run.
- Do not block Qwen3.6 or large Qwen text-generation models because of size alone.
- Keep Electron preview-only and beta web-first.

Return `vllm-control-center-starter-v0.55.zip`.
