# v0.31 Agent Prompt — Model Picker Scroll & Load Reliability

Continue from v0.31. Keep public versions in the v0.x scheme.

Important beta feedback:

- Qwen3.6-class models can run on the user machine. Do not mark Qwen3.6 or large Qwen text-generation models as not runnable merely because they are large, unofficial, FP8/NVFP4, or from Hugging Face search.
- The app must let users scroll through more Hugging Face results, not only the first few top matches.
- If the Models page is filtered, make it obvious that the full library is hidden by the current filter.
- Port conflicts should not feel like model failures; prefer the next free port or give a clear action.

Rules for the next pass:

- Keep Daily mode frozen.
- Keep beta web-first and Electron preview-only.
- Do not return to v24/v25 numbering.
- Next version should be v0.32 unless the user asks for a different reset.
