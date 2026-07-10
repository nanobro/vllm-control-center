# v0.53 — Manual Copy Select-All Confidence Pass

## Goal

Make the v0.52 manual-copy fallback easier to use in locked-down browser shells, mobile WebViews, insecure origins, and Electron preview environments where automated copy may still fail.

## Changes

- Local Run Model manual-copy fallback now includes an explicit **Select all** action.
- Remote GPU handoff manual-copy fallback now includes the same **Select all** action.
- Manual fallback payloads show character counts so testers can verify they are selecting the full handoff payload.
- The fallback panel remains hidden on the happy path and only appears when copy fails after the Clipboard API and DOM fallback.
- Copy/snippets remain gated by Quick test success for the exact selected run.

## Product rules kept

- Daily mode remains: Pick model → Start → Test → Copy OpenAI base URL.
- Qwen3.6 and large Qwen text-generation models remain runnable; size alone is not a blocker.
- Electron remains preview-only.
- The public beta line continues as v0.53, then v0.54.
