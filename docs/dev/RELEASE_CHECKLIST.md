# Release Checklist

Use this before creating a new version zip or GitHub release.

## Version prep

- [ ] Update `README.md` current release and project status.
- [ ] Update `CHANGELOG.md` with the new version at the top.
- [ ] Update `ROADMAP.md` completed/next milestone.
- [ ] Update `docs/dev/PROJECT_STATUS.md` if the internal baseline changed.
- [ ] Add a milestone doc under `docs/` for meaningful changes.
- [ ] Add or update `ai-agent-prompts/` for the next agent handoff.

## Public beta assets

- [ ] Capture `01-run-model-first-run.png`.
- [ ] Capture `02-models-library.png`.
- [ ] Capture `03-loaded-endpoint.png`.
- [ ] Capture `04-remote-gpu.png`.
- [ ] Capture `05-setup-doctor.png`.
- [ ] Confirm screenshots contain no secrets, private paths, API keys, or customer endpoints.
- [ ] Confirm README explains: LM Studio UX + vLLM power + remote GPU ops.
- [ ] Confirm README does not position the project as a generic chat UI.
- [ ] Confirm public beta notes mention feature freeze / release-candidate status.

## Install / upgrade smoke tests

- [ ] Fresh clone starts with `./scripts/dev.sh`.
- [ ] Backend starts on `127.0.0.1:8787`.
- [ ] Frontend starts on `127.0.0.1:5173`.
- [ ] Existing local database still opens after upgrade.
- [ ] Empty install shows helpful setup/model guidance.
- [ ] Existing local model appears in Models library.
- [ ] A running model shows `/v1` endpoint and quick test.
- [ ] Remote page renders with zero profiles.
- [ ] Remote page renders with one configured profile.

## Quality checks

- [ ] Run `./scripts/check.sh`.
- [ ] Confirm backend tests pass.
- [ ] Confirm backend lint passes.
- [ ] Confirm frontend build passes.
- [ ] Confirm desktop shell check passes.
- [ ] Confirm package does not include generated junk:
  - [ ] `node_modules`
  - [ ] `frontend/dist`
  - [ ] `.pytest_cache`
  - [ ] `.ruff_cache`
  - [ ] `*.egg-info`
  - [ ] local SQLite DB files

## Security checks

- [ ] Search for `shell=True`.
- [ ] Search for hardcoded API keys/tokens.
- [ ] Search screenshot/demo docs for private paths, hostnames, or customer endpoint URLs.
- [ ] Confirm secret examples are placeholders only.
- [ ] Confirm export snippets redact secrets by default when appropriate.
- [ ] Confirm remote forwarding is not a general URL proxy.
- [ ] Confirm screenshot/demo docs warn against leaking secrets.

## Manual app smoke tests

- [ ] Open Run Model.
- [ ] Open Models.
- [ ] Open Remote.
- [ ] Open Settings.
- [ ] Open Advanced tools -> Setup Doctor.
- [ ] Open Advanced tools -> Beta Release Kit.
- [ ] Confirm RC gates show no blockers before publishing.
- [ ] Open Logs with and without a selected instance.
- [ ] Open Metrics with and without a selected instance.
- [ ] Open Playground with and without a selected instance.
- [ ] Open Compatibility.

## Release note template

```text
Version: vX.Y
Focus: <one sentence>

Added:
- ...

Changed:
- ...

Fixed:
- ...

Verification:
- Backend tests: N passed
- Backend lint: passed
- Frontend build: passed
- Desktop shell check: passed
```
