# v0.43 — Streaming Test Failure Guidance Pass

v0.43 extends the v0.42 Quick test failure guidance into the streaming playground path.

## Goal

Keep the Daily path simple: Pick model, Start, Test, Copy OpenAI base URL. When a streaming test chat fails, show the same plain-English recovery guidance users already get from non-streaming Quick test.

## Changes

- Streaming SSE errors now include `error_type`, `user_message`, and `next_actions`.
- Local streaming failures are diagnosed for endpoint-not-ready, timeout, auth mismatch, wrong route, served model mismatch, GPU memory pressure, and generic server errors.
- The local playground and remote playground render action chips below streaming and non-streaming failures.
- Raw server details stay available in logs/details; the main path stays readable.

## Non-goals

- Do not block Qwen3.6 or large Qwen text-generation models based on size alone.
- Do not add dashboard clutter.
- Do not promote Electron beyond preview-only.
