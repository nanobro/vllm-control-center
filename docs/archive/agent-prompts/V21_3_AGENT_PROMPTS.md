# v21.3 Agent Prompts

Use v21.3 only.

## QA prompt

Install v21.3 and focus on the Downloads page.

Verify:

1. The default download form is simple and does not overwhelm the user.
2. Advanced download options are hidden behind the advanced panel.
3. Active / completed / failed filters work.
4. Progress bars update through the existing SSE stream.
5. Jobs created from HF variants show their `allow_patterns` as the selected target.
6. Completed jobs offer View in Local Models.
7. Completed jobs with a local path offer Load now.
8. Delete job only removes the job record and does not imply deleting model files.
9. Error hints are readable for missing `huggingface_hub`, gated models, token problems, and disk issues.

Preferred DGX test:

- Start one dry-run job.
- Start one real small model download if bandwidth allows.
- Confirm completed jobs appear in Local Models after refresh/rescan.
- Use Load now on a completed job with a local path.

