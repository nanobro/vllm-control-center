# Demo: Use with a Coding Agent

## Goal

Run a vLLM model locally or remotely, then connect a coding agent or OpenAI-compatible SDK client to it.

## Steps

1. Start a vLLM instance from Control Center.
2. Open **Exports**.
3. Copy the Python or TypeScript OpenAI SDK snippet.
4. Set your agent's base URL to the instance endpoint:

   ```text
   http://127.0.0.1:8000/v1
   ```

5. Use the model name shown in the export bundle.

## Suggested settings

For coding agents, start with conservative sampling:

```text
Temperature: 0.2
Top P: 0.95
Context: as high as your VRAM allows safely
```

## Notes

For remote GPU machines, prefer a secure tunnel or VPN rather than exposing the vLLM endpoint directly to the public internet.
