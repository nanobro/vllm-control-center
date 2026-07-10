# GitHub upload from primary device

This repo was installed from a zip on curio and does not include `.git` metadata. Curio is also treated as a pull-only agent-farm device, so GitHub publication should happen from the primary device.

## Recommended publication target
- Repo name: `vllm-control-center`
- Version being published: `v0.62`
- Release label in README: `v0.62 GitHub Public Repo Cleanup Pass`

## Before creating the repo
1. Move or copy `~/vllm-cc-v0.62` onto the primary device.
2. Confirm GitHub CLI auth:
   ```bash
   gh auth status
   ```
3. Review the tree and make sure no secrets or local-only files are present.
4. If needed, remove local DB/cache artifacts before first commit.

## Create a private GitHub repo and push
```bash
cd ~/vllm-cc-v0.62
git init
git add .
git commit -m "Initial public beta source release: v0.62"
gh repo create vllm-control-center --private --source=. --remote=origin --push
```

## Create a public GitHub repo and push
```bash
cd ~/vllm-cc-v0.62
git init
git add .
git commit -m "Initial public beta source release: v0.62"
gh repo create vllm-control-center --public --source=. --remote=origin --push
```

## Suggested pre-push verification
Run these from the project root before publishing:
```bash
./scripts/version-scheme-check.sh
./scripts/launch-check.sh
./scripts/smoke.sh
./scripts/check-screenshots.sh
./scripts/bug-bash-check.sh
./scripts/release-freeze-check.sh
./scripts/check.sh
```

## Important product/status notes to preserve in GitHub copy
- The project is web-first.
- Electron is preview-only.
- The core daily flow is: choose model -> load -> quick test -> copy `/v1` endpoint.
- v0.62 is framed as a GitHub public repo cleanup/publication pass, not a stable 1.0 release.

## Known curio-specific note
On curio macOS, `scripts/dev.sh` needed a bash-compatibility patch because the default shell does not support `wait -n`. If the primary device is also macOS with the default bash, carry that patch forward too.
