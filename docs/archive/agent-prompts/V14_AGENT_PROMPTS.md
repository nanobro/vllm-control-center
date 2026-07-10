# v14 Agent Prompts

Use these prompts after v14. Give agents the v14 zip only.

## General continuation prompt

```text
Inspect this repository first. Do not rewrite it from scratch.

Continue from v14 of vLLM Control Center.

Product direction:
- This is an LM Studio-style control plane for vLLM.
- It is not another generic chat UI.
- Preserve FastAPI controller + React/Vite frontend architecture.
- Preserve safe subprocess execution. Never use shell=True.
- Preserve controller auth, remote profile secrets, and metrics snapshot behavior.
- Add backend tests for new behavior.
- Run pytest, ruff, and npm build.
- Update docs/dev/PROJECT_STATUS.md, docs/dev/TODO.md, CHANGELOG.md, and ROADMAP.md if the milestone changes project status.
- Summarize changed files and manual test steps.
```

## Recommended v15 milestone: OS Keychain Research Spike

```text
Implement v15 — OS Keychain Research Spike.

Do not change production secret storage yet unless it is behind a clear optional abstraction.

Deliverables:
1. Add docs/dev/KEYCHAIN_RESEARCH.md comparing:
   - macOS Keychain
   - Windows Credential Manager
   - Linux Secret Service / libsecret
   - Python keyring package
2. Add a proposed SecretProvider interface design.
3. Add a small non-default experimental adapter module if safe.
4. Add tests only for interface behavior using fake providers.
5. Update SECURITY.md with the current SQLite baseline and future migration path.
6. Update ROADMAP.md and PROJECT_STATUS.md.

Do not make the app require OS keychain support in v15.
```

## Alternative v15 milestone: Desktop Shell Spike

```text
Research and prototype desktop shell packaging.

Deliverables:
1. Compare Electron vs Tauri for this repo.
2. Add docs/dev/DESKTOP_SHELL_SPIKE.md.
3. Create a minimal proof-of-concept only if it does not destabilize the existing web/controller dev flow.
4. Do not remove the web-first architecture.
```
