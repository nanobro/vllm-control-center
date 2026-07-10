# Maintainer Checklist

Use this before publishing or cutting a release.

## Before opening the repository publicly

- [ ] Replace `your-org` badge URL in README.
- [ ] Confirm license choice.
- [ ] Confirm project name.
- [ ] Add real screenshots or short GIFs.
- [ ] Run `./scripts/check.sh`.
- [ ] Review `SECURITY.md`.
- [ ] Remove generated build artifacts.
- [ ] Confirm no secrets in repo.
- [ ] Confirm README quick start works on a clean machine.

## Before merging a pull request

- [ ] PR is scoped and reviewable.
- [ ] Backend tests added for backend behavior.
- [ ] Frontend build passes.
- [ ] New routes are documented when user-facing.
- [ ] No unsafe `shell=True` usage.
- [ ] Secrets are redacted in logs and exports.
- [ ] Remote bridge changes preserve `/api/...` restriction.

## Before release

- [ ] Update README status.
- [ ] Update ROADMAP.
- [ ] Update docs for new workflows.
- [ ] Tag release.
- [ ] Attach zip/source artifact if useful.
