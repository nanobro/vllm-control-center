# Screenshots

Add real screenshots here before public launch. The package includes placeholder cards under the required filenames so README image links stay intact; replace them with real captures before tagging the public beta. These five images should explain the whole beta without showing internal milestone history.

## Required public beta screenshots

1. `01-run-model.png` — Daily mode Run Model screen with the selected model, Load/Unload, Quick test, and Copy endpoint controls.
2. `02-models.png` — unified Models library with clear Ready / Running / Downloading / Needs attention states.
3. `03-endpoint-success.png` — loaded model with Quick test passed, latency visible, and `/v1` endpoint copy action.
4. `04-remote.png` — Remote GPU workbench, either with one safe demo profile or the clean empty state.
5. `05-setup-check.png` — plain-English Setup check with no secrets and no private machine paths.

## Optional advanced screenshots

6. `06-model-detail-drawer.png` — selected model/variant detail drawer.
7. `07-human-presets.png` — Fast test / Balanced / Long context / High throughput / Low VRAM presets.
8. `08-release-kit.png` — maintainer Release kit checklist.

## Capture hygiene

- Do not include API keys, Hugging Face tokens, customer endpoints, SSH hostnames, or private model paths.
- Prefer demo names such as `Qwen/Qwen3-0.6B`, `Qwen/Qwen2.5-Coder-7B-Instruct`, and `demo-dgx-01`.
- Use `http://127.0.0.1:8000/v1` or another safe local endpoint for examples.
- Crop browser chrome only if the app UI remains understandable.
- Use `docs/screenshots/CAPTIONS.md` for README captions and alt text.

Use `docs/demo/beta-demo-data.md` and `docs/demo/public-beta-walkthrough.md` to prepare consistent demo states.
