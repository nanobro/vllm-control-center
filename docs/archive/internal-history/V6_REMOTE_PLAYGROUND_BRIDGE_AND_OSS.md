# V6: Remote Playground Bridge and Open Source Readiness

V6 turns the remote workflow into a full loop:

```text
Laptop UI
  -> local controller
    -> saved remote controller profile
      -> remote controller on DGX Spark / GPU workstation
        -> remote vLLM instance
          -> OpenAI-compatible chat completions
```

## What changed

### Remote Playground Bridge

New local bridge routes:

```text
POST /api/remote-profiles/{profile_id}/instances/{remote_instance_id}/playground/chat
POST /api/remote-profiles/{profile_id}/instances/{remote_instance_id}/playground/chat/stream
```

The local controller forwards only to the remote controller's `/api/playground/...` routes. It does not directly proxy arbitrary model endpoints and it still uses the existing safe `/api/...` remote path guard.

### Frontend

New page:

```text
Remote Playground
```

The page lets a local browser select:

- remote controller profile
- running remote instance
- system prompt
- user prompt
- streaming on/off

### Open source readiness

Added:

- `LICENSE`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CODE_OF_CONDUCT.md`
- `ROADMAP.md`
- `.github/ISSUE_TEMPLATE/*`
- `.github/pull_request_template.md`
- `.github/workflows/ci.yml`

## Security notes

- Remote profile API responses still do not expose raw API keys.
- Remote bridge routes inject the remote instance id server-side.
- The generic remote forwarder still blocks non-`/api/...` paths, URLs, traversal, and backslashes.
- Streaming bridge keeps the remote controller as the only upstream target.

## Manual test path

1. Run controller on the remote GPU box.
2. Create/start a vLLM instance on the remote controller.
3. Run local controller and frontend on your laptop.
4. Add the remote controller profile.
5. Open Remote Instances and verify the remote instance appears.
6. Open Remote Playground.
7. Select the profile and running remote instance.
8. Send a streaming chat prompt.

## Next recommended milestone

V7 should implement Hugging Face Model Download Queue:

- download jobs
- progress tracking
- cancellation
- dry-run fake downloader for tests
- optional registration into model registry after success
