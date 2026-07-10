# v23.9 Agent Prompt — First Launch Onboarding Trim

Continue from v23.9 only.

Positioning remains:
LM Studio UX + vLLM power + remote GPU ops.
Not a generic chat UI.

v23.9 focused on reducing first-launch duplication:
- one first-launch welcome card on Run Model
- one recommended next action
- setup details hidden unless needed
- no repeated setup/helper cards during the empty state

Important UX rule:
Do not add another onboarding card, checklist, wizard, or mode unless it replaces something else.

Recommended next work:
v23.10 — visual density audit / screenshot QA.
Use the old noisy screenshot as the anti-pattern. Capture or inspect the simplified pages and remove remaining repeated chips, headers, labels, and helper text.

Daily path must stay:
choose model → load → quick test → copy `/v1` endpoint.
