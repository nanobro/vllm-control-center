# Version Number Change Brief

Use this brief when handing the project to another coding agent or maintainer.

## Decision

The public version line has changed from the internal `v24.x -> v25.0` plan to a pre-1.0 beta line starting at **v0.25**.

## Why

The old `v24.x` numbering was useful for fast internal iteration, but it looks too mature for a first public beta. `v0.25` communicates the right status: usable, serious enough for testers, but still pre-1.0.

## Mapping

- `v24.9` = final internal pre-beta re-freeze candidate.
- `v0.25` = first public beta tag and version-scheme reset.
- Next releases should be `v0.26`, `v0.27`, `v0.28`, etc.
- `v1.0` should wait until real users can reliably install, load a model, quick-test it, and use the `/v1` endpoint.

## Agent rule

Do **not** create `v25.0`, `v26.x`, or `v24.10` unless the project owner explicitly reverses this decision. Continue from `v0.25` to `v0.26`.

## What should change in future releases

- Package names: `vllm-control-center-starter-v0.26.zip`, etc.
- README current release.
- ROADMAP current package.
- CHANGELOG top entry.
- `docs/MILESTONES.md`.
- Release and bug-bash docs.
- Agent handoff prompts.
- Release/smoke checks if they assert a version.

## What can stay historical

Old docs named `V24_*`, `V23_*`, etc. can stay as historical implementation notes. Do not rewrite every historical file unless it causes confusion in public-facing docs or checks.
