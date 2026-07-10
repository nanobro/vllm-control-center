# v21.6 — Navigation Simplification / Unified Models Library

## Goal

Reduce tab-hunting and make the app feel closer to LM Studio without hiding vLLM power.

The user should not need to know whether a model belongs in **This Device**, **Local Models**, or **Downloads**. They should see one **Models** area with clear status labels and obvious actions.

## Product decision

Primary navigation now focuses on four workflows:

1. **Run Model** — fastest path to choose, load, test, and copy endpoint
2. **Models** — unified library for local files and download jobs
3. **Remote** — remote GPU/controller ops
4. **Settings** — controller/security settings

Advanced/operator pages remain under Advanced tools.

## Implemented

- Added `ModelsLibraryPage`.
- Combined local model records and download jobs into one library list.
- Added filters:
  - All
  - This device
  - Downloads
  - Running
  - Needs attention
- Added summary counters:
  - ready local models
  - active downloads
  - completed downloads
  - running instances
- Added simple actions from the list:
  - Load
  - Unload
  - Cancel download
  - Retry download
  - Remove terminal download record
  - Open Logs
- Added simple Hugging Face model ID download form.
- Added scan path form for users with custom model folders.
- Reused the v21.4 Model Detail Drawer for path, format, quantization, loaded status, download status, recommended settings, logs, test, and endpoint copy.

## UX notes

- **Run Model** remains the guided flow.
- **Models** is the library/inventory.
- Legacy Local Models and Downloads pages remain wired internally for compatibility, but they are no longer top-level nav items.
- Do not add more primary tabs until there is strong evidence that a workflow cannot fit into Run Model, Models, Remote, or Settings.

## Manual QA checklist

- Sidebar shows only Run Model, Models, Remote, and Settings before Advanced tools.
- Models page shows local models and download jobs in one list.
- Filters correctly narrow to device/download/running/attention items.
- Selecting any row opens the detail drawer.
- A ready local model can be loaded from the Models page.
- A running model can be unloaded from the Models page.
- An active download can be cancelled.
- A failed download can be retried.
- Completed downloads can be loaded when `local_dir` is available.
- Copy endpoint is only available when an instance exists.
- Run Model still works as the primary guided flow.
