# Public Beta Walkthrough

This is the short demo path for README screenshots, launch videos, and beta testers.

## Positioning

vLLM Control Center is **LM Studio UX + vLLM power + remote GPU ops**. It is not a generic chat app. The user outcome is an OpenAI-compatible `/v1` endpoint.

## Happy path

1. Run `./scripts/bootstrap.sh`.
2. Run `./scripts/dev.sh`.
3. Open the frontend URL.
4. Stay in **Daily mode**.
5. Open **Run Model**.
6. Select a detected model or download a starter model.
7. Click **Load**.
8. Run **Quick test**.
9. Open **Use this endpoint in your app**.
10. Copy the base URL, model name, curl example, or SDK snippet.

## Screenshot setup

Use safe demo data:

- Model: `Qwen/Qwen3-0.6B` for a small starter path.
- Coding model: `Qwen/Qwen2.5-Coder-7B-Instruct`.
- Larger local GPU model: `Qwen/Qwen3-14B`.
- Local endpoint: `http://127.0.0.1:8000/v1`.
- Remote profile: `demo-dgx-01`.

## What not to show

- Hugging Face token values.
- Real API keys.
- Real private IPs or hostnames.
- Customer or company model paths.
- Internal milestone wording like v21/v22/v23 feature names in the live app.

## Demo success criteria

A viewer should understand in five seconds:

- which model is selected,
- whether it is running,
- where the `/v1` endpoint is,
- how to test it,
- and how to stop it.
