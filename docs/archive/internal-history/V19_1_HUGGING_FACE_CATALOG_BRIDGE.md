# v19.1 — Hugging Face Catalog Bridge

v19.1 adds an online Hugging Face search path to the Server/Model Hub flow.

The built-in catalog remains available for offline demos and curated defaults, but users can now search Hugging Face at runtime, register a result, queue a download, or create/start a vLLM instance from the search result.

## Backend

New routes:

```text
GET  /api/model-hub/hf/search?query=qwen&limit=20&hf_token_env=HF_TOKEN
POST /api/model-hub/hf/register
POST /api/model-hub/hf/download
POST /api/model-hub/hf/quick-launch
```

Tokens are read from environment variables on the controller side. The browser sends the env var name, not the token value.

Example:

```bash
export HF_TOKEN=hf_...
uvicorn app.main:app --reload --port 8787
```

## Frontend

The Server page now has a catalog source selector:

- Built-in catalog
- Hugging Face search

When Hugging Face is selected, search results can be registered/downloaded/launched using the same Server page flow.

## Notes

Hugging Face search needs outbound internet access from the controller machine. Private or gated models still require accepted terms on Hugging Face and a valid token in the controller environment.
