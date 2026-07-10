# v23.7 Agent Prompt — First-Run Language & Empty-State Polish

You are working on vLLM Control Center v23.7.

Product direction:
- LM Studio UX + vLLM power + remote GPU ops.
- Keep the app easy, not dense.
- The live UI should not feel like a version-history archive.

Scope:
- Reduce visible milestone/version wording.
- Improve empty states so each page suggests one or two obvious next actions.
- Keep advanced/operator concepts behind disclosures.
- Preserve all existing functionality.

Do not:
- Add new top-level pages.
- Add another setup dashboard.
- Add more primary nav items.
- Re-expand Release Kit into an RC cockpit.

Manual QA:
- No local models.
- One local model detected.
- One running model.
- Remote empty.
- Setup Doctor with missing vLLM.
