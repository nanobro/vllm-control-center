import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Download, HardDrive, Loader2, Play, RefreshCw, Search, Square, Trash2 } from 'lucide-react';
import { api, DownloadJobRecord, InstanceRecord, LocalModelRecord } from '../api/client';
import { ModelDetail, ModelDetailDrawer } from '../components/ModelDetailDrawer';
import { ErrorRecoveryCard } from '../components/ErrorRecoveryCard';

type LibraryFilter = 'all' | 'device' | 'downloads' | 'running' | 'attention';

type LibraryItem =
  | { key: string; kind: 'local'; model: LocalModelRecord; job?: DownloadJobRecord | null }
  | { key: string; kind: 'download'; job: DownloadJobRecord };

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function modelSlug(modelId: string) {
  return modelId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'vllm-model';
}

function endpointFor(instance?: InstanceRecord | null) {
  if (!instance) return null;
  const host = instance.host === '0.0.0.0' ? 'localhost' : instance.host;
  return `http://${host}:${instance.port}/v1`;
}

function jobProgress(job: DownloadJobRecord) {
  if (job.total_bytes && job.downloaded_bytes != null && job.total_bytes > 0) {
    return Math.max(0, Math.min(100, Math.round((job.downloaded_bytes / job.total_bytes) * 100)));
  }
  if (job.status === 'completed') return 100;
  if (job.status === 'running') return 45;
  if (job.status === 'queued') return 10;
  return 0;
}

function jobStatusText(job: DownloadJobRecord) {
  if (job.status === 'completed') return 'Downloaded';
  if (job.status === 'running') return 'Downloading';
  if (job.status === 'queued') return 'Queued';
  if (job.status === 'failed') return 'Failed';
  return 'Cancelled';
}

function localStatusText(model: LocalModelRecord) {
  if (model.active_status === 'running') return 'Running';
  if (model.active_status === 'starting') return 'Loading';
  if (model.active_status === 'crashed') return 'Crashed';
  if (model.local_path || model.download_status === 'completed') return 'Ready';
  if (model.download_status === 'running' || model.download_status === 'queued') return 'Downloading';
  if (model.download_status === 'failed') return 'Failed';
  return 'Registered';
}

function statusClass(label: string) {
  const key = label.toLowerCase();
  if (key.includes('running') || key.includes('loading') || key.includes('downloading') || key.includes('queued')) return 'running';
  if (key.includes('ready') || key.includes('downloaded')) return 'completed';
  if (key.includes('failed') || key.includes('crashed') || key.includes('cancelled')) return 'failed';
  return '';
}

function instanceForLocal(model: LocalModelRecord, instances?: InstanceRecord[]) {
  return instances?.find((item) => item.id === model.active_instance_id)
    ?? instances?.find((item) => item.config.model === model.local_path || item.config.model === model.model_id)
    ?? null;
}

function instanceForJob(job: DownloadJobRecord, instances?: InstanceRecord[]) {
  return instances?.find((item) => item.config.model === job.local_dir || item.config.model === job.model_id) ?? null;
}

function itemModelId(item: LibraryItem) {
  return item.kind === 'local' ? item.model.model_id : item.job.model_id;
}

function itemDisplayName(item: LibraryItem) {
  if (item.kind === 'local') {
    return item.model.group_name && item.model.variant_label
      ? `${item.model.group_name} — ${item.model.variant_label}`
      : item.model.display_name;
  }
  return item.job.model_id.split('/').pop() || item.job.model_id;
}

function itemStatus(item: LibraryItem) {
  return item.kind === 'local' ? localStatusText(item.model) : jobStatusText(item.job);
}

function itemPath(item: LibraryItem) {
  return item.kind === 'local' ? item.model.local_path : item.job.local_dir;
}

function itemSize(item: LibraryItem) {
  return item.kind === 'local' ? item.model.size_label : formatBytes(item.job.total_bytes || item.job.downloaded_bytes);
}

function itemHasAttention(item: LibraryItem) {
  if (item.kind === 'download') return item.job.status === 'failed' || item.job.status === 'cancelled';
  return item.model.active_status === 'crashed'
    || item.model.download_status === 'failed'
    || item.model.compatibility_status === 'attention'
    || Boolean(item.model.metadata_warnings?.length);
}

function compatibilityClass(status?: string | null) {
  if (status === 'ready' || status === 'likely') return 'completed';
  if (status === 'limited') return 'queued';
  if (status === 'attention') return 'failed';
  return '';
}

function itemMatchesFilter(item: LibraryItem, filter: LibraryFilter) {
  if (filter === 'all') return true;
  if (filter === 'device') return item.kind === 'local';
  if (filter === 'downloads') return item.kind === 'download' || Boolean(item.kind === 'local' && item.model.download_job_id);
  if (filter === 'running') return item.kind === 'local' && item.model.active_status === 'running';
  if (filter === 'attention') return itemHasAttention(item);
  return true;
}

function itemMatchesQuery(item: LibraryItem, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    itemModelId(item),
    itemDisplayName(item),
    itemPath(item) ?? '',
    item.kind === 'local' ? item.model.format ?? '' : '',
    item.kind === 'local' ? item.model.quantization ?? '' : '',
    item.kind === 'local' ? item.model.architecture ?? '' : '',
    item.kind === 'local' ? item.model.compatibility_label ?? '' : '',
    item.kind === 'local' ? item.model.dtype_hint ?? '' : '',
    ...(item.kind === 'local' ? item.model.tags : []),
  ].join(' ').toLowerCase();
  return haystack.includes(q);
}

function sortItems(a: LibraryItem, b: LibraryItem) {
  const rank = (item: LibraryItem) => {
    const status = itemStatus(item).toLowerCase();
    if (status === 'running') return 0;
    if (status === 'ready' || status === 'downloaded') return 1;
    if (status === 'downloading' || status === 'queued' || status === 'loading') return 2;
    if (status === 'failed' || status === 'crashed') return 3;
    return 4;
  };
  return rank(a) - rank(b) || itemDisplayName(a).localeCompare(itemDisplayName(b));
}

export function ModelsLibraryPage({ onOpenLogs, onOpenPlayground, onOpenRunModel }: { onOpenLogs?: (id: string) => void; onOpenPlayground?: (id: string) => void; onOpenRunModel?: () => void }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [downloadModelId, setDownloadModelId] = useState('Qwen/Qwen3-0.6B');
  const [hfTokenEnv, setHfTokenEnv] = useState('HF_TOKEN');
  const [newScanPath, setNewScanPath] = useState('');
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState(8000);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const local = useQuery({ queryKey: ['local-models'], queryFn: api.localModels, refetchInterval: 5000 });
  const downloads = useQuery({ queryKey: ['downloads'], queryFn: api.downloads, refetchInterval: 3000 });
  const instances = useQuery({ queryKey: ['instances'], queryFn: api.instances, refetchInterval: 3000 });
  const scanRoots = useQuery({ queryKey: ['local-model-scan-roots'], queryFn: api.localModelScanRoots, refetchInterval: 20000 });

  async function refreshAll(message = 'Models refreshed.') {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['local-models'] }),
      qc.invalidateQueries({ queryKey: ['downloads'] }),
      qc.invalidateQueries({ queryKey: ['instances'] }),
      qc.invalidateQueries({ queryKey: ['local-model-scan-roots'] }),
    ]);
    setNotice(message);
  }

  async function act(fn: () => Promise<unknown>, success?: string) {
    setError(null);
    setNotice(null);
    try {
      await fn();
      await refreshAll(success ?? 'Done.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const loadLocal = useMutation({
    mutationFn: (model: LocalModelRecord) => api.loadLocalModel({
      model_id: model.model_id,
      local_path: model.local_path,
      name: modelSlug(model.model_id),
      host,
      port,
      start: true,
      reuse_existing: true,
      dtype: 'auto',
      gpu_memory_utilization: 0.92,
      max_model_len: model.context_length ?? null,
    }),
    onSuccess: (result) => {
      if (!result.reused_existing) setPort((value) => value + 1);
      setNotice(result.loaded ? `Loaded ${result.instance_name}.` : `Load failed: ${result.start_error ?? 'unknown error'}. Open logs or recovery help for the exact path/details.`);
      refreshAll('Model state updated.').catch(() => undefined);
    },
    onError: (err) => setError(err instanceof Error ? err.message : String(err)),
  });

  const loadDownload = useMutation({
    mutationFn: (job: DownloadJobRecord) => api.loadLocalModel({
      model_id: job.model_id,
      local_path: job.local_dir,
      name: modelSlug(job.model_id),
      host,
      port,
      start: true,
      reuse_existing: true,
      dtype: 'auto',
      gpu_memory_utilization: 0.92,
    }),
    onSuccess: (result) => {
      if (!result.reused_existing) setPort((value) => value + 1);
      setNotice(result.loaded ? `Loaded ${result.instance_name}.` : `Load failed: ${result.start_error ?? 'unknown error'}. Open logs or recovery help for the exact path/details.`);
      refreshAll('Model state updated.').catch(() => undefined);
    },
    onError: (err) => setError(err instanceof Error ? err.message : String(err)),
  });

  const createDownload = useMutation({
    mutationFn: (modelId?: string) => api.createDownload({ model_id: (modelId ?? downloadModelId).trim(), register_model: true, hf_token_env: hfTokenEnv.trim() || null }),
    onSuccess: (job) => {
      setSelectedKey(`download:${job.id}`);
      refreshAll('Download queued.').catch(() => undefined);
    },
    onError: (err) => setError(err instanceof Error ? err.message : String(err)),
  });

  const addScanRoot = useMutation({
    mutationFn: api.addLocalModelScanRoot,
    onSuccess: () => {
      setNewScanPath('');
      refreshAll('Scan path added.').catch(() => undefined);
    },
    onError: (err) => setError(err instanceof Error ? err.message : String(err)),
  });

  const items = useMemo<LibraryItem[]>(() => {
    const downloadByLocalDir = new Map((downloads.data ?? []).filter((job) => job.local_dir).map((job) => [job.local_dir, job]));
    const localItems: LibraryItem[] = (local.data?.models ?? []).map((model) => ({
      key: `local:${model.id}`,
      kind: 'local',
      model,
      job: model.local_path ? downloadByLocalDir.get(model.local_path) ?? null : null,
    }));
    const knownLocalPaths = new Set((local.data?.models ?? []).map((model) => model.local_path).filter(Boolean));
    const downloadItems: LibraryItem[] = (downloads.data ?? [])
      .filter((job) => !job.local_dir || !knownLocalPaths.has(job.local_dir))
      .map((job) => ({ key: `download:${job.id}`, kind: 'download', job }));
    return [...localItems, ...downloadItems].sort(sortItems);
  }, [downloads.data, local.data]);

  const filteredItems = useMemo(() => items
    .filter((item) => itemMatchesFilter(item, filter))
    .filter((item) => itemMatchesQuery(item, query)), [items, filter, query]);
  const selectedItem = useMemo(() => filteredItems.find((item) => item.key === selectedKey) ?? filteredItems[0] ?? null, [filteredItems, selectedKey]);

  const selectedInstance = useMemo(() => {
    if (!selectedItem) return null;
    return selectedItem.kind === 'local'
      ? instanceForLocal(selectedItem.model, instances.data)
      : instanceForJob(selectedItem.job, instances.data);
  }, [instances.data, selectedItem]);
  const selectedFailedDownload = selectedItem?.kind === 'download' && selectedItem.job.status === 'failed' ? selectedItem.job : null;
  const instanceRecovery = useQuery({
    queryKey: ['instance-recovery', selectedInstance?.id, selectedInstance?.status, selectedInstance?.last_error],
    queryFn: () => api.instanceRecovery(selectedInstance!.id),
    enabled: Boolean(selectedInstance?.id && (selectedInstance.status === 'crashed' || selectedInstance.last_error)),
  });
  const downloadRecovery = useQuery({
    queryKey: ['download-recovery', selectedFailedDownload?.id, selectedFailedDownload?.error],
    queryFn: () => api.downloadRecovery(selectedFailedDownload!.id),
    enabled: Boolean(selectedFailedDownload?.id),
  });

  const summary = useMemo(() => {
    const localCount = local.data?.models.length ?? 0;
    const activeDownloads = (downloads.data ?? []).filter((job) => job.status === 'queued' || job.status === 'running').length;
    const completedDownloads = (downloads.data ?? []).filter((job) => job.status === 'completed').length;
    const runningCount = (instances.data ?? []).filter((item) => item.status === 'running').length;
    const attentionCount = items.filter(itemHasAttention).length;
    return { localCount, activeDownloads, completedDownloads, runningCount, attentionCount };
  }, [downloads.data, instances.data, items, local.data?.models.length]);

  const endpoint = endpointFor(selectedInstance);

  function detailForItem(item: LibraryItem | null): ModelDetail | null {
    if (!item) return null;
    if (item.kind === 'local') {
      const model = item.model;
      const instance = instanceForLocal(model, instances.data);
      return {
        id: model.id,
        modelId: model.model_id,
        displayName: itemDisplayName(item),
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
        loadedStatus: instance?.status ?? model.active_status ?? 'not loaded',
        downloadStatus: model.download_status,
        download: item.job ?? undefined,
        instance,
        tags: model.tags,
        notes: model.notes,
        metadataWarnings: model.metadata_warnings,
        recommended: {
          dtype: 'auto',
          gpuMemoryUtilization: 0.92,
          maxModelLen: model.context_length ?? null,
          tensorParallelSize: null,
          trustRemoteCode: false,
        },
      };
    }
    const job = item.job;
    const instance = instanceForJob(job, instances.data);
    return {
      id: job.id,
      modelId: job.model_id,
      displayName: itemDisplayName(item),
      modelPath: job.local_dir,
      format: job.allow_patterns?.some((pattern) => pattern.toLowerCase().endsWith('.gguf')) ? 'GGUF' : 'HF snapshot',
      quantization: job.allow_patterns?.map((pattern) => pattern.match(/(?:IQ\d|Q\d(?:_K)?(?:_[A-Za-z0-9]+)?|FP8|FP16|BF16|AWQ|GPTQ)/i)?.[0]).find(Boolean) ?? null,
      sizeLabel: formatBytes(job.total_bytes || job.downloaded_bytes),
      architecture: null,
      contextLength: null,
      compatibilityStatus: job.status === 'completed' ? 'likely' : 'unknown',
      compatibilityLabel: job.status === 'completed' ? 'Downloaded files ready to scan' : 'Waiting for download',
      compatibilityReasons: job.status === 'completed' ? ['Open the completed local folder in Models to see exact file compatibility.'] : [],
      source: 'Hugging Face download',
      loadedStatus: instance?.status ?? 'not loaded',
      downloadStatus: job.status,
      download: job,
      instance,
      tags: ['download', job.status, ...(job.allow_patterns?.length ? ['variant'] : [])],
      notes: job.message ?? job.error ?? null,
      metadataWarnings: job.error ? [job.error] : [],
      recommended: { dtype: 'auto', gpuMemoryUtilization: 0.92, maxModelLen: null, tensorParallelSize: null, trustRemoteCode: false },
    };
  }

  function loadSelected() {
    if (!selectedItem) return Promise.reject(new Error('Select a model first.'));
    if (selectedItem.kind === 'local') return loadLocal.mutateAsync(selectedItem.model);
    if (selectedItem.job.status !== 'completed') return Promise.reject(new Error('Wait for the download to complete before loading.'));
    if (!selectedItem.job.local_dir) return Promise.reject(new Error('This download has no local directory yet.'));
    return loadDownload.mutateAsync(selectedItem.job);
  }

  async function unloadSelected() {
    if (!selectedInstance) throw new Error('No loaded instance selected.');
    await api.stop(selectedInstance.id);
  }

  async function copyEndpoint() {
    if (!endpoint || !navigator.clipboard) {
      setNotice('Endpoint is available after the model is running.');
      return;
    }
    await navigator.clipboard.writeText(endpoint);
    setNotice('Endpoint copied.');
  }

  async function copyRecoveryText(text: string, label?: string) {
    if (!navigator.clipboard) {
      setNotice('Clipboard API is unavailable in this browser.');
      return;
    }
    await navigator.clipboard.writeText(text);
    setNotice(`${label ?? 'Recovery text'} copied.`);
  }

  function refreshRecoveryState() {
    refreshAll('Recovery state refreshed.').catch(() => undefined);
    qc.invalidateQueries({ queryKey: ['instance-recovery'] });
    qc.invalidateQueries({ queryKey: ['download-recovery'] });
  }

  async function submitDownload(event: FormEvent) {
    event.preventDefault();
    if (!downloadModelId.trim()) return;
    await createDownload.mutateAsync(undefined);
  }

  const filterButtons: { id: LibraryFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: items.length },
    { id: 'device', label: 'This device', count: summary.localCount },
    { id: 'downloads', label: 'Downloads', count: (downloads.data ?? []).length },
    { id: 'running', label: 'Running', count: summary.runningCount },
    { id: 'attention', label: 'Needs attention', count: summary.attentionCount },
  ];

  return (
    <div className="models-library-page stack">
      <div className="card models-library-hero compact-models-hero">
        <div>
          <p className="label">Models</p>
          <h2>Your model library</h2>
          <p className="muted">Pick a model, then use the detail drawer for load, test, logs, and endpoint actions.</p>
        </div>
        <div className="model-library-summary compact-model-stats">
          <div><span>On device</span><strong>{summary.localCount}</strong></div>
          <div><span>Running</span><strong>{summary.runningCount}</strong></div>
          <div><span>Downloads</span><strong>{(downloads.data ?? []).length}</strong></div>
          <div><span>Needs help</span><strong>{summary.attentionCount}</strong></div>
        </div>
      </div>

      {error && <pre className="error">{error}</pre>}
      {notice && <div className="notice">{notice}</div>}
      {(local.data?.warnings ?? []).map((warning) => <div className="inline-warning" key={warning}><AlertTriangle size={16} /> {warning}</div>)}
      <ErrorRecoveryCard
        advice={downloadRecovery.data ?? instanceRecovery.data}
        loading={(downloadRecovery.isFetching && !downloadRecovery.data) || (instanceRecovery.isFetching && !instanceRecovery.data)}
        title="Needs attention"
        onOpenLogs={selectedInstance ? () => onOpenLogs?.(selectedInstance.id) : undefined}
        onRetry={selectedFailedDownload ? () => act(() => api.retryDownload(selectedFailedDownload.id, { hf_token_env: hfTokenEnv }), 'Download retried.') : selectedInstance ? () => act(() => api.start(selectedInstance.id), 'Load retried.') : undefined}
        onRefresh={refreshRecoveryState}
        onOpenSettings={onOpenRunModel}
        onCopy={copyRecoveryText}
      />

      <div className="card models-library-toolbar simplified-library-toolbar">
        <div className="library-main-controls">
          <div className="search-wrap"><Search size={15} /><input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search models..." /></div>
          <button className="btn secondary" onClick={() => refreshAll()}><RefreshCw size={15} /> Refresh</button>
        </div>
        <div className="library-tabs compact-library-tabs">
          {filterButtons.map((item) => (
            <button key={item.id} className={filter === item.id ? 'tag-chip active' : 'tag-chip'} onClick={() => setFilter(item.id)}>
              {item.label} <span>{item.count}</span>
            </button>
          ))}
        </div>
        <details className="library-add-model-panel">
          <summary>Add or scan models</summary>
          <div className="library-two-column">
            <form className="download-inline-form" onSubmit={submitDownload}>
              <strong>Download from Hugging Face</strong>
              <input className="input" value={downloadModelId} onChange={(event) => setDownloadModelId(event.target.value)} placeholder="org/model, e.g. Qwen/Qwen3-14B" />
              <input className="input compact" value={hfTokenEnv} onChange={(event) => setHfTokenEnv(event.target.value)} placeholder="HF_TOKEN" />
              <button className="btn" disabled={createDownload.isPending || !downloadModelId.trim()}><Download size={15} /> {createDownload.isPending ? 'Queueing...' : 'Download'}</button>
            </form>
            <div className="scan-inline-form">
              <strong>Add model folder</strong>
              <input className="input" value={newScanPath} onChange={(event) => setNewScanPath(event.target.value)} placeholder="/data/models or ~/.cache/huggingface/hub" />
              <button className="btn secondary" disabled={addScanRoot.isPending || !newScanPath.trim()} onClick={() => act(() => addScanRoot.mutateAsync(newScanPath.trim()))}>Add path</button>
            </div>
          </div>
          <div className="library-load-targets">
            <label>Load host<input className="input compact" value={host} onChange={(event) => setHost(event.target.value)} /></label>
            <label>Port<input className="input compact" type="number" value={port} onChange={(event) => setPort(Number(event.target.value))} /></label>
            <p className="muted">Detected paths: {(scanRoots.data?.roots ?? local.data?.scan_roots ?? []).slice(0, 4).map((root) => root.path).join(' · ') || 'default HF cache and configured model folders'}</p>
          </div>
        </details>
      </div>

      <div className="model-detail-layout">
        <div className="card library-list-card">
          <div className="row-between">
            <h3>Library</h3>
            <span className="status">{filteredItems.length} shown</span>
          </div>
          {(filter !== 'all' || query.trim()) && items.length > filteredItems.length && (
            <div className="filter-scope-hint">
              <p>This view is filtered. You have {items.length} total models, but only {filteredItems.length} are shown.</p>
              <div className="row">
                {query.trim() && <button className="btn secondary" onClick={() => setQuery('')}>Clear search</button>}
                {filter !== 'all' && <button className="btn" onClick={() => setFilter('all')}>Show all models</button>}
              </div>
            </div>
          )}
          {filteredItems.length === 0 && (items.length === 0 ? (
            <div className="library-empty-state">
              <div>
                <p className="label">Empty library</p>
                <h3>No models found yet</h3>
                <p className="muted">Scan your Hugging Face cache, add ./models, or download a tiny starter model. The list updates when files appear.</p>
              </div>
              <div className="library-empty-actions">
                <button className="btn secondary" onClick={() => act(() => addScanRoot.mutateAsync('~/.cache/huggingface/hub'), 'HF cache scan path added.')}>Scan HF cache</button>
                <button className="btn secondary" onClick={() => act(() => addScanRoot.mutateAsync('./models'), './models scan path added.')}>Scan ./models</button>
                <button className="btn" disabled={createDownload.isPending} onClick={() => act(() => createDownload.mutateAsync('Qwen/Qwen3-0.6B'), 'Starter download queued.')}>Download starter model</button>
                <button className="btn secondary" onClick={onOpenRunModel}>Open Run Model</button>
              </div>
            </div>
          ) : (
            <div className="library-filter-empty-state">
              <div>
                <p className="label">No match</p>
                <h3>No models match this view</h3>
                <p className="muted">The library has models, but the current search or filter is hiding them.</p>
              </div>
              <div className="library-empty-actions">
                {query.trim() && <button className="btn secondary" onClick={() => setQuery('')}>Clear search</button>}
                {filter !== 'all' && <button className="btn secondary" onClick={() => setFilter('all')}>Show all models</button>}
              </div>
            </div>
          ))}
          <div className="library-list">
            {filteredItems.map((item) => {
              const status = itemStatus(item);
              const path = itemPath(item);
              const modelId = itemModelId(item);
              const instance = item.kind === 'local' ? instanceForLocal(item.model, instances.data) : instanceForJob(item.job, instances.data);
              const isRunning = instance?.status === 'running' || status === 'Running';
              const canLoad = item.kind === 'local' ? Boolean(item.model.local_path || item.model.model_id) : item.job.status === 'completed' && Boolean(item.job.local_dir);
              const activeJob = item.kind === 'download' && (item.job.status === 'running' || item.job.status === 'queued');
              const failureReason = instance?.status === 'crashed' ? instance.last_error : item.kind === 'download' && item.job.status === 'failed' ? item.job.error : null;
              return (
                <div className={`library-row-card selectable ${selectedItem?.key === item.key ? 'selected' : ''}`} key={item.key} onClick={() => setSelectedKey(item.key)}>
                  <div className="library-row-main">
                    <div className="row">
                      {item.kind === 'local' ? <HardDrive size={16} /> : activeJob ? <Loader2 size={16} /> : <Download size={16} />}
                      <strong>{itemDisplayName(item)}</strong>
                      <span className={`pill ${statusClass(status)}`}>{status}</span>
                      {item.kind === 'local' && item.model.sibling_variant_count && item.model.sibling_variant_count > 1 ? <span className="pill">{item.model.sibling_variant_count} variants</span> : null}
                    </div>
                    <code>{modelId}</code>
                    {failureReason && <p className="row-failure-reason" title={failureReason}>Crashed: {failureReason}</p>}
                    <div className="tag-row compact-model-tags">
                      <span className="tag">{item.kind === 'local' ? (item.model.source || 'This device') : 'Hugging Face download'}</span>
                      {item.kind === 'local' && item.model.compatibility_label && <span className={`tag ${compatibilityClass(item.model.compatibility_status)}`}>{item.model.compatibility_label}</span>}
                      {item.kind === 'local' && item.model.format && <span className="tag">{item.model.format}</span>}
                      {item.kind === 'local' && item.model.quantization && <span className="tag">{item.model.quantization}</span>}
                      {itemSize(item) && <span className="tag">{itemSize(item)}</span>}
                    </div>
                    {item.kind === 'download' && item.job.status !== 'completed' && (
                      <div className={`download-status download-${item.job.status}`}>
                        <div className="row-between"><strong>{jobStatusText(item.job)}</strong><span>{jobProgress(item.job)}%</span></div>
                        <div className="progress-track"><div className="progress-bar" style={{ width: `${jobProgress(item.job)}%` }} /></div>
                        <p className="muted">{item.job.current_file || item.job.message || item.job.error || 'Waiting for download manager.'}</p>
                      </div>
                    )}
                  </div>
                  <div className="library-row-actions" onClick={(event) => event.stopPropagation()}>
                    {isRunning ? (
                      <button className="btn danger" disabled={!instance} onClick={() => instance && act(() => api.stop(instance.id), 'Model unloaded.')}><Square size={15} /> Unload</button>
                    ) : canLoad ? (
                      <button className="btn" disabled={loadLocal.isPending || loadDownload.isPending} onClick={() => item.kind === 'local' ? loadLocal.mutate(item.model) : loadDownload.mutate(item.job)}><Play size={15} /> {instance?.status === 'crashed' ? 'Retry load' : 'Load'}</button>
                    ) : activeJob ? (
                      <button className="btn secondary" onClick={() => act(() => api.cancelDownload(item.job.id), 'Download cancelled.')}><Square size={15} /> Cancel</button>
                    ) : item.kind === 'download' && item.job.status === 'failed' ? (
                      <button className="btn secondary" onClick={() => act(() => api.retryDownload(item.job.id, { hf_token_env: hfTokenEnv }), 'Download retried.')}><RefreshCw size={15} /> Retry</button>
                    ) : <button className="btn secondary" disabled>Not ready</button>}
                    {instance && <button className="btn secondary" onClick={() => onOpenLogs?.(instance.id)}>Logs</button>}
                    {item.kind === 'download' && ['completed', 'failed', 'cancelled'].includes(item.job.status) && <button className="btn secondary" onClick={() => act(() => api.deleteDownload(item.job.id), 'Download record deleted.')}><Trash2 size={15} /> Remove</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <ModelDetailDrawer
          detail={detailForItem(selectedItem)}
          loading={loadLocal.isPending || loadDownload.isPending}
          endpoint={endpoint}
          onLoad={selectedItem ? () => act(loadSelected, 'Load requested.') : undefined}
          onUnload={selectedInstance?.status === 'running' ? () => act(unloadSelected, 'Model unloaded.') : undefined}
          onOpenLogs={selectedInstance ? () => onOpenLogs?.(selectedInstance.id) : undefined}
          onTest={selectedInstance ? () => onOpenPlayground?.(selectedInstance.id) : undefined}
          onCopyEndpoint={endpoint ? copyEndpoint : undefined}
        />
      </div>
    </div>
  );
}
