# Demo: Connect Open WebUI

vLLM Control Center is not trying to replace Open WebUI. Instead, it can manage the vLLM endpoint that Open WebUI connects to.

## Goal

Launch vLLM from Control Center and use the exported OpenAI-compatible endpoint in Open WebUI.

## Steps

1. Create and start a local or remote vLLM instance.
2. Open **Exports**.
3. Copy the Open WebUI notes.
4. In Open WebUI, add an OpenAI-compatible provider.
5. Use the base URL shown by Control Center, typically:

   ```text
   http://127.0.0.1:8000/v1
   ```

6. If the instance uses an API key, paste that key into Open WebUI.

## Expected result

Open WebUI becomes the chat frontend while vLLM Control Center remains the launcher, monitor, and config/export tool.
