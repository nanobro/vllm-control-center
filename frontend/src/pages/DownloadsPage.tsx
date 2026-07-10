import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, FolderOpen, Loader2, Play, RefreshCw, RotateCcw, Square, Trash2, XCircle } from 'lucide-react';
import { api, DownloadJobRecord, InstanceRecord, openDownloadsStream } from '../api/client';
import { ModelDetail, ModelDetailDrawer } from '../components/ModelDetailDrawer';

function formatBytes(value?: number | null) {
  if (!value) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function progress(job: DownloadJobRecord) {
  if (!job.total_bytes || !job.downloaded_bytes) return null;
  return Math.min(100, Math.round((job.downloaded_bytes / job.total_bytes) * 100));
}

function targetLabel(job: DownloadJobRecord) {
  if (job.allow_patterns?.length) return job.allow_patterns.join(', ');
  return 'Full snapshot';
}

function statusTitle(status: DownloadJobRecord['status']) {
  if (status === 'queued') return 'Waiting';
  if (status === 'running') return 'Downloading';
  if (status === 'completed') return 'Ready on this device';
  if (status === 'failed') return 'Needs attention';
  return 'Cancelled';
}

function downloadHint(job: DownloadJobRecord) {
  if (job.status === 'completed') return 'Ready to view in Local Models or load now.';
  if (job.status === 'running') return job.current_file ? `Fetching ${job.current_file}` : 'Downloading files from Hugging Face.';
  if (job.status === 'queued') return 'Queued. It will start when the controller picks it up.';
  if (job.status === 'cancelled') return 'Cancelled. Retry when you want to continue from scratch.';
  const text = `${job.error ?? ''} ${job.message ?? ''}`.toLowerCase();
  if (text.includes('gated') || text.includes('401') || text.includes('403') || text.includes('token')) {
    return 'Check HF_TOKEN and make sure the model license is accepted on Hugging Face.';
  }
  if (text.includes('huggingface_hub')) return 'Install huggingface_hub in the controller Python environment.';
  if (text.includes('space') || text.includes('no space')) return 'Check disk space and the target folder.';
  return 'Open the error, fix the cause, then Retry.';
}

function statusIcon(status: DownloadJobRecord['status']) {
  if (status === 'completed') return <CheckCircle2 size={16} />;
  if (status === 'failed') return <XCircle size={16} />;
  if (status === 'cancelled') return <Square size={16} />;
  if (status === 'running') return <Loader2 size={16} />;
  return <Loader2 size={16} />;
}

const statusFilters = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
  { id: 'cancelled', label: 'Cancelled' },
] as const;

type StatusFilter = typeof statusFilters[number]['id'];

export function DownloadsPage({ onOpenLocalModels, onOpenLogs, onOpenPlayground }: { onOpenLocalModels?: () => void; onOpenLogs?: (id: string) => void; onOpenPlayground?: (id: string) => void }) {
  const [jobs, setJobs] = useState<DownloadJobRecord[]>([]);
  const [modelId, setModelId] = useState('Qwen/Qwen3-0.6B');
  const [revision, setRevision] = useState('');
  const [localDir, setLocalDir] = useState('');
  const [hfTokenEnv, setHfTokenEnv] = useState('HF_TOKEN');
  const [registerModel, setRegisterModel] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState(8000);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const instances = useQuery({ queryKey: ['instances'], queryFn: api.instances, refetchInterval: 3000 });

  async function refresh() {
    setJobs(await api.downloads());
  }

  useEffect(() => {
    refresh().catch((err) => setError(String(err)));
  }, []);

  useEffect(() => {
    if (!liveUpdates) return;
    const source = openDownloadsStream(setJobs);
    source.onerror = () => setError('Live download updates disconnected. Manual refresh still works.');
    return () => source.close();
  }, [liveUpdates]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await api.createDownload({
        model_id: modelId,
        revision: revision || null,
        local_dir: localDir || null,
        register_model: registerModel,
        dry_run: dryRun,
        hf_token_env: dryRun ? null : hfTokenEnv || null,
      });
      setNotice('Download queued. It will appear below and update live.');
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  async function action(fn: () => Promise<unknown>, success?: string) {
    setError(null);
    setNotice(null);
    try {
      await fn();
      if (success) setNotice(success);
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  async function loadCompleted(job: DownloadJobRecord) {
    if (!job.local_dir) {
      throw new Error('This completed job has no local path. Open Local Models and add a scan path manually.');
    }
    const name = job.model_id.split('/').pop()?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'downloaded-model';
    const result = await api.loadLocalModel({
      model_id: job.model_id,
      local_path: job.local_dir,
      name,
      host,
      port,
      start: true,
      reuse_existing: true,
    });
    if (!result.loaded) throw new Error(result.start_error ?? 'vLLM failed to load the downloaded model.');
    setPort((value) => value + 1);
    setNotice(`Loaded ${result.instance_name}. Model files stayed on disk.`);
    await instances.refetch();
  }

  async function deleteTerminalJobs() {
    const terminal = jobs.filter((job) => ['completed', 'failed', 'cancelled'].includes(job.status));
    for (const job of terminal) await api.deleteDownload(job.id);
  }

  const summary = useMemo(() => {
    const active = jobs.filter((job) => job.status === 'queued' || job.status === 'running').length;
    const completed = jobs.filter((job) => job.status === 'completed').length;
    const failed = jobs.filter((job) => job.status === 'failed').length;
    const totalBytes = jobs.reduce((sum, job) => sum + (job.total_bytes ?? 0), 0);
    const downloadedBytes = jobs.reduce((sum, job) => sum + (job.downloaded_bytes ?? 0), 0);
    return { active, completed, failed, totalBytes, downloadedBytes };
  }, [jobs]);

  function instanceForJob(job: DownloadJobRecord | null): InstanceRecord | null {
    if (!job) return null;
    return instances.data?.find((item) => item.config.model === job.local_dir || item.config.model === job.model_id) ?? null;
  }

  function endpointForJob(job: DownloadJobRecord | null) {
    const instance = instanceForJob(job);
    if (!instance) return null;
    const endpointHost = instance.host === '0.0.0.0' ? 'localhost' : instance.host;
    return `http://${endpointHost}:${instance.port}/v1`;
  }

  async function copyEndpoint(job: DownloadJobRecord | null) {
    const endpoint = endpointForJob(job);
    if (!endpoint || !navigator.clipboard) {
      setNotice('Endpoint is available after this model is loaded.');
      return;
    }
    await navigator.clipboard.writeText(endpoint);
    setNotice('OpenAI-compatible endpoint copied.');
  }

  function detailForJob(job: DownloadJobRecord | null): ModelDetail | null {
    if (!job) return null;
    const instance = instanceForJob(job);
    const loaded = instance?.status ?? null;
    return {
      id: job.id,
      modelId: job.model_id,
      displayName: job.model_id.split('/').pop() || job.model_id,
      modelPath: job.local_dir,
      format: job.allow_patterns?.some((item) => item.toLowerCase().endsWith('.gguf')) ? 'GGUF' : 'HF snapshot',
      quantization: job.allow_patterns?.map((item) => item.match(/(?:IQ\d|Q\d(?:_K)?(?:_[A-Za-z0-9]+)?|FP8|FP16|BF16|AWQ|GPTQ)/i)?.[0]).find(Boolean) ?? null,
      sizeLabel: formatBytes(job.total_bytes || job.downloaded_bytes),
      architecture: null,
      contextLength: null,
      source: 'Hugging Face download',
      loadedStatus: loaded ?? 'not loaded',
      downloadStatus: job.status,
      download: job,
      instance,
      tags: ['download', job.status, ...(job.allow_patterns?.length ? ['variant'] : [])],
      notes: job.message ?? job.error ?? null,
      metadataWarnings: job.error ? [job.error] : [],
      recommended: { dtype: 'auto', gpuMemoryUtilization: 0.92, maxModelLen: null, tensorParallelSize: null, trustRemoteCode: false },
    };
  }

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && ['queued', 'running'].includes(job.status)) ||
        job.status === filter;
      const matchesQuery = !q || job.model_id.toLowerCase().includes(q) || (job.local_dir ?? '').toLowerCase().includes(q) || targetLabel(job).toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [jobs, filter, query]);

  const selectedJob = useMemo(() => filteredJobs.find((job) => job.id === selectedJobId) ?? filteredJobs[0] ?? null, [filteredJobs, selectedJobId]);

  return (
    <div className="stack downloads-page">
      <div className="card server-topbar downloads-hero">
        <div>
          <span className="label">Downloads</span>
          <h2>Download models to this device</h2>
          <p>Queue Hugging Face downloads, track progress, then open them in Local Models or load immediately.</p>
        </div>
        <div className="download-summary-grid">
          <div><span>Active</span><strong>{summary.active}</strong></div>
          <div><span>Ready</span><strong>{summary.completed}</strong></div>
          <div><span>Failed</span><strong>{summary.failed}</strong></div>
          <div><span>Fetched</span><strong>{formatBytes(summary.downloadedBytes)}</strong></div>
        </div>
      </div>

      <div className="card download-quick-card">
        <div className="row-between">
          <div>
            <h3>New download</h3>
            <p className="muted">Paste a Hugging Face repo, choose a target folder if needed, and let the app register it when done.</p>
          </div>
          <label className="checkbox-row">
            <input type="checkbox" checked={liveUpdates} onChange={(event) => setLiveUpdates(event.target.checked)} />
            Live updates
          </label>
        </div>
        <form className="form" onSubmit={submit}>
          <div className="download-form-main">
            <label>
              Model ID
              <input className="input" value={modelId} onChange={(event) => setModelId(event.target.value)} placeholder="Qwen/Qwen3-0.6B" />
            </label>
            <label>
              Target folder
              <input className="input" value={localDir} onChange={(event) => setLocalDir(event.target.value)} placeholder="optional; default Hugging Face cache" />
            </label>
            <button className="btn" type="submit">Queue download</button>
          </div>
          <details className="advanced-load-settings" open={showAdvanced} onToggle={(event) => setShowAdvanced(event.currentTarget.open)}>
            <summary>Advanced download options</summary>
            <div className="grid">
              <label>
                Revision / branch / commit
                <input className="input" value={revision} onChange={(event) => setRevision(event.target.value)} placeholder="main" />
              </label>
              <label>
                HF token environment variable
                <input className="input" value={hfTokenEnv} onChange={(event) => setHfTokenEnv(event.target.value)} placeholder="HF_TOKEN" />
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={registerModel} onChange={(event) => setRegisterModel(event.target.checked)} />
                Register completed download
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} />
                Dry run / fake download
              </label>
            </div>
          </details>
        </form>
        {error && <pre className="error">{error}</pre>}
        {notice && <div className="notice">{notice}</div>}
      </div>

      <div className="card download-toolbar-card">
        <div className="row-between">
          <div className="row">
            {statusFilters.map((item) => (
              <button key={item.id} className={`tag-chip ${filter === item.id ? 'active' : ''}`} onClick={() => setFilter(item.id)}>{item.label}</button>
            ))}
          </div>
          <div className="row">
            <input className="input compact" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter downloads..." />
            <button className="btn secondary" onClick={() => action(api.reconcileDownloads, 'Reconciled stale jobs.')}><RefreshCw size={14} /> Reconcile</button>
            <button className="btn secondary" onClick={() => refresh()}><RefreshCw size={14} /> Refresh</button>
            <button className="btn secondary" disabled={!jobs.some((job) => ['completed', 'failed', 'cancelled'].includes(job.status))} onClick={() => action(deleteTerminalJobs, 'Cleaned up terminal download jobs.')}><Trash2 size={14} /> Clear finished</button>
          </div>
        </div>
        <div className="download-load-settings">
          <span className="muted">Load completed downloads with</span>
          <label>Host<input className="input compact" value={host} onChange={(event) => setHost(event.target.value)} /></label>
          <label>Port<input className="input compact" type="number" value={port} onChange={(event) => setPort(Number(event.target.value))} /></label>
        </div>
      </div>

      <div className="model-detail-layout">
        <div className="download-card-list">
        {filteredJobs.map((job) => {
          const pct = progress(job);
          const active = job.status === 'queued' || job.status === 'running';
          const terminal = job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled';
          return (
            <div className={`card download-job-card selectable download-job-${job.status} ${selectedJob?.id === job.id ? 'selected' : ''}`} key={job.id} onClick={() => setSelectedJobId(job.id)}>
              <div className="row-between">
                <div className="row">
                  <span className={`pill ${job.status}`}>{statusIcon(job.status)} {statusTitle(job.status)}</span>
                  <strong title={job.model_id}>{job.model_id}</strong>
                </div>
                <span className="muted mono">{job.updated_at}</span>
              </div>
              <p className="download-job-message">{downloadHint(job)}</p>
              {job.error && <pre className="error">{job.error}</pre>}
              {pct !== null ? (
                <>
                  <div className="row-between muted"><span>{formatBytes(job.downloaded_bytes)} / {formatBytes(job.total_bytes)}</span><strong>{pct}%</strong></div>
                  <div className="progress-track"><div className="progress-bar" style={{ width: `${pct}%` }} /></div>
                </>
              ) : (
                <div className="progress-track"><div className="progress-bar pending" style={{ width: active ? '32%' : job.status === 'completed' ? '100%' : '0%' }} /></div>
              )}
              <div className="small-grid download-detail-grid">
                <span>Target: <strong>{targetLabel(job)}</strong></span>
                <span>Current file: <strong title={job.current_file ?? undefined}>{job.current_file ?? '—'}</strong></span>
                <span>Local path: <strong className="mono" title={job.local_dir ?? undefined}>{job.local_dir ?? '—'}</strong></span>
                <span>Revision: <strong>{job.revision ?? 'default'}</strong></span>
                <span>Registered: <strong>{job.registered_model_id ? 'yes' : '—'}</strong></span>
                <span>Mode: <strong>{job.dry_run ? 'dry run' : 'real download'}</strong></span>
              </div>
              <div className="row download-job-actions">
                {active && <button className="btn secondary" onClick={(event) => { event.stopPropagation(); action(() => api.cancelDownload(job.id), 'Cancellation requested.'); }}><Square size={14} /> Cancel</button>}
                {(job.status === 'failed' || job.status === 'cancelled') && <button className="btn" onClick={(event) => { event.stopPropagation(); action(() => api.retryDownload(job.id, { dry_run: job.dry_run }), 'Retry queued.'); }}><RotateCcw size={14} /> Retry</button>}
                {job.status === 'completed' && <button className="btn" disabled={!job.local_dir} onClick={(event) => { event.stopPropagation(); action(() => loadCompleted(job)); }}><Play size={14} /> Load now</button>}
                {job.status === 'completed' && onOpenLocalModels && <button className="btn secondary" onClick={(event) => { event.stopPropagation(); onOpenLocalModels(); }}><FolderOpen size={14} /> View in Local Models</button>}
                {terminal && <button className="btn secondary" onClick={(event) => { event.stopPropagation(); action(() => api.deleteDownload(job.id), 'Download job removed. Model files were not deleted.'); }}><Trash2 size={14} /> Delete job</button>}
              </div>
            </div>
          );
        })}
          {filteredJobs.length === 0 && (
            <div className="card empty-state">
              No matching downloads. Queue a model above, or switch filters to see completed/failed jobs.
            </div>
          )}
        </div>
        <ModelDetailDrawer
          detail={detailForJob(selectedJob)}
          endpoint={endpointForJob(selectedJob)}
          loading={false}
          onClose={() => setSelectedJobId(null)}
          onLoad={selectedJob?.status === 'completed' ? () => action(() => loadCompleted(selectedJob)) : undefined}
          onUnload={instanceForJob(selectedJob)?.status === 'running' ? () => action(async () => { await api.stop(instanceForJob(selectedJob)!.id); await instances.refetch(); }, 'Model unloaded from server. Model files were kept on disk.') : undefined}
          onOpenLogs={instanceForJob(selectedJob) && onOpenLogs ? () => onOpenLogs(instanceForJob(selectedJob)!.id) : undefined}
          onTest={instanceForJob(selectedJob) && onOpenPlayground ? () => onOpenPlayground(instanceForJob(selectedJob)!.id) : undefined}
          onCopyEndpoint={() => copyEndpoint(selectedJob)}
          onOpenLocalModels={selectedJob?.status === 'completed' ? onOpenLocalModels : undefined}
        />
      </div>
    </div>
  );
}
