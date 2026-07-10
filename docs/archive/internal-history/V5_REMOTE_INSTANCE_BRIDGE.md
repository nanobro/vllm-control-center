# v5: Remote Instance Bridge

v5 turns remote controller profiles into a real operations bridge.

Before v5, the local UI could store and probe remote controller profiles. With v5, a local laptop UI can control instances on a remote GPU box, DGX Spark, or Linux workstation running the same controller.

## New backend endpoints

All routes are served by the local controller and safely forward to the selected remote controller profile.

```text
GET  /api/remote-profiles/{profile_id}/instances
GET  /api/remote-profiles/{profile_id}/instances/{remote_instance_id}
GET  /api/remote-profiles/{profile_id}/instances/{remote_instance_id}/command
POST /api/remote-profiles/{profile_id}/instances/{remote_instance_id}/start
POST /api/remote-profiles/{profile_id}/instances/{remote_instance_id}/stop
POST /api/remote-profiles/{profile_id}/instances/{remote_instance_id}/restart
GET  /api/remote-profiles/{profile_id}/instances/{remote_instance_id}/metrics
GET  /api/remote-profiles/{profile_id}/instances/{remote_instance_id}/logs
GET  /api/remote-profiles/{profile_id}/instances/{remote_instance_id}/logs/stream
```

## Security model

Remote bridge routes are intentionally narrow:

- They forward only to `/api/instances...` on the remote controller.
- Remote instance IDs cannot contain `/` or `..`.
- Generic forwarding is still limited to API-relative paths.
- Remote profile API keys are attached by the local controller, not exposed to the frontend.
- Log streaming is bridged as SSE from remote controller to local browser.

This avoids turning the local controller into a generic URL proxy.

## New frontend page

`Remote Instances` lets users:

- choose a remote controller profile
- list remote vLLM instances
- start, stop, and restart remote instances
- open a remote instance detail panel
- fetch remote metrics
- tail remote logs live via SSE

## Manual test path

1. Run controller on the GPU server:

```bash
cd controller
uvicorn app.main:app --host 127.0.0.1 --port 8787
```

2. Run local controller and frontend on laptop.

3. Add remote profile:

```text
Name: DGX Spark
URL:  http://<gpu-server-ip>:8787
```

4. Open `Remote Instances`.

5. Verify remote instance list loads.

6. Start or stop a remote instance.

7. Open the instance and verify live logs and metrics.

## Next milestone suggestion

Remote Playground Bridge:

- send chat requests through a selected remote profile/instance
- support streaming token output from remote vLLM
- save remote chat sessions locally with metadata `{profile_id, remote_instance_id}`
