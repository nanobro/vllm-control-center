# v21.6 Agent Prompt — Navigation Simplification

You are working on vLLM Control Center v21.6.

Positioning: LM Studio UX + vLLM power + remote GPU ops. Not a generic chat UI.

Goal: reduce navigation and cognitive load.

The app should now feel like:

- Run Model: guided choose -> load -> test -> copy endpoint
- Models: unified library for local models, download jobs, scan paths, and loaded status
- Remote: remote GPU/controller operations
- Settings: controller/security settings

Do not add new top-level tabs unless absolutely necessary.

Important UX principles:

- Users should not need to understand the difference between This Device, Local Models, and Downloads.
- Show simple labels: Ready, Running, Downloading, Failed, Queued, Downloaded.
- Keep advanced vLLM concepts in Advanced tools or detail drawers.
- Prefer one shared action surface over duplicate pages.

QA focus:

1. Primary nav is compact.
2. Models page combines local models and downloads.
3. Detail drawer works for local models and download jobs.
4. Load/Unload/Cancel/Retry actions still work.
5. Run Model still remains the fastest path to a working `/v1` endpoint.
