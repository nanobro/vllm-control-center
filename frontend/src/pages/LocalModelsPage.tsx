import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Play, RefreshCw, Square, Trash2 } from 'lucide-react';
import { api, LocalModelRecord } from '../api/client';
import { ModelDetail, ModelDetailDrawer } from '../components/ModelDetailDrawer';

function statusLabel(model: LocalModelRecord) {
  if (model.active_status === 'running') return 'Loaded';
  if (model.active_status) return model.active_status;
  if (model.download_status === 'completed') return 'On device';
  if (model.download_status) return model.download_status;
  return model.local_path ? 'On device' : 'Registered';
}

function modelSortValue(model: LocalModelRecord) {
  if (model.active_status === 'running') return `0-${model.display_name}`;
  if (model.local_path) return `1-${model.display_name}`;
  return `2-${model.display_name}`;
}

export function LocalModelsPage({ onOpenLogs, onOpenPlayground }: { onOpenLogs?: (id: string) => void; onOpenPlayground?: (id: string) => void }) {
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState(8000);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const local = useQuery({ queryKey: ['local-models'], queryFn: api.localModels, refetchInterval: 4000 });
  const instances = useQuery({ queryKey: ['instances'], queryFn: api.instances, refetchInterval: 2500 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...(local.data?.models ?? [])]
      .filter((model) => !q || model.model_id.toLowerCase().includes(q) || model.display_name.toLowerCase().includes(q) || model.tags.some((tag) => tag.toLowerCase().includes(q)))
      .sort((a, b) => modelSortValue(a).localeCompare(modelSortValue(b)));
  }, [local.data, query]);

  const usedPort = Boolean(instances.data?.some((item) => item.host === host && item.port === port && ['running', 'starting', 'stopping', 'stopped'].includes(item.status)));
  const selectedModel = useMemo(() => filtered.find((model) => model.id === selectedModelId) ?? filtered[0] ?? null, [filtered, selectedModelId]);
  const selectedInstance = useMemo(() => instances.data?.find((item) => item.id === selectedModel?.active_instance_id) ?? null, [instances.data, selectedModel?.active_instance_id]);

  async function act(fn: () => Promise<unknown>) {
    setError(null);
    setNotice(null);
    try {
      await fn();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['local-models'] }),
        qc.invalidateQueries({ queryKey: ['instances'] }),
      ]);
    } catch (err) {
      setError(String(err));
    }
  }

  function safeMaxContext(model: LocalModelRecord) {
    return Math.min(model.context_length ?? 4096, 4096);
  }

  function loadPayload(model: LocalModelRecord, preset: 'balanced' | 'low_vram' = 'balanced') {
    return {
      model_id: model.model_id,
      local_path: model.local_path,
      name: model.display_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      host,
      port,
      start: true,
      reuse_existing: true,
      load_preset: preset,
      ...(preset === 'low_vram' ? { gpu_memory_utilization: 0.8, max_model_len: safeMaxContext(model), extra_args: ['--max-num-seqs', '8'] } : {}),
    };
  }

  const load = useMutation({
    mutationFn: (model: LocalModelRecord) => api.loadLocalModel(loadPayload(model)),
    onSuccess: (result) => {
      const prefix = result.reused_existing ? 'Reused existing instance' : 'Created new instance';
      setNotice(result.message ?? (result.start_requested ? `${prefix}: warming up ${result.instance_name}.` : result.loaded ? `${prefix}: loaded ${result.instance_name}.` : `${prefix}, but load failed: ${result.start_error ?? 'unknown error'}`));
      if (!result.reused_existing) setPort((value) => value + 1);
      qc.invalidateQueries({ queryKey: ['local-models'] });
      qc.invalidateQueries({ queryKey: ['instances'] });
    },
    onError: (err) => setError(String(err)),
  });

  const safeLoad = useMutation({
    mutationFn: (model: LocalModelRecord) => api.loadLocalModel(loadPayload(model, 'low_vram')),
    onSuccess: (result) => {
      setNotice(result.message ?? `Retrying ${result.instance_name} with Low VRAM settings. It may take a bit to warm up.`);
      qc.invalidateQueries({ queryKey: ['local-models'] });
      qc.invalidateQueries({ queryKey: ['instances'] });
    },
    onError: (err) => setError(String(err)),
  });

  const unload = useMutation({
    mutationFn: (instanceId: string) => api.unloadLocalModel(instanceId),
    onSuccess: () => {
      setNotice('Model unloaded from server. Model files were kept on disk.');
      qc.invalidateQueries({ queryKey: ['local-models'] });
      qc.invalidateQueries({ queryKey: ['instances'] });
    },
    onError: (err) => setError(String(err)),
  });

  function endpointFor(model: LocalModelRecord | null) {
    const instance = instances.data?.find((item) => item.id === model?.active_instance_id);
    if (!instance) return null;
    const endpointHost = instance.host === '0.0.0.0' ? 'localhost' : instance.host;
    return `http://${endpointHost}:${instance.port}/v1`;
  }

  async function copyEndpoint(model: LocalModelRecord | null) {
    const endpoint = endpointFor(model);
    if (!endpoint || !navigator.clipboard) {
      setNotice('Endpoint is available after the model is loaded.');
      return;
    }
    await navigator.clipboard.writeText(endpoint);
    setNotice('OpenAI-compatible endpoint copied.');
  }

  function detailFor(model: LocalModelRecord | null): ModelDetail | null {
    if (!model) return null;
    return {
      id: model.id,
      modelId: model.model_id,
      displayName: model.group_name && model.variant_label ? `${model.group_name} — ${model.variant_label}` : model.display_name,
      modelPath: model.local_path,
      format: model.format,
      quantization: model.quantization,
      sizeLabel: model.size_label,
      architecture: model.architecture,
      contextLength: model.context_length,
      parameterCountB: model.parameter_count_b,
      fileCount: model.file_count,
      weightFileCount: model.weight_file_count,
      isMultiFile: model.is_multi_file,
      configPresent: model.config_present,
      tokenizerPresent: model.tokenizer_present,
      dtypeHint: model.dtype_hint,
      compatibilityStatus: model.compatibility_status,
      compatibilityLabel: model.compatibility_label,
      compatibilityReasons: model.compatibility_reasons,
      suggestedLoadFormat: model.suggested_load_format,
      source: model.source,
      loadedStatus: model.active_status ?? (model.loaded_instance_count ? 'running' : 'not loaded'),
      downloadStatus: model.download_status,
      instance: instances.data?.find((item) => item.id === model.active_instance_id) ?? null,
      tags: model.tags,
      notes: model.notes,
      metadataWarnings: [
        ...(model.metadata_warnings ?? []),
        ...(model.active_last_error ? [`Last load failed: ${model.active_last_error}`] : []),
      ],
      recommended: {
        dtype: 'auto',
        gpuMemoryUtilization: 0.92,
        maxModelLen: model.context_length ?? null,
        tensorParallelSize: null,
        trustRemoteCode: false,
      },
    };
  }

  const eject = useMutation({
    mutationFn: (instanceId: string) => api.deleteInstance(instanceId),
    onSuccess: () => {
      setNotice('Stopped instance ejected. Model files were not deleted.');
      qc.invalidateQueries({ queryKey: ['local-models'] });
      qc.invalidateQueries({ queryKey: ['instances'] });
    },
    onError: (err) => setError(String(err)),
  });

  return (
    <div className="stack">
      <div className="card">
        <div className="row-between">
          <div>
            <h2>Local Models</h2>
            <p>Models already on this device, from the registry, completed downloads, and the Hugging Face cache.</p>
          </div>
          <button className="btn secondary" onClick={() => local.refetch()}><RefreshCw size={15} /> Refresh</button>
        </div>
        <div className="server-toolbar">
          <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter local models by name, author, tag, or path..." />
          <label>Host<input className="input compact" value={host} onChange={(event) => setHost(event.target.value)} /></label>
          <label>Port<input className="input compact" type="number" value={port} onChange={(event) => setPort(Number(event.target.value))} /></label>
        </div>
        {usedPort && <div className="warning">Port {host}:{port} already has an instance record. If this model already has a stopped instance, Load will reuse it; otherwise choose the next free port before creating a new one.</div>}
        {error && <pre className="error">{error}</pre>}
        {notice && <div className="notice">{notice}</div>}
        {local.data?.warnings?.map((warning) => <div className="warning" key={warning}>{warning}</div>)}
      </div>

      <div className="card muted-card">
        <h3>Scanned paths</h3>
        <p>{local.data?.scanned_paths?.join(' • ') || 'Loading scan paths...'}</p>
      </div>

      <div className="model-detail-layout">
        <div className="card model-table-card">
        <div className="row-between">
          <h3>On-device catalog</h3>
          <span className="status">{filtered.length} models</span>
        </div>
        <div className="model-table">
          <div className="model-table-row model-table-head">
            <span>Model</span><span>Source</span><span>Size</span><span>Status</span><span>Path</span><span>Actions</span>
          </div>
          {filtered.map((model) => {
            const isLoaded = model.active_status === 'running';
            const canEject = model.active_instance_id && model.active_status && !['running', 'starting', 'stopping'].includes(model.active_status);
            return (
              <div className={`model-table-row selectable ${selectedModel?.id === model.id ? 'selected' : ''}`} key={model.id} onClick={() => setSelectedModelId(model.id)}>
                <div>
                  <strong title={model.display_name}>{model.display_name}</strong>
                  <p className="muted mono" title={model.model_id}>{model.model_id}</p>
                  {model.active_status === 'crashed' && model.active_last_error && (
                    <p className="inline-warning mini">Last load failed: {model.active_last_error}</p>
                  )}
                  <div className="tag-row">
                    {model.format && <span className="tag">{model.format}</span>}
                    {model.quantization && <span className="tag">{model.quantization}</span>}
                    {model.compatibility_label && <span className="tag">{model.compatibility_label}</span>}
                    {model.architecture && <span className="tag">{model.architecture}</span>}
                    {model.context_length && <span className="tag">ctx {model.context_length.toLocaleString()}</span>}
                    {model.loaded_instance_count ? <span className="tag">{model.loaded_instance_count} loaded</span> : null}
                    {model.configured_instance_count && model.configured_instance_count > 1 ? <span className="tag">{model.configured_instance_count} instances</span> : null}
                    {model.tags.slice(0, 4).map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                  </div>
                </div>
                <span>{model.source}</span>
                <span>{model.size_label ?? '—'}{model.variant_count ? <span className="muted"> · {model.variant_count} variant{model.variant_count === 1 ? '' : 's'}</span> : null}</span>
                <span className={`pill ${isLoaded ? 'running' : model.download_status ?? ''}`}>{statusLabel(model)}</span>
                <span className="path-cell" title={model.local_path ?? ''}>{model.local_path ?? '—'}</span>
                <div className="row">
                  {isLoaded ? (
                    <button className="btn secondary" disabled={unload.isPending} onClick={(event) => { event.stopPropagation(); unload.mutate(model.active_instance_id!); }}><Square size={14} /> Unload</button>
                  ) : (
                    <button className="btn" disabled={load.isPending || safeLoad.isPending || usedPort} onClick={(event) => { event.stopPropagation(); load.mutate(model); }}><Play size={14} /> {model.stopped_instance_ids?.length ? 'Load existing' : 'Load'}</button>
                  )}
                  {model.active_status === 'crashed' && <button className="btn secondary" disabled={safeLoad.isPending || usedPort} onClick={(event) => { event.stopPropagation(); safeLoad.mutate(model); }}>Low VRAM</button>}
                  {model.active_instance_id && onOpenPlayground && <button className="btn secondary" onClick={(event) => { event.stopPropagation(); onOpenPlayground(model.active_instance_id!); }}>Test</button>}
                  {model.active_instance_id && onOpenLogs && <button className="btn secondary" onClick={(event) => { event.stopPropagation(); onOpenLogs(model.active_instance_id!); }}>Logs</button>}
                  {canEject && <button className="btn secondary" onClick={(event) => { event.stopPropagation(); eject.mutate(model.active_instance_id!); }}><Trash2 size={14} /> Eject</button>}
                  {model.download_status && <span className="download-inline"><Download size={13} /> {model.download_status}</span>}
                </div>
              </div>
            );
          })}
          {!filtered.length && <p className="muted">No local models found yet. Download one from Server or Hugging Face, or register an existing local path.</p>}
          </div>
        </div>
        <ModelDetailDrawer
          detail={detailFor(selectedModel)}
          loading={load.isPending || safeLoad.isPending || unload.isPending}
          endpoint={endpointFor(selectedModel)}
          onClose={() => setSelectedModelId(null)}
          onLoad={selectedModel ? () => load.mutate(selectedModel) : undefined}
          onSafeLoad={selectedModel ? () => safeLoad.mutate(selectedModel) : undefined}
          onUnload={selectedModel?.active_instance_id ? () => unload.mutate(selectedModel.active_instance_id!) : undefined}
          onOpenLogs={selectedModel?.active_instance_id && onOpenLogs ? () => onOpenLogs(selectedModel.active_instance_id!) : undefined}
          onTest={selectedModel?.active_instance_id && onOpenPlayground ? () => onOpenPlayground(selectedModel.active_instance_id!) : undefined}
          onCopyEndpoint={() => copyEndpoint(selectedModel)}
        />
      </div>
    </div>
  );
}
