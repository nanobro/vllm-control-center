# Demo: Local vLLM Launch

This demo shows the basic local workflow.

## Goal

Start a local vLLM server, watch logs, test chat, inspect metrics, and export a reproducible command.

## Steps

1. Start the dev stack:

   ```bash
   ./scripts/dev.sh
   ```

2. Open the frontend:

   ```text
   http://127.0.0.1:5173
   ```

3. Open **Setup check** if the first-launch card says setup needs attention.

4. Confirm Python, vLLM, GPU, model source, and port checks.

5. Open **Run Model**.

6. Choose or enter a model with:

   ```text
   Model: Qwen/Qwen3-0.6B
   Host: 127.0.0.1
   Port: 8000
   GPU memory utilization: 0.85
   ```

7. Load the model.

8. Run **Quick test**.

9. Open **Use this endpoint in your app** and copy the OpenAI-compatible base URL or SDK snippet.

10. Open Advanced mode only if you need logs, metrics, or deeper diagnostics.

## Expected result

You should have a local OpenAI-compatible endpoint:

```text
http://127.0.0.1:8000/v1
```
