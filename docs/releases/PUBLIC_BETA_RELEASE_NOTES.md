# Public beta release notes draft

These notes are the release-facing draft for the v0.62 GitHub Public Repo Cleanup beta package. Keep them short, tester-friendly, and honest about what is still beta.

## Headline

vLLM Control Center public beta: LM Studio-style model serving UX for vLLM, with local model detection, Hugging Face downloads, quick endpoint testing, and remote GPU control.

## What beta testers can try

1. Install dependencies with `./scripts/bootstrap.sh`.
2. Start the controller and frontend with `./scripts/dev.sh`.
3. Run `./scripts/launch-check.sh` if anything does not open cleanly.
4. In Daily mode, open **Run Model**.
5. Use a detected local model or download a starter model.
6. Start it with the default preset and wait for **Warming up** to become **Running**.
7. Run **Quick test**.
8. Copy the OpenAI-compatible `/v1` endpoint or SDK snippet.
9. Optional: open **Remote** and verify the empty state or a configured remote GPU.

## What is ready for feedback

- First install and launch clarity.
- Playground model selection after a local model is loaded or warming up.
- Playground auto-retry when vLLM reports a different served model name from `/v1/models`.
- Local model detection and model library readability.
- Hugging Face download flow.
- Start-request/warm-up/running state clarity, local crash memory, test-before-copy handoff, unload, quick test, endpoint handoff, last-copied confirmation, long model/path overflow polish, and current visible version badge sync.
- Plain-English crash diagnosis and recovery actions for common vLLM and download failures, including a safer test-before-copy handoff path.
- Daily mode versus Advanced mode separation.
- Remote GPU workbench clarity, especially selected-model endpoint handoff.
- README screenshots, docs, and bug-bash instructions.

## What is intentionally not included

- A generic chat UI.
- A hosted cloud service.
- Managed model hosting.
- Production desktop installer support.
- Telemetry or usage tracking.
- A promise that every Hugging Face model/quantization runs on every GPU. Large Qwen text-generation models remain eligible, but may still require enough VRAM or safer settings.

## Known limitations

See `docs/releases/KNOWN_LIMITATIONS.md` for the current beta limitation list.

## Before publishing v0.62

Run:

```bash
./scripts/bootstrap.sh
./scripts/version-scheme-check.sh
./scripts/launch-check.sh
./scripts/smoke.sh
./scripts/check-screenshots.sh
./scripts/bug-bash-check.sh
./scripts/release-freeze-check.sh
./scripts/check.sh
```

Then manually complete `docs/BETA_BUG_BASH.md` on at least one clean machine or clearly mark which hardware path was not tested.

## Suggested GitHub release body

```markdown
## vLLM Control Center public beta

vLLM Control Center is an open-source, LM Studio-style control plane for vLLM.

Daily path:

choose model -> Start -> quick test -> copy OpenAI-compatible /v1 endpoint

### Try it

```bash
./scripts/bootstrap.sh
./scripts/dev.sh
./scripts/launch-check.sh
```

Then open Run Model, start a detected/downloaded model, wait for Running, run Quick test, and copy the `/v1` endpoint.

### Good beta feedback

Please report whether install, launch, model detection, load/test/copy, and Remote GPU states are understandable. Include OS, GPU, Python, Node/npm, vLLM version, model name, and sanitized logs.

### Known limitations

This is a beta. Desktop packaging is still under decision, some model/quantization combinations may need manual vLLM flags, and Remote GPU setup assumes you already control the remote machine.
```

## Desktop status

v0.62 beta feedback lane is web-first. The Electron shell in `desktop/electron` is available as a preview for maintainers and early testers, but signed installers, auto-update, and desktop-managed controller lifecycle are not part of the public beta promise. See `docs/releases/DESKTOP_PACKAGING_DECISION.md`.

