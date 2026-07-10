# v21 Agent Prompt — On-device Scanner QA

Use v21 only.

Goal: verify the LM Studio-style on-device flow.

1. Start the controller and frontend.
2. Open the Server page.
3. Choose source: `This device`.
4. Add the real DGX/local model directory from the UI, for example `/data/models`, `/mnt/models`, or `/home/ritrit/.cache/huggingface/hub`.
5. Click Rescan / Refresh all.
6. Confirm models appear in the list without manual registration.
7. Select a detected model.
8. Click Load Model.
9. Run Quick test.
10. Copy endpoint.

Watch specifically for:

- Empty-state guidance when no local models are found.
- Whether app-added scan paths persist after refresh/restart.
- Whether HF snapshot folders and GGUF files are detected correctly.
- Whether the displayed local path is the path vLLM can actually load.
- Whether Load reuses an existing instance instead of duplicating it.
- Whether error messages for missing vLLM, CUDA OOM, and port conflicts are understandable.
