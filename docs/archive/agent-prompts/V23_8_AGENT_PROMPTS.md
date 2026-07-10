# v23.8 Agent Prompt — Daily / Advanced Mode Boundary

You are continuing vLLM Control Center after v23.8.

Current state:
- Product is in public beta RC polish.
- Primary daily path is Run Model, Models, Remote, Settings.
- v23.8 added a sidebar Daily / Advanced mode boundary.
- Daily mode hides Help & support by default.
- Advanced mode reveals Setup Doctor, Logs, Release Kit, and More tools.
- Navigating to an advanced/support page automatically enables Advanced mode.

Product direction:
- Keep reducing cognitive load.
- Do not add new top-level tabs unless absolutely necessary.
- Do not expose raw vLLM/operator concepts in Daily mode.
- Treat Run Model as the main product surface.
- Treat Advanced mode as support/debug/release/maintainer space.

Recommended next work:
- v23.9 should likely be a final manual smoke-test / screenshot QA pass.
- Verify the simplified navigation against the old screenshot problem: no repeated quick-start cards, no duplicate server surfaces, no stacked guidance.
- Fix small copy/layout bugs rather than adding features.
