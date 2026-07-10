# Known limitations

This file is the beta honesty list. Keep it updated as testers report real blockers.

## Runtime and hardware

- vLLM must be installed separately in the environment that serves models.
- NVIDIA GPU detection depends on `nvidia-smi` being available on the serving machine.
- CPU-only serving is not the primary beta target.
- Very large models can still fail with out-of-memory errors even when the UI recommends safer presets. Size alone is not treated as incompatibility; the crash reason should identify memory/settings when that is the real cause.

## Model compatibility

- The scanner can identify common Safetensors, PyTorch `.bin`, GGUF, AWQ, GPTQ, dtype hints, tokenizer/config presence, context length, and shard patterns, but compatibility is advisory.
- Some Hugging Face models require authentication, license acceptance, custom code, a complete snapshot path, or extra vLLM arguments.
- GGUF and unusual quantization formats may need manual handling depending on installed vLLM support.

## Install and launch

- `./scripts/bootstrap.sh` and `./scripts/dev.sh` are the supported beta path.
- Desktop/Electron remains a spike unless the desktop packaging decision doc says otherwise.
- Port conflicts on `8787` or the Vite dev port must be resolved by the tester.

## Remote GPU

- Remote mode assumes the tester already owns and can access the remote machine.
- Remote credential and controller lifecycle flows are intentionally conservative during beta.
- Remote empty state clarity is part of the beta test.

## Product scope

- The app is not a generic chat UI.
- The app is not a hosted inference service.
- The app does not add telemetry or phone-home diagnostics.
- Advanced vLLM tuning exists, but the Daily path intentionally hides raw knobs.

## Reporting limitations

When reporting a limitation, include:

- OS and GPU
- vLLM version
- model name and quantization
- whether the model was local or downloaded
- which step failed: install, launch, scan, download, load, quick test, endpoint copy, or remote
- sanitized logs with tokens, hostnames, and private paths removed

## Desktop packaging

The public beta is web-first. Electron is preview-only. There are no signed installers, auto-update, or desktop-managed controller lifecycle guarantees yet.

