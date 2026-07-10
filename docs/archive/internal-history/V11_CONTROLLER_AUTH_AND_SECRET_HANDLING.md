# v11 — Controller Auth and Secret Handling

v11 adds the first controller-level authentication layer and central secret redaction helpers.

## What changed

- Optional controller API-key middleware.
- Protected `/api/*` routes when `VCC_CONTROLLER_API_KEY` is configured.
- `/api/health` remains public for lightweight health checks.
- Supports `Authorization: Bearer <key>` and `X-VCC-API-Key: <key>`.
- Supports `?api_key=<key>` for SSE endpoints because browser `EventSource` cannot send custom headers.
- Added explicit local dev bypass setting: `VCC_ALLOW_LOCALHOST_AUTH_BYPASS=false` by default.
- Added secret redaction helpers in `app.core.secrets`.
- Added `settings` and `secrets` SQLite tables as a foundation for later secret separation.
- Remote controller profile API keys can now be updated or explicitly cleared with `clear_api_key`.
- Frontend Settings page can store the local controller API key in browser localStorage.

## Security posture

This is a meaningful improvement but not the final security model.

Current limitations:

- Remote profile API keys are still stored in local SQLite plaintext.
- Browser Settings stores the local controller key in localStorage.
- Query-token auth for SSE should only be used on localhost or HTTPS.
- Do not expose the controller directly to the public internet.

Recommended safe deployment:

1. Bind the controller to `127.0.0.1` for local use.
2. If binding to LAN, set `VCC_CONTROLLER_API_KEY`.
3. Use a firewall or VPN/Tailscale/WireGuard for remote access.
4. Treat the SQLite DB and browser profile as sensitive.
5. Prefer HTTPS before exposing any remote controller beyond a trusted LAN/VPN.

## Manual test

```bash
cd controller
VCC_CONTROLLER_API_KEY=dev-secret uvicorn app.main:app --reload --port 8787

curl http://127.0.0.1:8787/api/health
curl http://127.0.0.1:8787/api/system/doctor
curl -H 'Authorization: Bearer dev-secret' http://127.0.0.1:8787/api/system/doctor
```

Expected:

- Health returns 200 without auth.
- Doctor returns 401 without auth.
- Doctor returns 200 with the bearer token.
