# v4 Notes - Remote Controller Profiles

v4 adds the first remote-operations milestone. The product can now store and probe remote controller profiles so a laptop UI can manage a vLLM Control Center controller running on a GPU workstation, DGX Spark, or Linux server.

## Added backend capabilities

- `GET /api/remote-profiles`
- `POST /api/remote-profiles`
- `PATCH /api/remote-profiles/{id}`
- `DELETE /api/remote-profiles/{id}`
- `POST /api/remote-profiles/{id}/set-default`
- `POST /api/remote-profiles/{id}/probe`
- `POST /api/remote-profiles/{id}/forward`

Remote profiles store:

- name
- controller base URL
- optional API key
- notes
- default flag
- last online/offline status
- last latency
- last error

The public API never returns the raw remote API key. It only returns `api_key_configured`.

## Remote forward guardrails

The generic remote forward helper only accepts relative paths starting with `/api/`. It rejects full URLs and unsafe relative paths. This is intentionally conservative because remote forwarding can become an SSRF footgun if widened too early.

## Added frontend capabilities

- New **Remote** page
- Add remote controller profile
- Probe remote health/doctor endpoints
- Set a default remote
- Delete a remote profile
- Fetch remote doctor through the forwarding endpoint

## Manual test flow

Run a controller on the GPU box:

```bash
cd controller
uvicorn app.main:app --host 127.0.0.1 --port 8787
```

Run the UI/controller on your laptop:

```bash
cd controller
uvicorn app.main:app --reload --port 8787
```

```bash
cd frontend
npm install
npm run dev
```

Open the **Remote** page and add:

```text
Name: DGX Spark
Base URL: http://<gpu-box-ip>:8787
API key: optional for now
```

Click **Probe**. If the remote controller is reachable, it should show online status and remote doctor data.

## Verified

- Backend tests: 13 passed
- Frontend build: passed

## Next recommended milestone

**Hugging Face Model Download Queue**

That should add real model download/progress management before desktop packaging. The Remote milestone establishes where the model will run; the download queue helps prepare model assets on that machine.
