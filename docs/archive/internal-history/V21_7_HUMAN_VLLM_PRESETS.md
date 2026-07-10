# v21.7 — Human vLLM Presets

## Goal

Make the normal Run Model flow easier by replacing raw vLLM tuning fields with human intent presets.

Users should not need to understand `--gpu-memory-utilization`, `--max-model-len`, or batching flags before their first successful load. Advanced users can still use exact settings by choosing **Custom** and expanding **Advanced load settings**.

## UX changes

### Run Model now starts from intent

The Load Settings card now has a **Choose how to run it** preset chooser:

- **Fast test** — small context and lighter scheduling for quick smoke tests.
- **Balanced** — recommended everyday default.
- **Long context** — larger context window for docs, RAG, and coding context.
- **High throughput** — batching-friendly defaults for shared API traffic.
- **Low VRAM** — shorter context and lower memory utilization to reduce OOM failures.
- **Custom** — use exact values from Advanced load settings.

The app shows a compact summary of the applied settings:

- dtype
- GPU memory target
- max context
- tensor parallel
- preset-added args

### Advanced settings are still available

Advanced load settings remain in place for operators. When a preset is active, exact low-level fields such as dtype, GPU memory, max context, and tensor parallel are intentionally disabled to avoid conflicting mental models.

Choosing **Custom** enables those exact controls again.

## Behavior

Preset values are applied at load/create time through the existing instance config path. No backend schema change was required.

The preset layer maps to vLLM settings as follows:

| Preset | Intent | Applied defaults |
| --- | --- | --- |
| Fast test | Quick first run | GPU memory 0.86, max context up to 4K, `--max-num-seqs 16` |
| Balanced | Everyday default | suggested dtype, GPU memory, context capped around 8K when known |
| Long context | Larger prompts | GPU memory 0.94, context up to 32K |
| High throughput | More concurrent API traffic | GPU memory 0.94, context up to 8K, `--max-num-seqs 128`, `--enable-prefix-caching` |
| Low VRAM | Reduce OOM risk | GPU memory 0.76, context up to 4K, `--max-num-seqs 8` |
| Custom | Exact operator control | uses Advanced load setting fields |

## Model Detail Drawer

The detail drawer now includes the active preset name and description in the recommended vLLM settings section. This helps the selected model, the load button, and the resulting endpoint all feel connected.

## Design notes

- Presets are intentionally descriptive, not exhaustive.
- The default remains **Balanced**.
- Advanced/operator concepts stay hidden until the user expands them.
- This keeps the project aligned with its positioning: LM Studio UX + vLLM power + remote GPU ops.

## QA checklist

- Open Run Model.
- Confirm Balanced is selected by default.
- Select each preset and verify the summary chips update.
- Confirm non-Custom presets disable low-level exact fields in Advanced load settings.
- Select Custom and confirm exact fields become editable.
- Create/load a model and verify generated config receives the preset values.
- Confirm Model Detail Drawer shows the preset name and description.
