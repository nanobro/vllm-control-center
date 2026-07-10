# Beta Demo Data

Use this when preparing screenshots, README assets, or a short demo video for the public beta.

## Demo story

Show one clean path:

```text
Open app -> setup is checked -> model appears -> load -> quick test -> copy /v1 endpoint
```

Then show the differentiator:

```text
Remote GPU profile -> GPU health -> running endpoint -> logs/test/restart
```

## Recommended local states

### 1. Fresh install / no models

Useful for showing first-run guidance.

Expected UI:

- Run Model shows one calm first-launch card or a plain Setup check only when attention is needed.
- Models page shows empty-state actions.
- No scary stack traces.

### 2. Local model detected

Prepare one small local model in `./models` or scan Hugging Face cache.

Good example:

```text
Qwen/Qwen3-0.6B
```

Expected UI:

- Models library shows a ready model.
- Model Detail Drawer shows path, format, size, source, status, and Load action.

### 3. Download manager visible

Queue one small model or use a controlled dry-run in development.

Expected UI:

- Active or completed download card.
- Progress/status visible.
- Load now available after completion when possible.

### 4. Endpoint success

Load one model and run the quick test.

Expected UI:

- Running status.
- Quick test response.
- Copy endpoint button.
- Endpoint should look like:

```text
http://127.0.0.1:8000/v1
```

### 5. Remote GPU profile

Add one remote controller profile. A real GPU host is best, but a local second controller profile is acceptable for screenshots if clearly documented.

Expected UI:

- Connected/disconnected state.
- Latency/auth status.
- GPU memory card when metrics are available.
- Remote model endpoint + Start/Stop/Restart/Logs/Test controls.

## Screenshot filenames

```text
01-run-model.png
02-models.png
03-endpoint-success.png
04-remote.png
05-setup-check.png
```
