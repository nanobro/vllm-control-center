# v19.2 — Fresh Model Discovery Fix

v19.1 added Hugging Face search, but the docs and UI still nudged users toward example model names. That is not good enough for a model ecosystem that changes every day.

v19.2 makes Hugging Face discovery mode-first instead of example-first.

## What changed

- Server page Hugging Face source now supports discovery modes:
  - Trending now
  - Most downloaded
  - Most liked
  - Recently updated
  - Search relevance
- Hugging Face search no longer requires a query for discovery modes.
- The backend exposes the same modes through `/api/model-hub/hf/search`.
- The UI lets users optionally filter by task/profile:
  - LLM / text generation
  - Coding
  - Embeddings
  - Vision-language
  - All tasks
- The UI supports optional author/org filtering.
- The public README avoids naming a specific model as the recommended current choice.

## Why

Hardcoded examples go stale quickly. The app should help users discover what is popular or recently updated at runtime instead of depending on our release-time opinions.

## API examples

Browse current trending LLM-style models:

```http
GET /api/model-hub/hf/search?mode=trending&task=llm&limit=20&hf_token_env=HF_TOKEN
```

Browse recently updated models:

```http
GET /api/model-hub/hf/search?mode=recently_updated&task=all&limit=20
```

Search within an org:

```http
GET /api/model-hub/hf/search?query=vision&author=some-org&mode=search&task=all
```

## Notes

The controller reads the token from the named environment variable. The frontend sends only the environment variable name, not the token value.

`trending` uses Hugging Face's `likes7d` sort, matching public guidance from Hugging Face Hub maintainers.
