# v0.51 — Clipboard Fallback Handoff Reliability Pass

## Goal

Make the final handoff step more reliable without adding Daily mode clutter. Some preview shells, insecure local origins, and older browser contexts can block `navigator.clipboard`, which made tested endpoint copy feel broken even after the app correctly completed Pick → Start → Test.

## Scope

- Keep Copy gated by Quick test success for the exact selected local or remote run.
- Keep Qwen3.6 and large Qwen text-generation models runnable; size alone is not incompatibility.
- Add a textarea selection fallback when `navigator.clipboard.writeText` is unavailable or throws.
- Apply the fallback to Run Model, Remote, Setup, and Release copy actions.
- Do not add more dashboard cards or operator-heavy main-path wording.

## User-visible result

Copy actions continue to look the same, but they now work in more beta environments. If all copy methods fail, the user sees a manual-copy fallback message instead of a misleading Clipboard API-only warning.

## Verification

Run the standard release checks: version scheme, release freeze, bug bash, screenshots, smoke, frontend build, backend tests, backend lint, launch check, and desktop shell check.
