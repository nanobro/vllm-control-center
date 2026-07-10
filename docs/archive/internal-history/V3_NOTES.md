# v3 Notes

This version moves the starter from a static launcher into a more complete control-center skeleton.

## Added in v3

### Backend

- Live log streaming endpoint: `GET /api/instances/{id}/logs/stream`
- Streaming playground endpoint: `POST /api/playground/chat/stream`
- Model registry API: `GET/POST/PATCH/DELETE /api/models`
- Recipe API: `GET/POST/PATCH/DELETE /api/recipes`
- Create instance from recipe: `POST /api/recipes/{id}/create-instance`
- Chat history API:
  - `GET/POST /api/chat/sessions`
  - `GET/POST /api/chat/sessions/{id}/messages`
  - `DELETE /api/chat/sessions/{id}`
- SQLite tables for models, recipes, chat sessions, and chat messages

### Frontend

- Live SSE logs page
- Streaming playground toggle with token-by-token output
- Model Registry page
- Recipes page
- Chat History page

## Current limitations

- Chat history persistence is basic; the streaming playground can save assistant results if a session ID is passed, but the UI does not yet let users bind a playground run to a session.
- Model registry stores metadata only. It does not download Hugging Face models yet.
- Recipe editor is intentionally minimal. Advanced vLLM flags are still edited through instance creation for now.
- Remote controller mode is not implemented yet.

## Suggested next milestone

Build `Remote Controller Profiles`:

- Store controller profiles: local, remote LAN, SSH tunnel
- Add controller API key support
- Add UI for switching controller base URL
- Add security checks for non-localhost bind

## Verification

At v3 creation:

- Backend tests: `10 passed`
- Frontend build: passed after `npm install`
