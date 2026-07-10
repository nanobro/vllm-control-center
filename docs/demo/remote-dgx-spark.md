# Demo: Remote DGX Spark Control

This demo is the main product story: use a laptop browser to control vLLM running on a remote GPU machine.

## Goal

Register a remote controller, list remote vLLM instances, stream logs, inspect metrics, and use remote playground chat.

## Topology

```text
MacBook / laptop browser
  -> local controller
    -> remote controller profile
      -> DGX Spark / Linux GPU box controller
        -> vLLM instance
```

## Remote machine setup

On the remote GPU machine:

```bash
cd controller
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --host 127.0.0.1 --port 8787
```

For remote access, prefer an SSH tunnel, Tailscale/WireGuard, or a reverse proxy with authentication and TLS. Do not expose the controller directly on a public interface. If you deliberately bind to `0.0.0.0`, do it only on a trusted network with external access controls in place.

## Local setup

On your laptop:

```bash
./scripts/dev.sh
```

Then open:

```text
http://127.0.0.1:5173
```

## Steps

1. Open **Remote**.
2. Add a profile:

   ```text
   Name: DGX Spark
   Base URL: http://<remote-ip>:8787
   API key: optional, depending on remote setup
   ```

3. Probe the profile.
4. Use the remote workbench to list models or running instances.
5. Start, stop, or restart a remote model.
6. Stream remote logs if needed.
7. Run **Quick test**.
8. Copy the remote OpenAI-compatible endpoint.

## Expected result

The laptop UI should control a remote vLLM server without SSHing for every operation.
