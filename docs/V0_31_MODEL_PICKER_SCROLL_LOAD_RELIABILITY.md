# v0.31 — Model Picker Scroll & Load Reliability Fix Pass

This release responds to hands-on beta feedback from the Run Model and Models pages.

## User feedback

- Qwen3.6-class models are runnable on the target machine and must not be treated as automatically incompatible.
- The Hugging Face picker only exposed a small top slice of models, making it feel like the user could not scroll to more results.
- Models appeared to be missing when the Models page was actually filtered to a small subset such as Needs attention.
- Port conflicts made starts feel like generic run failures.

## Changes

- Hugging Face discovery now requests up to 75 results from the frontend and the backend accepts up to 100.
- The Daily Run Model picker is a visible scrollable list instead of a tiny closed select.
- The picker shows how many models are currently visible and reminds users to scroll or type to filter.
- The Models page shows an explicit filter-scope hint when search/filter hides part of the library.
- Load settings resolve to the next free port when the chosen port is already in use.
- Qwen3.6-style text-generation models stay eligible for loading; size alone is not a compatibility blocker.

## Non-goals

- Do not block all unknown Hugging Face repos.
- Do not treat unofficial Qwen derivatives as incompatible by default.
- Do not add a new product surface; this is a beta-fix pass inside the existing Daily flow.
