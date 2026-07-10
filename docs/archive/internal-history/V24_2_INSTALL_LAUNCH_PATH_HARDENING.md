# v24.2 — Install & Launch Path Hardening

v24.2 keeps the public beta UI frozen and improves the fresh-clone path.

The goal is simple: a beta tester should know which command installs dependencies, which command starts the app, and which command explains why the app did not open.

## Added

- `scripts/bootstrap.sh`
  - creates `controller/.venv`
  - installs controller dev dependencies
  - installs frontend dependencies with `npm ci` when a lockfile is present
  - reports optional `vllm` and `nvidia-smi` availability without failing the install
- `scripts/launch-check.sh`
  - checks whether install folders exist
  - checks whether backend/frontend ports are already in use
  - checks the controller health endpoint when running
  - prints the three commands a tester needs: bootstrap, dev, launch-check
- Makefile shortcuts:
  - `make bootstrap`
  - `make launch-check`

## Updated

- README quick start now starts with `./scripts/bootstrap.sh` and `./scripts/dev.sh`.
- Smoke checks now verify the bootstrap and launch-check scripts exist.
- Release package commands now include `./scripts/launch-check.sh`.

## Product guardrail

This release does not add daily-mode UI. It hardens the beta launch path around the existing public beta surface.
