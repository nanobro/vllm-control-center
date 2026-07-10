# v5 Agent Prompts

## Baseline instruction

```text
Inspect the repository first. Do not rewrite it from scratch.

Continue from v5 of vLLM Control Center.

Product direction:
- This is an LM Studio-style control plane for vLLM.
- It is not another generic chat UI.
- Preserve the FastAPI controller + React/Vite frontend architecture.
- Preserve safe subprocess execution. Never use shell=True.
- Preserve remote controller profiles and the Remote Instance Bridge.
- Add tests for new backend behavior.
- Run pytest and npm build.
- Summarize changed files and manual test steps.
```

## Next milestone: Remote Playground Bridge

```text
Implement Remote Playground Bridge.

Backend:
1. Add POST /api/remote-profiles/{profile_id}/instances/{remote_instance_id}/playground/chat
2. Add POST /api/remote-profiles/{profile_id}/instances/{remote_instance_id}/playground/chat/stream
3. The local controller should fetch the remote instance record, then forward OpenAI-compatible chat requests through the remote controller to the remote vLLM server.
4. Preserve API key behavior on both layers:
   - remote controller API key is stored only in local profile
   - vLLM instance API key is handled by remote controller
5. Support non-streaming and streaming responses.
6. Return readable errors for:
   - remote profile missing
   - remote instance missing
   - remote controller unreachable
   - remote vLLM server unreachable
7. Add tests with a fake remote controller.

Frontend:
1. Add remote mode to Playground page or create Remote Playground page.
2. Let user choose remote profile and remote instance.
3. Support streaming toggle.
4. Show latency and errors.
5. Save chat transcript locally with metadata for remote profile and remote instance.

Quality:
- Do not break local playground.
- Do not expose remote profile API keys in frontend or logs.
- Run backend tests and frontend build.
```
