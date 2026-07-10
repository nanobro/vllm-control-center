# v23.3 — Remote Page Simplification

## Goal

Make Remote feel like LM Studio's local server controls, but pointed at a remote GPU box.

The old Remote page was useful but too dashboard-like: connection state, selected model, GPU cards, runtime metrics, model list, add remote, saved remotes, quick test, and logs all competed for attention.

v23.3 keeps the same capabilities but reduces the default path to:

1. choose remote GPU
2. see connection state
3. see running/selected model
4. copy `/v1` endpoint
5. start/stop/restart
6. quick test
7. open logs

## UX changes

- Replaced the previous hero + two-column ops dashboard with one **Remote GPU workbench**.
- Shows a compact fact strip for:
  - connection
  - running model
  - endpoint
  - GPU summary
- Keeps only daily actions in the main path:
  - Recheck
  - Copy endpoint
  - Start
  - Stop
  - Restart
  - Logs
  - Quick test
- Moved secondary information behind disclosures:
  - remote model list
  - GPU health
  - runtime metrics
  - add/manage remotes
- Updated sidebar badge to `v23.3 beta RC`.

## Product decision

Remote GPU operations are part of the product positioning, but the page should not feel like Kubernetes, Grafana, and a config form got into a bar fight.

The main page should answer one question quickly:

> Is my remote GPU connected, what model is running, and what endpoint do I use?

Everything else can stay one click away.

## QA checklist

- Remote page with zero profiles shows one clear empty state.
- Remote page with one disconnected profile shows the error without a wall of metrics.
- Remote page with one running instance shows endpoint copy and quick test without scrolling through setup forms.
- Logs open only when requested.
- Add/manage remotes does not appear as a default dashboard column.
- GPU health and runtime metrics remain accessible under the secondary disclosure.
