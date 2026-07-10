import { useEffect, useMemo, useState } from 'react';
import { api, CompatibilityResponse, DoctorReport, ModelRecord } from '../api/client';

function mbToGb(value?: number | null) {
  if (value == null) return 'unknown';
  const sign = value < 0 ? '-' : '';
  return `${sign}${(Math.abs(value) / 1024).toFixed(1)} GB`;
}

function verdictLabel(verdict?: string) {
  if (!verdict) return 'Not estimated yet';
  return verdict.split('_').join(' ');
}

function applyPatch<T extends Record<string, unknown>>(patch: T, setters: Record<string, (value: string) => void>) {
  for (const [key, value] of Object.entries(patch)) {
    if (setters[key]) setters[key](String(value));
  }
}

export function CompatibilityPage() {
  const [modelId, setModelId] = useState('Qwen/Qwen3-7B');
  const [parameterCount, setParameterCount] = useState('');
  const [architecture, setArchitecture] = useState('auto');
  const [dtype, setDtype] = useState('auto');
  const [quantBits, setQuantBits] = useState('');
  const [cacheDtype, setCacheDtype] = useState('auto');
  const [maxModelLen, setMaxModelLen] = useState('32768');
  const [expectedConcurrency, setExpectedConcurrency] = useState('1');
  const [gpuTotal, setGpuTotal] = useState('');
  const [gpuFree, setGpuFree] = useState('');
  const [gpuUtil, setGpuUtil] = useState('0.92');
  const [tp, setTp] = useState('1');
  const [hiddenSize, setHiddenSize] = useState('');
  const [numLayers, setNumLayers] = useState('');
  const [attentionHeads, setAttentionHeads] = useState('');
  const [kvHeads, setKvHeads] = useState('');
  const [headDim, setHeadDim] = useState('');
  const [result, setResult] = useState<CompatibilityResponse | null>(null);
  const [doctor, setDoctor] = useState<DoctorReport | null>(null);
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [selectedModelRecord, setSelectedModelRecord] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.doctor().then((report) => {
      setDoctor(report);
      useDetectedGpu(report);
    }).catch(() => undefined);
    api.models().then(setModels).catch(() => undefined);
  }, []);

  function useDetectedGpu(report = doctor) {
    const gpu = report?.gpus?.[0];
    if (gpu?.memory_total_mb) setGpuTotal(String(gpu.memory_total_mb));
    if (gpu?.memory_total_mb && gpu?.memory_used_mb != null) {
      setGpuFree(String(Math.max(0, gpu.memory_total_mb - gpu.memory_used_mb)));
    }
  }

  function useModelRegistryRecord(id: string) {
    setSelectedModelRecord(id);
    const record = models.find((model) => model.id === id);
    if (!record) return;
    setModelId(record.model_id);
    if (record.context_length) setMaxModelLen(String(record.context_length));
    if (record.dtype_hint) setDtype(record.dtype_hint);
  }

  const recipeName = useMemo(() => `Compatibility: ${modelId}`, [modelId]);

  function requestBody() {
    return {
      model_id: modelId,
      parameter_count_b: parameterCount ? Number(parameterCount) : null,
      architecture,
      dtype,
      quantization_bits: quantBits ? Number(quantBits) : null,
      cache_dtype: cacheDtype,
      max_model_len: Number(maxModelLen),
      expected_concurrency: Number(expectedConcurrency),
      gpu_memory_total_mb: gpuTotal ? Number(gpuTotal) : null,
      gpu_memory_free_mb: gpuFree ? Number(gpuFree) : null,
      gpu_memory_utilization: Number(gpuUtil),
      tensor_parallel_size: Number(tp),
      hidden_size: hiddenSize ? Number(hiddenSize) : null,
      num_layers: numLayers ? Number(numLayers) : null,
      num_attention_heads: attentionHeads ? Number(attentionHeads) : null,
      num_kv_heads: kvHeads ? Number(kvHeads) : null,
      head_dim: headDim ? Number(headDim) : null,
    };
  }

  async function estimate() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      setResult(await api.estimateCompatibility(requestBody()));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function createRecipe() {
    setError(null);
    setMessage(null);
    try {
      const recipe = await api.createCompatibilityRecipe({
        name: recipeName,
        model_id: modelId,
        dtype,
        max_model_len: Number(maxModelLen),
        gpu_memory_utilization: Number(gpuUtil),
        tensor_parallel_size: Number(tp),
        quantization_bits: quantBits ? Number(quantBits) : null,
        cache_dtype: cacheDtype,
      });
      setMessage(`Recipe created: ${recipe.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const patchSetters: Record<string, (value: string) => void> = {
    max_model_len: setMaxModelLen,
    tensor_parallel_size: setTp,
    quantization_bits: setQuantBits,
    cache_dtype: setCacheDtype,
    gpu_memory_utilization: setGpuUtil,
  };

  return (
    <div className="stack">
      <div className="card">
        <h2>Model Compatibility Advisor</h2>
        <p className="muted">Estimate whether a model will likely fit before you launch vLLM. This is a planning estimate, not a guarantee.</p>
        <div className="row">
          {doctor?.gpus?.length ? <p className="muted">Detected GPU: {doctor.gpus[0].name} · {mbToGb(doctor.gpus[0].memory_total_mb)}</p> : <p className="muted">No detected GPU yet. You can still enter memory manually.</p>}
          <button className="btn secondary" onClick={() => useDetectedGpu()}>Use detected GPU</button>
        </div>
      </div>

      <div className="card form">
        <div className="grid">
          <label>From Model Registry<select className="input" value={selectedModelRecord} onChange={(e) => useModelRegistryRecord(e.target.value)}><option value="">Manual model ID</option>{models.map((model) => <option key={model.id} value={model.id}>{model.display_name} · {model.model_id}</option>)}</select></label>
          <label>Model ID<input className="input" value={modelId} onChange={(e) => setModelId(e.target.value)} /></label>
          <label>Architecture preset<select className="input" value={architecture} onChange={(e) => setArchitecture(e.target.value)}><option>auto</option><option>qwen</option><option>llama</option><option>mistral</option><option>mixtral</option><option>deepseek</option><option>custom</option></select></label>
          <label>Parameter count, B optional<input className="input" value={parameterCount} onChange={(e) => setParameterCount(e.target.value)} placeholder="auto from model name" /></label>
          <label>Dtype<select className="input" value={dtype} onChange={(e) => setDtype(e.target.value)}><option>auto</option><option>float16</option><option>bfloat16</option><option>float32</option><option>int8</option><option>int4</option></select></label>
          <label>Quantization bits optional<input className="input" value={quantBits} onChange={(e) => setQuantBits(e.target.value)} placeholder="4 or 8" /></label>
          <label>KV cache dtype<select className="input" value={cacheDtype} onChange={(e) => setCacheDtype(e.target.value)}><option>auto</option><option>float16</option><option>bfloat16</option><option>fp8</option><option>fp8_e4m3</option><option>fp8_e5m2</option></select></label>
          <label>Max model length<input className="input" value={maxModelLen} onChange={(e) => setMaxModelLen(e.target.value)} /></label>
          <label>Expected concurrency<input className="input" value={expectedConcurrency} onChange={(e) => setExpectedConcurrency(e.target.value)} /></label>
          <label>GPU total MB<input className="input" value={gpuTotal} onChange={(e) => setGpuTotal(e.target.value)} placeholder="49152" /></label>
          <label>GPU free MB optional<input className="input" value={gpuFree} onChange={(e) => setGpuFree(e.target.value)} placeholder="uses total if blank" /></label>
          <label>GPU memory utilization<input className="input" value={gpuUtil} onChange={(e) => setGpuUtil(e.target.value)} /></label>
          <label>Tensor parallel size<input className="input" value={tp} onChange={(e) => setTp(e.target.value)} /></label>
          <label>Hidden size optional<input className="input" value={hiddenSize} onChange={(e) => setHiddenSize(e.target.value)} placeholder="auto" /></label>
          <label>Layers optional<input className="input" value={numLayers} onChange={(e) => setNumLayers(e.target.value)} placeholder="auto" /></label>
          <label>Attention heads optional<input className="input" value={attentionHeads} onChange={(e) => setAttentionHeads(e.target.value)} placeholder="auto" /></label>
          <label>KV heads optional<input className="input" value={kvHeads} onChange={(e) => setKvHeads(e.target.value)} placeholder="auto" /></label>
          <label>Head dim optional<input className="input" value={headDim} onChange={(e) => setHeadDim(e.target.value)} placeholder="auto" /></label>
        </div>
        <div className="row">
          <button className="btn" onClick={estimate} disabled={loading}>{loading ? 'Estimating...' : 'Estimate fit'}</button>
          <button className="btn secondary" onClick={createRecipe}>Create recipe from settings</button>
        </div>
        {error && <p className="error">{error}</p>}
        {message && <p>{message}</p>}
      </div>

      {result && (
        <>
          <div className={`card verdict-${result.verdict}`}>
            <div className="row-between">
              <div>
                <div className="label">Verdict</div>
                <div className="value">{verdictLabel(result.verdict)}</div>
                <p>{result.summary}</p>
              </div>
              <span className={`pill ${result.verdict}`}>{result.confidence} confidence</span>
            </div>
          </div>

          <div className="grid">
            <div className="card"><div className="label">Estimated required</div><div className="value">{mbToGb(result.estimate.estimated_required_mb)}</div></div>
            <div className="card"><div className="label">Usable GPU memory</div><div className="value">{mbToGb(result.estimate.usable_gpu_memory_mb)}</div></div>
            <div className="card"><div className="label">Memory gap</div><div className="value">{mbToGb(result.estimate.memory_gap_mb)}</div></div>
          </div>

          <div className="card">
            <h3>Estimate breakdown</h3>
            <div className="small-grid">
              <span>Weights: {mbToGb(result.estimate.model_weights_mb)}</span>
              <span>KV cache: {mbToGb(result.estimate.kv_cache_mb)}</span>
              <span>Overhead: {mbToGb(result.estimate.overhead_mb)}</span>
              <span>Safety margin: {mbToGb(result.estimate.safety_margin_mb)}</span>
            </div>
          </div>

          <div className="card">
            <h3>Architecture used</h3>
            <pre>{JSON.stringify(result.architecture_used, null, 2)}</pre>
          </div>

          <div className="card">
            <h3>Suggested vLLM settings</h3>
            <pre>{JSON.stringify(result.suggested_vllm_settings, null, 2)}</pre>
            <h4>Copyable args</h4>
            <pre>{result.copyable_vllm_args.join(' ') || '(no extra args needed)'}</pre>
          </div>

          <div className="card">
            <h3>Recommendations</h3>
            {result.recommendations.map((rec) => <div className="item" key={rec.title}><strong>{rec.title}</strong><p>{rec.description}</p><pre>{JSON.stringify(rec.config_patch, null, 2)}</pre>{rec.vllm_args?.length ? <p><button className="btn secondary" onClick={() => applyPatch(rec.config_patch, patchSetters)}>Apply recommendation</button></p> : <button className="btn secondary" onClick={() => applyPatch(rec.config_patch, patchSetters)}>Apply recommendation</button>}</div>)}
          </div>

          <div className="card">
            <h3>Assumptions and warnings</h3>
            {result.warnings.map((w) => <p className="error" key={w}>Warning: {w}</p>)}
            {result.assumptions.map((a) => <p className="muted" key={a}>{a}</p>)}
          </div>
        </>
      )}
    </div>
  );
}
