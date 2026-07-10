# v0.33 — Real vLLM Happy-Path Validation Pass

## Why this pass exists

v0.32 made failed loads easier to understand. v0.33 fixes the next trust problem: a `vllm serve` process can spawn before the OpenAI-compatible endpoint is actually ready.

Daily mode should not show false confidence. A model is only ready for the user path after the endpoint responds.

## Product intent

Keep the path calm and LM Studio-like:

```text
Pick model -> Start -> Test -> Copy OpenAI base URL
```

This pass keeps Qwen3.6 and large Qwen text-generation models runnable. Size alone is not a blocker. Long warm-up is normal for large models, so the UI should explain warm-up instead of calling it success or failure too early.

## Shipped behavior

- `vllm serve` process launch sets the instance to `starting`.
- The controller probes `/v1/models` and falls back to `/health`.
- The instance becomes `running` only after the endpoint responds.
- If vLLM exits before readiness, the existing v0.32 crash diagnosis path marks it `crashed` with a plain reason.
- If a large model is still loading after the readiness window, the instance remains `starting` and logs explain that the model may still be loading.
- Run Model shows **Warming up** and a Logs action while readiness is pending.

## Non-goals

- Do not add more dashboard cards.
- Do not move raw tracebacks into main rows.
- Do not block large Qwen text models because they are large.
- Do not promise signed Electron installers, auto-update, or desktop-managed controller lifecycle.

## Verification notes

Automated checks can verify the state machine and endpoint probing helpers. A real vLLM-capable machine is still needed for final manual confidence on actual model load, quick test, and external `/v1` usage.
