import { Copy, FileText, Gauge, HardDrive, Play, Square, TerminalSquare, X } from 'lucide-react';
import { DownloadJobRecord, InstanceRecord } from '../api/client';

export type RecommendedVllmSettings = {
  presetName?: string | null;
  presetDescription?: string | null;
  dtype?: string | null;
  gpuMemoryUtilization?: number | null;
  maxModelLen?: number | null;
  tensorParallelSize?: number | null;
  trustRemoteCode?: boolean | null;
  extraArgs?: string[];
};

export type ModelDetail = {
  id: string;
  modelId: string;
  displayName: string;
  modelPath?: string | null;
  format?: string | null;
  quantization?: string | null;
  sizeLabel?: string | null;
  architecture?: string | null;
  contextLength?: number | null;
  parameterCountB?: number | null;
  fileCount?: number | null;
  weightFileCount?: number | null;
  isMultiFile?: boolean;
  configPresent?: boolean;
  tokenizerPresent?: boolean | null;
  dtypeHint?: string | null;
  compatibilityStatus?: string | null;
  compatibilityLabel?: string | null;
  compatibilityReasons?: string[];
  suggestedLoadFormat?: string | null;
  source?: string | null;
  loadedStatus?: string | null;
  downloadStatus?: string | null;
  download?: DownloadJobRecord | null;
  instance?: InstanceRecord | null;
  tags?: string[];
  notes?: string | null;
  metadataWarnings?: string[];
  recommended?: RecommendedVllmSettings;
};

export type ModelDetailDrawerProps = {
  detail?: ModelDetail | null;
  onClose?: () => void;
  onLoad?: () => void;
  onSafeLoad?: () => void;
  onUnload?: () => void;
  onOpenLogs?: () => void;
  onTest?: () => void;
  onCopyEndpoint?: () => void;
  onOpenLocalModels?: () => void;
  loading?: boolean;
  endpoint?: string | null;
  endpointCopyReady?: boolean;
  endpointCopyHint?: string | null;
};


function shortText(value?: string | null, max = 72) {
  if (!value) return '—';
  if (value.length <= max) return value;
  const head = Math.ceil((max - 3) * 0.55);
  const tail = Math.floor((max - 3) * 0.45);
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function basename(value?: string | null) {
  if (!value) return '—';
  const parts = value.split(/[\/]/).filter(Boolean);
  return parts[parts.length - 1] || value;
}

function valueOrDash(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '—';
  return value;
}

function compatibilityClass(status?: string | null) {
  if (status === 'ready' || status === 'likely') return 'completed';
  if (status === 'limited') return 'queued';
  if (status === 'attention') return 'failed';
  return '';
}

function pct(value?: number | null) {
  if (value === null || value === undefined) return 'auto';
  return `${Math.round(value * 100)}%`;
}

function endpointFor(instance?: InstanceRecord | null) {
  if (!instance) return null;
  const host = instance.host === '0.0.0.0' ? 'localhost' : instance.host;
  return `http://${host}:${instance.port}/v1`;
}

function recommendedSummary(detail: ModelDetail): RecommendedVllmSettings {
  return {
    presetName: detail.recommended?.presetName ?? null,
    presetDescription: detail.recommended?.presetDescription ?? null,
    dtype: detail.recommended?.dtype ?? detail.instance?.config.dtype ?? 'auto',
    gpuMemoryUtilization: detail.recommended?.gpuMemoryUtilization ?? detail.instance?.config.gpu_memory_utilization ?? 0.92,
    maxModelLen: detail.recommended?.maxModelLen ?? detail.instance?.config.max_model_len ?? detail.contextLength ?? null,
    tensorParallelSize: detail.recommended?.tensorParallelSize ?? detail.instance?.config.tensor_parallel_size ?? null,
    trustRemoteCode: detail.recommended?.trustRemoteCode ?? detail.instance?.config.trust_remote_code ?? false,
    extraArgs: detail.recommended?.extraArgs ?? detail.instance?.config.extra_args ?? [],
  };
}

function loadButtonLabel(detail: ModelDetail) {
  if (detail.loadedStatus === 'running') return 'Already loaded';
  if (detail.loadedStatus === 'starting') return 'Loading...';
  if (detail.downloadStatus && detail.downloadStatus !== 'completed') return 'Download first';
  return detail.instance?.status === 'stopped' || detail.loadedStatus === 'stopped' ? 'Load existing' : 'Load';
}

export function ModelDetailDrawer({ detail, onClose, onLoad, onSafeLoad, onUnload, onOpenLogs, onTest, onCopyEndpoint, onOpenLocalModels, loading, endpoint, endpointCopyReady = true, endpointCopyHint }: ModelDetailDrawerProps) {
  if (!detail) {
    return (
      <aside className="model-detail-drawer empty">
        <div className="model-detail-empty-icon"><HardDrive size={22} /></div>
        <h3>Pick a model</h3>
        <p className="muted">Select a model or download card to see path, status, recommended load settings, and the next action.</p>
      </aside>
    );
  }

  const settings = recommendedSummary(detail);
  const resolvedEndpoint = endpoint ?? endpointFor(detail.instance);
  const loaded = detail.loadedStatus === 'running' || detail.instance?.status === 'running';
  const downloading = detail.downloadStatus === 'queued' || detail.downloadStatus === 'running';
  const canLoad = Boolean(onLoad) && !loaded && !downloading && detail.downloadStatus !== 'failed' && detail.downloadStatus !== 'cancelled';
  const canUnload = Boolean(onUnload) && loaded;
  const canUseRuntimeActions = Boolean(detail.instance?.id || loaded);
  const hasRecentFailure = detail.loadedStatus === 'crashed' || detail.instance?.status === 'crashed' || Boolean(detail.instance?.last_error);
  const canSafeLoad = Boolean(onSafeLoad) && !loaded && !downloading && hasRecentFailure;
  const canCopyEndpoint = Boolean(resolvedEndpoint && onCopyEndpoint && endpointCopyReady);

  return (
    <aside className="model-detail-drawer">
      <div className="model-detail-head">
        <div>
          <span className="label">Model details</span>
          <h3 title={detail.displayName}>{shortText(detail.displayName, 72)}</h3>
          <code title={detail.modelId}>{shortText(detail.modelId, 72)}</code>
        </div>
        {onClose && <button className="icon-btn" aria-label="Close model details" onClick={onClose}><X size={17} /></button>}
      </div>

      <div className="model-detail-status-row">
        <span className={`pill ${loaded ? 'running' : detail.loadedStatus ?? ''}`}>{loaded ? 'Loaded' : valueOrDash(detail.loadedStatus ?? 'Not loaded')}</span>
        {detail.downloadStatus && <span className={`pill ${detail.downloadStatus}`}>Download: {detail.downloadStatus}</span>}
        {detail.compatibilityLabel && <span className={`pill ${compatibilityClass(detail.compatibilityStatus)}`}>{detail.compatibilityLabel}</span>}
        {detail.format && <span className="pill">{detail.format}</span>}
        {detail.quantization && <span className="pill">{detail.quantization}</span>}
      </div>

      <div className="model-detail-actions">
        {loaded ? (
          <button className="btn secondary" disabled={!canUnload || loading} onClick={onUnload}><Square size={14} /> Unload</button>
        ) : (
          <button className="btn" disabled={!canLoad || loading} onClick={onLoad}><Play size={14} /> {loading ? 'Working...' : loadButtonLabel(detail)}</button>
        )}
        {canSafeLoad && <button className="btn secondary" disabled={loading} onClick={onSafeLoad}><Gauge size={14} /> Retry Low VRAM</button>}
        <button className="btn secondary" disabled={!canUseRuntimeActions || !onTest} onClick={onTest}><TerminalSquare size={14} /> Test</button>
        <button className="btn secondary" disabled={!canUseRuntimeActions || !onOpenLogs} onClick={onOpenLogs}><FileText size={14} /> Logs</button>
        <button className="btn secondary" disabled={!canCopyEndpoint} onClick={onCopyEndpoint}><Copy size={14} /> {endpointCopyReady ? 'Copy URL' : 'Test first'}</button>
        {onOpenLocalModels && <button className="btn secondary" onClick={onOpenLocalModels}><HardDrive size={14} /> Local Models</button>}
      </div>

      {resolvedEndpoint && (
        <div className="model-detail-endpoint">
          <span>{endpointCopyReady ? 'OpenAI base URL' : 'OpenAI base URL · test first'}</span>
          <code>{resolvedEndpoint}</code>
          {!endpointCopyReady && endpointCopyHint && <p className="muted tiny">{endpointCopyHint}</p>}
        </div>
      )}

      <section className="model-detail-section">
        <h4>What the app knows</h4>
        <dl className="model-detail-list">
          <div><dt>Path</dt><dd className="mono" title={detail.modelPath ?? undefined}>{detail.modelPath ? basename(detail.modelPath) : '—'}</dd></div>
          <div><dt>Source</dt><dd>{valueOrDash(detail.source)}</dd></div>
          <div><dt>Format</dt><dd>{valueOrDash(detail.format)}</dd></div>
          <div><dt>Quantization</dt><dd>{valueOrDash(detail.quantization)}</dd></div>
          <div><dt>Size</dt><dd>{valueOrDash(detail.sizeLabel)}</dd></div>
          <div><dt>Architecture</dt><dd>{valueOrDash(detail.architecture)}</dd></div>
          <div><dt>Context</dt><dd>{detail.contextLength ? detail.contextLength.toLocaleString() : 'auto / unknown'}</dd></div>
          <div><dt>Params</dt><dd>{detail.parameterCountB ? `${detail.parameterCountB}B` : '—'}</dd></div>
          <div><dt>Weights</dt><dd>{detail.weightFileCount ? `${detail.weightFileCount}${detail.isMultiFile ? ' shards' : ' file'}` : '—'}</dd></div>
          <div><dt>Config</dt><dd>{detail.configPresent ? 'found' : 'not found'}</dd></div>
          <div><dt>Tokenizer</dt><dd>{detail.tokenizerPresent === null || detail.tokenizerPresent === undefined ? 'unknown' : detail.tokenizerPresent ? 'found' : 'not found'}</dd></div>
          <div><dt>DType hint</dt><dd>{valueOrDash(detail.dtypeHint)}</dd></div>
          <div><dt>Load as</dt><dd>{valueOrDash(detail.suggestedLoadFormat)}</dd></div>
        </dl>
      </section>

      {detail.compatibilityLabel && (
        <section className="model-detail-section compatibility-summary-card">
          <div className="row-between">
            <h4>vLLM compatibility</h4>
            <span className={`pill ${compatibilityClass(detail.compatibilityStatus)}`}>{detail.compatibilityStatus ?? 'unknown'}</span>
          </div>
          <p><strong>{detail.compatibilityLabel}</strong></p>
          {detail.compatibilityReasons?.length ? (
            <ul className="compact-list">
              {detail.compatibilityReasons.slice(0, 5).map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          ) : <p className="muted">No extra compatibility notes yet.</p>}
        </section>
      )}

      <section className="model-detail-section simple-settings">
        <div className="row-between">
          <h4><Gauge size={15} /> Recommended vLLM settings</h4>
          <span className="pill accent-pill">safe default</span>
        </div>
        <div className="settings-chips">
          {settings.presetName && <span>Preset <strong>{settings.presetName}</strong></span>}
          <span>DType <strong>{valueOrDash(settings.dtype)}</strong></span>
          <span>GPU memory <strong>{pct(settings.gpuMemoryUtilization)}</strong></span>
          <span>Max context <strong>{settings.maxModelLen ? settings.maxModelLen.toLocaleString() : 'auto'}</strong></span>
          <span>Tensor parallel <strong>{settings.tensorParallelSize ?? 'auto'}</strong></span>
        </div>
        <p className="muted">{settings.presetDescription || 'These stay simple on purpose. Open advanced load settings only when a model fails or needs special args.'}</p>
        {settings.trustRemoteCode && <p className="inline-warning">This model may need trust_remote_code.</p>}
        {settings.extraArgs?.length ? <code className="model-detail-extra-args">{settings.extraArgs.join(' ')}</code> : null}
      </section>

      {(detail.tags?.length || detail.notes || detail.metadataWarnings?.length) ? (
        <section className="model-detail-section">
          {detail.tags?.length ? <div className="tag-row">{detail.tags.slice(0, 8).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div> : null}
          {detail.notes && <p className="muted">{detail.notes}</p>}
          {detail.metadataWarnings?.map((warning) => <div className="inline-warning" key={warning}>{warning}</div>)}
        </section>
      ) : null}
    </aside>
  );
}
