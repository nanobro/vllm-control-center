# v23.10 Agent Prompt — Daily Mode Persistence & Escape Hatch

You are continuing vLLM Control Center from v23.10.

Current product direction:
- LM Studio-style UX for vLLM.
- Default flow must stay simple: choose model → load → quick test → copy `/v1` endpoint.
- Do not add new top-level tabs unless absolutely necessary.
- Keep advanced/operator concepts out of Daily mode.

v23.10 added:
- persistent Daily / Advanced mode via localStorage
- a quiet **Back to Daily mode** action
- tighter sidebar mode copy
- Help & support stays hidden unless Advanced mode is enabled or a support page is opened

Recommended next work:
- visual density QA pass on screenshots
- reduce card count further if Run Model, Models, Remote, or Settings still feel busy
- polish mobile/narrow viewport layout
- test real first-run path on a clean browser profile

Avoid:
- reintroducing version/milestone names into live UI
- adding more explanatory cards
- expanding the sidebar
- exposing raw vLLM flags in Daily mode
