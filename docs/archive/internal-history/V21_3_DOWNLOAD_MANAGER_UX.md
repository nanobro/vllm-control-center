# v21.3 — Download Manager UX Like LM Studio

v21.3 makes the Downloads page feel more like an app-level download manager instead of a raw job table.

## Goals

- Make download progress obvious.
- Keep the default download form simple.
- Show the selected quant/file target when `allow_patterns` are used.
- Make completed downloads actionable immediately.
- Clarify that deleting a job does not delete model files.

## Changes

### Simplified new download form

The page now starts with only the fields most users need:

- Model ID
- Target folder
- Queue download

Advanced options are tucked away:

- Revision
- HF token environment variable
- Register completed download
- Dry run

### Download summary strip

The top of the page now shows:

- Active downloads
- Ready downloads
- Failed downloads
- Total fetched bytes

### Status filters

Users can filter the queue by:

- All
- Active
- Completed
- Failed
- Cancelled

### Card-based download list

Each download job is now a card with:

- Status pill
- Progress bar
- Current file
- Selected target pattern / quant file
- Local path
- Retry / cancel / delete actions

### Completed download actions

Completed jobs now expose clearer actions:

- Load now
- View in Local Models
- Delete job

`Load now` calls the local model loading flow with the downloaded local path.

### Error guidance

Download cards give plain-language hints for common cases:

- Missing `huggingface_hub`
- HF token / gated model issues
- Disk space issues
- Generic retry guidance

## Non-goals

- No model files are deleted.
- No pause/resume is attempted; Hugging Face snapshot downloads are represented as cancel/retry.
- No changes to the local model scanner.

