# v22.2 Agent Prompt — Release Page / Screenshots / Demo Data

You are continuing vLLM Control Center from v22.1.

## Context

The app is an open-source LM Studio-style UI for vLLM:

```text
LM Studio UX + vLLM power + remote GPU ops
```

It is not a generic chat UI.

## v22.2 goal

Add release-readiness polish so the public beta is easier to explain and demo.

Focus on:

- screenshot plan
- demo states
- GitHub release story
- beta release checklist
- README clarity

Do not add more heavy operator concepts to the primary user flow.

## Required UX outcome

Keep primary navigation simple:

- Run Model
- Models
- Remote
- Settings

Add release/demo tools under Advanced tools only.

## Implementation guidance

- Add a maintainer-facing Beta Release Kit page.
- It should read app state and suggest screenshot/demo readiness.
- It should be safe: no creating, deleting, downloading, starting, or stopping from this page.
- Use plain language.
- Emphasize the core workflow: detect/download -> load -> test -> copy endpoint.
- Keep secrets hidden.

## QA

Run:

```bash
./scripts/check.sh
```

Manual check:

- Open Run Model.
- Open Advanced tools -> Beta Release Kit.
- Verify empty-state and loaded-state rendering.
- Copy release notes.
- Confirm no secrets are visible.
