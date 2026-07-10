# v16.1 — Desktop/Auth Audit Fix Pass

v16.1 is a small audit-fix release after the v16 desktop shell spike.
It does not add a new product feature; it tightens the desktop prototype and remote bridge posture before the controller lifecycle milestone.

## Changes

- Updated stale internal dev tracking docs after the v16 audit.
- Added the desktop shell check to GitHub Actions CI.
- Added a desktop `package-lock.json` and pinned Electron to an audited patch version.
- Restricted Electron external link handling to `http:` and `https:` URLs only.
- Extended the desktop shell check to verify the link guard is present.
- Disabled the generic remote forwarding endpoint by default with `VCC_ALLOW_REMOTE_FORWARDING=false`.
- Kept dedicated remote bridge routes for instances, logs, metrics, and playground as the preferred path.

## Remote forwarding policy

The generic route below remains available only as an explicit development escape hatch:

```text
POST /api/remote-profiles/{profile_id}/forward
```

It now requires:

```bash
VCC_ALLOW_REMOTE_FORWARDING=true
```

Production and normal development flows should use the dedicated remote bridge routes instead.

## Verification

Expected check baseline:

```text
Backend tests: 53 passed
Backend lint: passed
Frontend build: passed
Desktop shell check: passed
```
