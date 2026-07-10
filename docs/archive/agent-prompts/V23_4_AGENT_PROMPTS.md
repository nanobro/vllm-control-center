# v23.4 Agent Prompt — Settings & Advanced Tools Simplification

You are working on vLLM Control Center v23.4.

Positioning:
LM Studio UX + vLLM power + remote GPU ops.
Not a generic chat UI and not an ops dashboard by default.

Recent simplification passes:
- v23.1 simplified Run Model
- v23.2 simplified Models
- v23.3 simplified Remote

v23.4 goal:
Simplify Settings and Advanced Tools.

Rules:
- Do not remove advanced capabilities.
- Do hide advanced pages behind a More tools hub.
- Keep primary nav focused on Run Model, Models, Remote, Settings.
- Settings should feel like a simple local connection page.
- Secret storage and security internals must remain accessible but not visually dominant.

Acceptance:
- Sidebar advanced list is short.
- More tools provides grouped access to existing advanced surfaces.
- Settings has one obvious API key task and a compact security summary.
- No secret values are exposed.
