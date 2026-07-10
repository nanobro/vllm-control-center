# v23.12 — Quick Test Result Polish

v23.12 improves the final daily-use confidence loop after a model is loaded.

## Goal

Make it obvious whether the loaded model actually responds before the user copies the OpenAI-compatible endpoint into another app.

## UX changes

- Local Run Model now shows a compact quick-test result card after the model is running.
- Remote GPU quick test now uses the same success/failure language.
- Test result cards show:
  - testing state
  - passed state
  - failed state
  - latency
  - last test time
  - short assistant response preview
  - plain failure message
- Advanced test panel now reuses the same status language.

## Product rule

The quick test is a confidence check, not a chat UI. Keep it short, practical, and tied to endpoint readiness.

Daily flow remains:

1. choose model
2. load
3. quick test
4. copy `/v1` endpoint
