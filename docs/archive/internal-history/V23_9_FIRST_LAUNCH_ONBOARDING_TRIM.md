# v23.9 — First Launch Onboarding Trim

## Goal

Make the first open feel calmer and less repetitive.

By v23.8 the app had a clear Daily / Advanced boundary, but the first Run Model experience could still show several related helpers at once. v23.9 trims that down to one welcome card and one obvious next action.

## UX changes

- Added a single first-launch card on Run Model when no server/model is selected.
- The first-launch card chooses the best next action:
  - use a detected local model when available
  - download a starter model when no model is present
  - browse Hugging Face
  - recheck setup
- Setup Doctor no longer appears as a second visible card during the first empty state.
- Setup checks only expand inline when there is something to fix after the first-launch card is gone.
- The main daily flow remains: choose model, load, quick test, copy `/v1` endpoint.

## Product principle

One page should not explain the same idea in multiple cards. First launch should answer only one question:

> What should I do next?

Advanced details remain available through Advanced mode and Help & support.

## QA checklist

- Fresh install with no models shows one first-launch card.
- Fresh install with detected local models recommends using a local model.
- vLLM missing shows readiness status in the first-launch card without stacking another warning card.
- After selecting a model, the normal Run Model workbench becomes the primary surface.
- Setup Doctor inline helper appears only when setup needs attention and the first-launch card is not already visible.
