# v0.54 — Copy Success Confirmation & Last Copied State Pass

## Goal

Make successful handoff copies feel trustworthy without adding another dashboard surface. Users should know what was copied after the happy-path clipboard action succeeds, not only when fallback/manual copy is needed.

## Changes

- Local Run Model handoff copy actions now show a lightweight success confirmation after copy succeeds.
- Remote GPU handoff copy actions now show the same success confirmation after copy succeeds.
- The confirmation names the payload that was copied: base URL, tested model name, handoff bundle, safe `.env`, SDK snippets, or command.
- The confirmation includes a short preview and character count so users can verify the copied payload without opening noisy details.
- The confirmation clears when the selected server run, selected model, or load profile changes, preventing stale copy confidence.
- Manual-copy fallback remains available if automated copy still fails.

## Product rules kept

- Daily mode remains: Pick model → Start → Test → Copy OpenAI base URL.
- Copy/snippets remain gated by Quick test success for the exact selected run.
- Full payloads and noisy details stay in drawer/details/manual-copy fallback, not main rows.
- Qwen3.6 and large Qwen text-generation models remain runnable; size alone is not a blocker.
- Electron remains preview-only.
- The public beta line continues as v0.54, then v0.55.
