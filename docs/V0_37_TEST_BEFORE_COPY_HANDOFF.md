# v0.37 — Test-before-Copy Handoff Pass

v0.37 is a focused beta fix for the final local endpoint handoff step.

The Daily flow remains:

```text
Pick model -> Start -> Test -> Copy OpenAI base URL
```

## Problem

After v0.33-v0.36, local serving is much more honest about warming up, crashes, and low-VRAM retries. One remaining tester confusion was that a local endpoint could be visible and copyable as soon as an instance reached `running`, even before the user had proven that `/v1/chat/completions` worked for the selected model.

That made the UI feel slightly out of order compared with the promised flow: users could copy before testing.

## Fix

- The selected local endpoint stays visible when the instance is running.
- Copy `/v1` base URL and SDK snippets are disabled until Quick test passes.
- The main running panel says **Test first to copy** before the test.
- Quick-test success unlocks copy for that selected running instance.
- Switching model or instance resets test/copy state.
- Developer handoff details remain available, but they no longer encourage copying an untested endpoint.

## Non-goals

- Do not add a new dashboard card.
- Do not add more operator-heavy vLLM wording to Daily mode.
- Do not block Qwen3.6 or large Qwen text-generation models by size.
- Do not change Remote endpoint rules from v0.35.
- Do not promise Electron as anything more than preview-only.

## Verification focus

- Run Model shows Pick -> Start -> Test -> Copy in that order.
- Copy buttons are disabled before Quick test passes.
- Quick-test success unlocks base URL and SDK copy actions.
- Changing the selected model/instance resets test and copy state.
- Large text-generation models remain eligible for load attempts.
