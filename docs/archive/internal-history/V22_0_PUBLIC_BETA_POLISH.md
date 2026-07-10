# v22.0 — Public Beta Polish

## Goal

Move vLLM Control Center from a feature-complete prototype into a clearer public beta experience.

The app should still feel like:

> LM Studio UX + vLLM power + remote GPU ops.

This release does not add another heavy operator surface. It makes the first run easier to understand and makes empty states actionable.

## UX changes

### 1. Beta quick start on Run Model

The Run Model page now includes a v22 beta quick-start card that answers:

- what to do first
- whether local models were found
- whether downloads are active
- whether a model is already running
- whether vLLM looks ready in Setup Doctor

The card exposes only three actions:

- Use local model
- Download model
- Recheck

This keeps the first-run flow focused on the current core path:

1. Choose a model
2. Make sure it is available to load
3. Load the server
4. Quick test
5. Copy endpoint

### 2. First-run progress

The quick-start card mirrors the existing first-run checklist as a progress bar, so a new user can see how close they are to a successful OpenAI-compatible endpoint without reading the advanced cockpit.

### 3. Unified Models empty state

The Models page now handles the true empty-library case with clear starter actions:

- scan the common Hugging Face cache
- scan `./models`
- download a tiny starter model
- open Run Model

This avoids the dead-end feeling when the app has not detected any local model yet.

### 4. Beta identity in the shell

The sidebar introduced a compact then-current public beta badge. Current packages should render the active v0.x beta version from package metadata so release screenshots and user reports identify the build without adding clutter to the main workflow.

## Non-goals

- No new tab.
- No new raw vLLM configuration surface.
- No additional required setup wizard.
- No attempt to replace the existing advanced tools.

## QA checklist

- Open Run Model with no models and no instances.
- Confirm the beta quick-start card is visible and not visually louder than the main Run a model card.
- Click Use local model and confirm it switches to This device.
- Click Download model and confirm it switches to Hugging Face discovery.
- Confirm Recheck invalidates the same data as Refresh all.
- Open Models with an empty library and confirm the starter state is shown.
- Queue the starter model from the empty state and confirm it appears in Downloads / Models.
- Add scan paths from the empty state and confirm the page refreshes.
- Confirm advanced tools are still hidden in the sidebar disclosure.
