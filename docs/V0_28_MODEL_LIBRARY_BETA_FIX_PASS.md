# v0.28 — Model Library Beta Fix Pass

v0.28 stays inside the public beta feedback lane. It does not add a new product surface. It tightens the **Models** page so beta testers can recover from common library confusion faster.

## Goals

- Keep Daily mode frozen.
- Make model rows easier to scan.
- Keep local filesystem paths out of the default row view.
- Make filtered-empty states recoverable with one click.
- Keep the detail drawer as the place for exact paths, metadata, compatibility reasons, logs, testing, and endpoint actions.

## UI changes

### Model row noise reduction

The Models page no longer shows long local filesystem paths in the default row chip list. The row now highlights source, compatibility, format, quantization, and size. Exact paths remain in the model detail drawer.

### Filtered-empty recovery

When the library has models but the current search/filter hides them, the page now shows a focused empty state with:

- Clear search
- Show all models

This avoids sending testers to a different page when the fix is simply to reset the current view.

## Non-goals

- No new Daily mode cards.
- No new navigation sections.
- No generic chat UI.
- No signed desktop installer promise.
- No automatic desktop controller lifecycle promise.
- No broad remote GPU redesign.

## Verification expectation

Run:

```bash
./scripts/version-scheme-check.sh
./scripts/release-freeze-check.sh
./scripts/bug-bash-check.sh
./scripts/check-screenshots.sh
./scripts/smoke.sh
./scripts/check.sh
```

Expected local warnings remain acceptable when `vllm`, `nvidia-smi`, or a running controller are unavailable in the packaging environment.
