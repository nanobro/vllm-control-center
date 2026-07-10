# v18 — Server Page Polish / Model Hub Integration

v18 makes the primary UX closer to LM Studio's Developer/Local Server view.

Before v18, the project already had the building blocks:

- Model Hub catalog
- Downloads
- Model registry
- Instances
- Logs
- Metrics
- Playground
- Exports

The problem was that users still had to jump across multiple pages to complete the most important flow.

v18 adds a dedicated **Server** page that brings the flow together:

```text
select model -> register/download/create instance -> start/stop server -> copy endpoint -> inspect model -> watch logs -> open playground/metrics
```

## Added

Frontend:

- `frontend/src/pages/ServerPage.tsx`
- Server page navigation promoted to the first item
- LM Studio-style selected model picker
- server status pill
- Start/Stop primary action
- Register / Download / Create Instance / Create + Start actions
- endpoint card with supported OpenAI-compatible endpoints
- live logs panel using existing SSE log stream
- model inspector side panel
- command preview side panel
- compact operator metrics snapshot
- quick links to full Logs, Metrics, and Playground pages

Styles:

- server layout
- endpoint rows
- model inspector
- log panel
- status pills
- responsive layout

No backend route changes were required; v18 intentionally reuses the existing stable APIs.

## Why this matters

The original product direction was not “another chat UI.” It was:

```text
LM Studio UX + vLLM power + remote GPU ops
```

v17 added Model Hub, but v18 makes the everyday server workflow visible and obvious.

## Verification

```text
Backend tests: 57 passed
Backend lint: passed
Frontend build: passed
Desktop shell check: passed
```

## Next recommended milestone

v19 should focus on one of these:

1. **Server Page Real-World Polish** — remember selected model/instance, add eject/delete instance, richer inline playground, better port conflict warnings.
2. **Controller Lifecycle Prototype** — start/stop local controller helper, PID/log handling under `.vcc-runtime/`, still keep Electron auto-start disabled by default.
3. **Remote Server Page** — same Server UX, but targeting remote DGX/controller profiles.

Recommended next: **v18.1 audit pass**, then **v19 Server Page Real-World Polish** if the installed DGX test shows UX gaps.
