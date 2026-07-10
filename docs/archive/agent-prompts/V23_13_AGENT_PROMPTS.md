# v23.13 Agent Prompt — UX Audit & Dead-Surface Removal

You are continuing vLLM Control Center after v23.13.

Positioning remains: LM Studio UX + vLLM power + remote GPU ops. This is not a generic chat UI.

v23.13 performed a cleanup audit:

- Live UI labels should avoid historical version/milestone wording.
- Daily mode should stay focused on Run Model, Models, Remote, and Settings.
- Help/support/release/debug tools belong in Advanced mode.
- Do not add another onboarding/helper/status card to Run Model unless it replaces an existing card.
- Prefer fewer surfaces with clearer actions over more diagnostics.

Recommended next step: v24.0 Public Beta Freeze, unless real screenshot QA finds a specific usability issue.

Acceptance criteria for future changes:

1. A new user can understand the first action in under five seconds.
2. A loaded model clearly exposes quick test and `/v1` endpoint copy.
3. Advanced concepts stay hidden unless the user asks for them.
4. No stale v20/v21/v22/v23 milestone labels appear in live UI.
