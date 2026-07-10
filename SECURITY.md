# Security Policy

vLLM Control Center can launch local processes and bridge requests to remote GPU controllers, so security issues matter.

## Supported versions

This project is pre-1.0. Security fixes should target the latest `main` branch.

## Report a vulnerability

Open a private security advisory if the project is hosted on GitHub, or contact the maintainers through the repository's published security contact.

Please include:

- affected version or commit
- steps to reproduce
- expected and actual impact
- logs/screenshots if safe to share
- suggested fix if you have one

Do not open a public issue for a vulnerability that exposes command injection, token leakage, remote control bypass, or arbitrary process control.

## High-risk areas

- command injection
- process killing outside controller-owned PIDs
- API key or token leakage
- Hugging Face token leakage
- remote controller forwarding / SSRF
- path traversal
- unsafe CORS defaults
- unauthenticated LAN exposure
- remote playground proxying
- log streaming across controller boundaries


## Current starter limitations

- Remote profile API keys are stored in the local SQLite `secrets` table, not in public profile rows. Treat the database as sensitive and do not commit it.
- The controller is designed for localhost-first development. Do not bind it to a public interface unless you add authentication, TLS, and network access controls.
- Remote profile forwarding is intentionally limited to relative `/api/...` paths. Do not expand it into a generic URL proxy.

## Security design rules

- Local controller should default to localhost-oriented workflows and stay bound to `127.0.0.1` by default.
- Remote controller profiles must not expose raw API keys through public API responses.
- Generic remote forwarding is limited to relative `/api/...` paths.
- Process launch must use argv arrays, not shell strings.
- Export helpers must support secret redaction.
- Logs should avoid printing raw secrets.
- The process manager should only stop processes it created.

## Safer remote usage

For DGX Spark, homelab, or workstation usage, prefer one of these:

- Tailscale / WireGuard / private VPN
- SSH tunnel
- reverse proxy with authentication and TLS
- trusted LAN only during development

Avoid exposing the controller or vLLM endpoint directly to the public internet.

## Controller API key

From v11 onward, the controller can protect API routes with `VCC_CONTROLLER_API_KEY`.
When configured, all `/api/*` routes except `/api/health` require either:

- `Authorization: Bearer <key>`
- `X-VCC-API-Key: <key>`
- `?api_key=<key>` for browser EventSource/SSE endpoints

`VCC_ALLOW_LOCALHOST_AUTH_BYPASS=false` by default. Only enable it for local development.

Do not expose the controller publicly without HTTPS, an API key, and network-level protection.
Remote profile API keys are separated into the local SQLite `secrets` table in v12. This prevents accidental profile-row exposure, but SQLite is not encrypted by default and should still be treated as sensitive.


## Secret storage in v12

Remote controller API keys are stored under deterministic keys such as `remote_profile:<profile_id>:api_key` in the `secrets` table. Public APIs return only `api_key_configured`. The legacy `remote_controller_profiles.api_key` column is kept for migration/backward compatibility and cleared during database initialization.

Future hardening may add OS keychain or encrypted secret-provider support.


## OS keychain research status

v15 adds an optional keyring availability check and adapter boundary, but SQLite remains the active secret backend.

Set `VCC_SECRET_BACKEND=keyring` only to inspect keyring availability. It does not migrate or activate production secret storage yet. Future activation must define fallback behavior for headless Linux, SSH sessions, CI, and packaged desktop apps.
