# v0.35 Agent Prompt — Remote Endpoint Handoff Guard Pass

Use the v0.34 package as base and produce v0.35.

Rules:

- Use public beta version `v0.35`.
- Bump package metadata to `0.35.0`.
- Next version after this is `v0.36`.
- Do not return to v24.x, v25.0, or v26.x naming.
- Keep Daily mode simple.
- Do not add dashboard clutter.
- Keep Electron preview-only and beta web-first.
- Keep Qwen3.6 and large Qwen text-generation models runnable. Size alone is not incompatibility.

Goal:

Remote should follow the same trusted handoff as local:

```text
Pick selected remote model -> Start -> Test -> Copy OpenAI base URL
```

Fix the remote confusion where a stopped selected model or another running model can make the endpoint handoff look ready.

Required changes:

- Make the selected remote model the source of truth for the visible/copyable `/v1` base URL.
- Disable copy when the selected remote model is not running or the remote controller is disconnected.
- Show a short reason when copy is blocked: choose remote, disconnected, choose model, starting, crashed, or stopped.
- Show Quick test only for the selected ready remote endpoint.
- Reset test/copy state when the selected remote profile, selected model, or status changes.
- If another remote model is running, mention it without silently switching the handoff target.
- Keep logs/GPU health/details in existing secondary areas.

Verification:

- `scripts/check.sh`
- frontend build
- backend tests
- backend lint
- version scheme check
- release freeze check
- bug-bash check
- screenshot check
- smoke check
- launch check
- desktop shell check

Clean package before zipping:

- remove node_modules, dist, virtualenv, __pycache__, .pytest_cache, .ruff_cache, local DBs, egg-info

Return final zip:

`vllm-control-center-starter-v0.35.zip`
