# v23.5 — Final UX Consistency & Copy Reduction

## Goal

Make the public beta feel like one coherent app instead of a sequence of accumulated milestone cards.

The product should read as:

```text
Run Model -> Models -> Remote -> Settings
```

with support/debug pages available when needed, but not framed as the default way to use the app.

## What changed

- Updated the sidebar disclosure from **Advanced tools** to **Support tools**.
- Shortened the support list wording so normal users are not pushed into operator language.
- Renamed the sidebar release entry from **Beta Release Kit** to **Release Kit**.
- Updated the shell badge to `v23.5 beta RC`.
- Removed stale versioned labels from daily-use UI copy, including old `v22` / `v23.1` helper labels.
- Renamed the visible recovery card title to **Recovery helper**.
- Tightened Run Model copy around the core daily flow: select, load, test, copy endpoint.
- Kept diagnostics, full vLLM settings, command preview, logs, metrics, and QA checks behind the existing Advanced disclosure.
- Updated README, ROADMAP, CHANGELOG, and next-agent handoff for the consistency pass.

## UX rule after v23.5

Use product nouns, not milestone nouns, in the live UI.

Good:

- Run Model
- Daily flow
- Setup check
- Recovery helper
- Support tools
- Release Kit

Avoid in live UI:

- v22 beta quick start
- v23.1 simple run
- v22.4 recovery helper
- Advanced tools as the default sidebar label

Version names are still fine in changelog/docs, but they should not be the first thing users see while operating the app.

## QA checklist

- Sidebar primary nav still shows Run Model, Models, Remote, Settings.
- Sidebar support disclosure opens to Setup Doctor, Logs, Release Kit, More tools.
- Run Model main card does not show stale v22/v23 milestone labels.
- Recovery card title reads Recovery helper.
- Advanced diagnostic area remains reachable.
- Models empty state still renders with updated class aliases.
- README and roadmap identify v23.5 as the current package.
