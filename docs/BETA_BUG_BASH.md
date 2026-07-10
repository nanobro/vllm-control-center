# Public Beta Bug Bash

Use this checklist before publishing or asking new users to try vLLM Control Center.

The goal is not to prove every advanced tool works. The goal is to confirm the daily path is obvious:

```text
choose model -> load -> quick test -> copy /v1 endpoint
```

## 1. Fresh clone smoke test

```bash
./scripts/smoke.sh
./scripts/check.sh
```

Expected result:

- repository shape is valid
- no stale milestone labels leak into live frontend copy
- frontend build passes
- backend tests and lint pass
- desktop shell file check passes

If the controller is running, `scripts/smoke.sh` also checks the core API endpoints.

## 2. Empty install test

Start from a machine or profile with no configured models.

Expected UI:

- Daily mode opens to **Run Model**
- only one calm first-launch card appears
- no stacked setup/release/support cards appear
- the next action is clear: scan local models, download starter model, browse Hugging Face, or recheck setup

## 3. Local model test

Place one model under `./models` or scan an existing Hugging Face cache.

Expected UI:

- **Models** shows one clear row or group
- compatibility status is readable
- selecting the model opens the detail drawer
- **Run Model** can select the model without making the user hunt through advanced tools

## 4. Load and endpoint test

Load a small model with the recommended preset.

Expected UI:

- status changes to running
- Quick test can be run from the same page
- the result shows pass/fail, latency, last test time, and response preview
- `/v1` endpoint copy is obvious
- SDK snippets are available only inside the developer handoff disclosure

## 5. Failure recovery test

Trigger one controlled failure, such as a bad model path, port conflict, or intentionally too-large model.

Expected UI:

- one recovery helper appears
- the message explains likely cause in plain English
- fixes are concrete, such as Low VRAM preset, change port, retry, or open logs
- raw logs remain available but do not dominate Daily mode

## 6. Remote empty/connected test

Open **Remote** with no profile, then with one safe demo profile if available.

Expected UI:

- empty state is intentional and not scary
- connected state focuses on remote GPU, running model, endpoint, quick test, and logs
- metrics and profile management remain behind disclosures or Advanced mode

## 7. Screenshot hygiene

Capture only public-safe states:

1. Run Model
2. Models library
3. Endpoint success
4. Remote GPU
5. Setup check

Before publishing, hide or redact:

- local usernames and private paths
- API keys and tokens
- private hostnames/IPs if not intended
- internal repository paths
- failed/private download names

## Pass criteria

Ship the beta when:

- a new user can understand the first action in under five seconds
- the daily path has no duplicate helper cards
- no stale milestone labels are visible in Daily mode
- quick test and endpoint copy are obvious after a model loads
- support tools are available without crowding the default UI

## v0.25 public beta tag triage rules

During the v0.25 public beta tag, do not treat every rough edge as a release blocker. Use this split:

- **Blocker:** fresh install, launch, model selection, load, quick test, endpoint copy, screenshots, release notes, or issue intake is broken.
- **Beta polish:** confusing but non-blocking copy, missing explanation, or a rough empty state.
- **Post-beta:** new features, wider provider discovery, desktop installers, advanced diagnostics export, or expanded remote onboarding.
- **Not planned:** generic chat UI, hosted control plane assumptions, or widening Daily mode navigation.

Record the result in `docs/releases/BETA_BUG_BASH_STATUS.md` before cutting v0.25.

## v0.25 automated checklist

Run the beta-specific blocker check after the normal checks:

```bash
./scripts/launch-check.sh
./scripts/smoke.sh
./scripts/check-screenshots.sh
./scripts/bug-bash-check.sh
./scripts/release-freeze-check.sh
```

A warning is acceptable when it depends on the local machine, such as `vllm`, `nvidia-smi`, or an inactive controller. A failure means the package is not ready for v0.25.
