# v21.1 agent prompts

Use v21.1 only.

Focus QA on the on-device model picker:

1. Add a scan path containing multiple GGUF variants in the same folder.
2. Confirm the Server page source `This device` groups those variants under one model family.
3. Select Q4/Q5/Q8 variants and confirm the chosen local path is passed to `/api/local-models/load`.
4. Confirm Load reuses running/stopped instances and does not create duplicates unless explicitly requested.
5. Confirm the scanner remains read-only and does not mutate model files.

Recommended test directory:

```text
/data/models/TinyLlama-GGUF/tinyllama.Q4_K_M.gguf
/data/models/TinyLlama-GGUF/tinyllama.Q5_K_M.gguf
/data/models/TinyLlama-GGUF/tinyllama.Q8_0.gguf
```
