# v21.5 Agent Prompts

Use v21.5 only.

## QA prompt

Install v21.5 and focus on the One-Click Run Flow.

Verify:

1. The primary navigation shows **Run Model**, not Server.
2. The Run Model page starts with a one-click run entry card.
3. The card offers This device, Download from Hugging Face, and Continue running.
4. This device selects the recommended on-device model when one exists.
5. Download from Hugging Face switches to fresh HF discovery without exposing advanced settings.
6. Continue running selects a currently running instance when available and is disabled when none exists.
7. The page shows a simple readiness label: Running, Ready, Downloaded, Downloading, Needs HF access, Needs download, or Choose model.
8. The Best ready-to-run model card shows local path and has Select / Load now actions.
9. Load now starts the selected local model without requiring a separate trip to Local Models.
10. Once the model is running, the success panel appears with Quick test, Copy endpoint, Logs, and Unload.
11. The Model Detail Drawer still updates for the selected model and does not become the primary interaction burden.
12. Advanced cockpit remains collapsed by default and all old diagnostics remain available.

Preferred DGX/local test:

- Put at least one HF snapshot or GGUF file in a scan path.
- Open Run Model.
- Use the recommended local model Load now button.
- Confirm the success panel appears after the instance reaches running.
- Copy the `/v1` endpoint.
- Run Quick test.
- Open Logs.
- Unload and confirm model files remain on disk.
