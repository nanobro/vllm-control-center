# v23.7 — First-Run Language & Empty-State Polish

## Goal

Make the beta RC feel calmer and less milestone-driven. The live UI should read like a product, not a changelog. Empty states should tell the user what to do next without repeating the same setup story across multiple pages.

## Changes

- Replaced visible version-heavy sidebar language with a quieter beta-ready badge.
- Renamed the support drawer to **Help & support** so it feels less like an operator-only area.
- Tightened Run Model copy around the core path: choose, load, test, copy endpoint.
- Simplified first-run empty states on Run Model, Models, Remote, and Setup Doctor.
- Removed stale milestone wording from Setup Doctor.
- Updated Release Kit packaging command to v23.7.

## UX rule

Default screens should answer one question: **what is the next useful action?**

Detailed explanations remain available in Setup Doctor, Release Kit, logs, and advanced disclosures, but they should not dominate the daily-use surfaces.

## QA checklist

- Open Run Model with no model selected: the first-run message should be short and action-oriented.
- Open Models with no models: the empty state should offer scan, add folder, or download starter.
- Open Remote with no profile: the empty state should mention adding one remote GPU once.
- Open Setup Doctor: the header should not reference old version numbers.
- Open sidebar: primary navigation should remain compact and support tools should feel optional.
