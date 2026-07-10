# v20.8 Agent Prompt

Continue from v20.8 only. Do not rewrite from scratch.

Product priority: make the first successful model load obvious and reliable.

Preserve:
- FastAPI controller + React/Vite frontend.
- Server Simple Mode as the primary UX.
- Advanced cockpit hidden by default.
- Safe subprocess execution; never use shell=True.

Next recommended work:
- Run the first-load flow on a real DGX/local machine.
- Capture screenshots/GIFs for README.
- Fix only friction found in real usage.
- Prefer user language: Load, Unload, Download, Local Models. Avoid exposing instance jargon in the primary flow.

Verification:
- pytest
- ruff check
- npm build
- desktop shell check
