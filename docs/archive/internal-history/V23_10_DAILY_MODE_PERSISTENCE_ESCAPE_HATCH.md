# v23.10 — Daily Mode Persistence & Escape Hatch

## Goal

Make the Daily / Advanced boundary feel calmer and more predictable.

The app now has a clear Daily mode for normal use and an Advanced mode for support work. v23.10 makes that choice stick across reloads and gives users a quick way back to the simple path.

## UX changes

- Persist the Daily / Advanced mode choice in browser local storage.
- Keep Daily mode focused on the four everyday pages:
  - Run Model
  - Models
  - Remote
  - Settings
- Keep Help & support hidden by default in Daily mode.
- Automatically show Advanced mode when a support/debug page is opened.
- Add a quiet **Back to Daily mode** action inside Help & support.
- Tighten sidebar mode copy:
  - Daily mode: "Everyday model actions only."
  - Advanced mode: "Debug tools are available."

## Why this matters

Without persistence, users can feel like the app changes after a refresh. Without an obvious exit, Advanced mode can feel sticky and cluttered. This pass keeps the power-user tools available while making the default experience feel closer to LM Studio: pick a model, load it, test it, copy the endpoint.

## QA checklist

1. Open the app fresh.
2. Confirm Daily mode is the default when no preference exists.
3. Switch to Advanced mode.
4. Reload the app.
5. Confirm Advanced mode remains enabled.
6. Click **Back to Daily mode**.
7. Confirm the app returns to Run Model and hides Help & support.
8. Reload again.
9. Confirm Daily mode remains enabled.
10. Open Logs or Setup Doctor directly and confirm Advanced mode becomes visible.
