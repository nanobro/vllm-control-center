# v0.52 Agent Prompt — Manual Copy Fallback Preview Pass

Continue development of the open-source vLLM Control Center project. Use v0.51 as the base and produce v0.52.

Product constraints:
- Daily mode remains Pick → Start → Test → Copy OpenAI base URL.
- Do not add dashboard clutter.
- Keep Electron preview-only and beta web-first.
- Continue public beta numbering as v0.52, then v0.53.
- Do not return to v24.x, v25.0, or v26.x naming.
- Qwen3.6 and large Qwen text-generation models must remain runnable; do not block by size alone.

v0.52 focus:
- When clipboard copy fails even after fallback, show the exact handoff payload in a selectable manual-copy panel.
- Support local and remote handoff surfaces.
- Keep the panel hidden on the happy path.
- Keep all copy/snippet handoff gated by Quick test success for the exact selected run.

Return final package:
`vllm-control-center-starter-v0.52.zip`
