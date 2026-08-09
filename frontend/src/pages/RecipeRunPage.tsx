import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  LoaderCircle,
  Play,
  Power,
  RefreshCw,
  Settings2,
  SquareTerminal,
  TerminalSquare,
} from 'lucide-react';
import { useState } from 'react';
import { api, type InstanceRecord, type MetricsSummary } from '../api/client';
import { LoadProgress } from '../components/LoadProgress';
import { StatusLamp } from '../components/StatusLamp';
import { useToast } from '../components/Toast';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8787';
const DEFAULT_MODEL = 'unsloth/Qwen3.6-35B-A3B-NVFP4-Fast';
const EXPECTED_SHARDS = 5;

type RecipeResponse = {
  recipe: {
    id: string;
    name: string;
    model_id: string;
    verified_runtime: string;
    startup_timeout_seconds: number;
    warmup_requests: number;
    note: string;
    serve?: {
      moe_backend?: string;
      max_model_len?: number;
      speculative_config?: { method?: string; num_speculative_tokens?: number };
      gpu_memory_utilization?: number;
    };
  };
  inspection: {
    ready: boolean;
    blockers: string[];
    warnings: string[];
    details: Record<string, unknown>;
  };
  instance?: InstanceRecord | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error((await response.text()) || `${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}

function endpoint(instance?: InstanceRecord | null) {
  if (!instance) return null;
  const host = instance.host === '0.0.0.0' ? window.location.hostname || 'localhost' : instance.host;
  return `http://${host}:${instance.port}/v1`;
}

function friendlyError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  try {
    const parsed = JSON.parse(raw) as { detail?: string };
    return parsed.detail ?? raw;
  } catch {
    return raw;
  }
}

function fmtMetric(value?: number | null, suffix = '') {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return `${Math.round(value * 100) / 100}${suffix}`;
}

function CopyUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn secondary compact-btn endpoint-copy"
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
      {copied ? 'Copied' : 'Copy URL'}
    </button>
  );
}

export function RecipeRunPage({
  onOpenAdvanced,
  onOpenLogs,
}: {
  onOpenAdvanced: () => void;
  onOpenLogs: (instanceId: string) => void;
}) {
  const queryClient = useQueryClient();
  const pushToast = useToast();
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [port, setPort] = useState(8000);

  const recipe = useQuery({
    queryKey: ['runtime-recipe', model],
    queryFn: () => request<RecipeResponse>(`/api/runtime-recipes/qwen36-dgx-spark?model=${encodeURIComponent(model)}`),
    refetchInterval: (query) => {
      const status = query.state.data?.instance?.status;
      return status === 'starting' || status === 'stopping' ? 2000 : 5000;
    },
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['runtime-recipe'] });
  };

  const load = useMutation({
    mutationFn: () => request<{ message: string }>('/api/runtime-recipes/qwen36-dgx-spark/load', {
      method: 'POST',
      body: JSON.stringify({ model, port }),
    }),
    onSuccess: async (result) => {
      pushToast({ kind: 'ok', text: result.message });
      await refresh();
    },
    onError: (error) => pushToast({ kind: 'error', text: friendlyError(error) }),
  });

  const eject = useMutation({
    mutationFn: (instanceId: string) => request(`/api/runtime-recipes/qwen36-dgx-spark/${instanceId}/eject`, { method: 'POST' }),
    onSuccess: async () => {
      pushToast({ kind: 'ok', text: 'Model ejected. Model files remain on disk.' });
      await refresh();
    },
    onError: (error) => pushToast({ kind: 'error', text: friendlyError(error) }),
  });

  const data = recipe.data;
  const instance = data?.instance;
  const status = instance?.status ?? (data?.inspection.ready ? 'stopped' : 'blocked');
  const ready = data?.inspection.ready ?? false;
  const baseUrl = endpoint(instance);
  const active = status === 'running' || status === 'starting' || status === 'stopping';

  const shardCount = (() => {
    // Backend does not expose safetensors_shards on the recipe endpoint; derive from the blocker string ("found N.").
    for (const blocker of data?.inspection.blockers ?? []) {
      const match = blocker.match(/found (\d+)/i) ?? blocker.match(/(\d+)\/(\d+).*shards?/i);
      if (match) return Number(match[1]);
    }
    if (typeof data?.inspection.details?.safetensors_shards === 'number') return data.inspection.details.safetensors_shards;
    return null;
  })();
  const incompleteFiles = Array.isArray(data?.inspection.details?.incomplete_files)
    ? (data.inspection.details.incomplete_files as string[])
    : [];

  const metrics = useQuery({
    queryKey: ['metrics', instance?.id],
    queryFn: () => api.metrics(instance!.id),
    enabled: Boolean(instance && status === 'running'),
    refetchInterval: status === 'running' ? 5000 : false,
  });
  const m: MetricsSummary | undefined = metrics.data;

  const serve = data?.recipe.serve;
  const specStrip = [
    serve?.moe_backend ? `moe ${serve.moe_backend}` : null,
    serve?.speculative_config?.method ? `MTP k=${serve.speculative_config.num_speculative_tokens ?? 3}` : null,
    serve?.max_model_len ? `${(serve.max_model_len / 1024).toFixed(0)}K ctx` : null,
    serve?.gpu_memory_utilization ? `gpu_util ${Math.round(serve.gpu_memory_utilization * 100)}%` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <section className="page server-page">
      <div className="page-header">
        <div>
          <p className="label">RUN</p>
          <h2>One-click model runtime</h2>
          <p className="muted">Choose the model, press Load, then press Eject when finished. This recipe is experimental - hardware validation is pending.</p>
        </div>
        <button className="btn secondary" type="button" onClick={onOpenAdvanced}><Settings2 size={16} /> Advanced</button>
      </div>

      {/* BLOCKED */}
      {status === 'blocked' && (
        <div className="panel danger-panel">
          <div className="panel-head">
            <StatusLamp state="blocked" />
            <span className="panel-title">Setup blocked</span>
          </div>
          {data?.inspection.blockers.map((blocker) => (
            <div className="notice error" key={blocker}><AlertTriangle size={16} /> <span>{blocker}</span></div>
          ))}
          {shardCount !== null && shardCount < EXPECTED_SHARDS && (
            <div className="shard-block">
              <p className="muted">Checkpoint is incomplete ({shardCount}/{EXPECTED_SHARDS} shards). Resume the download to finish the last shard.</p>
              <div className="shard-checklist">
                {Array.from({ length: EXPECTED_SHARDS }, (_, i) => (
                  <span key={i} className={`shard ${i < shardCount ? 'present' : 'missing'}`}>{i + 1}</span>
                ))}
              </div>
              <button className="btn primary" type="button" onClick={() => pushToast({ kind: 'info', text: 'Resume download is handled on the Models page for now.' })}>
                <RefreshCw size={16} /> Resume download
              </button>
              <p className="muted small">No Load button is shown while the checkpoint is incomplete - loading a partial checkpoint is intentionally blocked.</p>
            </div>
          )}
          {incompleteFiles.length > 0 && (
            <div className="notice warning"><AlertTriangle size={16} /> <span>{incompleteFiles.length} .incomplete file(s) present. Finish the download before loading.</span></div>
          )}
        </div>
      )}

      {/* READY / STOPPED */}
      {status === 'stopped' && (
        <div className="card run-card">
          <div className="run-head">
            <div>
              <p className="label">MODEL</p>
              <h3 className="display run-model">{data?.recipe.name ?? 'Qwen3.6 35B-A3B NVFP4 Fast'}</h3>
              {specStrip && <p className="mono spec-strip">{specStrip}</p>}
            </div>
            <StatusLamp state="stopped" />
          </div>
          <span className="badge amber">Experimental - not yet validated on this hardware</span>

          <div className="grid two-col">
            <label className="field">
              <span>Model folder or Hugging Face ID</span>
              <input value={model} onChange={(event) => setModel(event.target.value)} />
            </label>
            <label className="field">
              <span>Port</span>
              <input type="number" min={1} max={65535} value={port} onChange={(event) => setPort(Number(event.target.value))} />
            </label>
          </div>

          {data?.inspection.warnings.map((warning) => (
            <div className="notice warning" key={warning}><AlertTriangle size={16} /> <span>{warning}</span></div>
          ))}

          <button className="btn primary load-btn" type="button" disabled={!ready || load.isPending || recipe.isLoading} onClick={() => load.mutate()}>
            {load.isPending ? <LoaderCircle className="spin" size={19} /> : <Play size={19} />}
            {load.isPending ? 'Starting…' : 'Load model'}
          </button>
        </div>
      )}

      {/* STARTING */}
      {status === 'starting' && (
        <div className="card run-card">
          <div className="run-head">
            <div>
              <p className="label">LOADING</p>
              <h3 className="display run-model">{data?.recipe.name ?? 'Qwen3.6 35B-A3B NVFP4 Fast'}</h3>
            </div>
            <StatusLamp state="starting" />
          </div>
          <LoadProgress startedAt={instance?.started_at ?? null} currentPhase={0} />
          <div className="row">
            <button
              className="btn danger"
              type="button"
              disabled={eject.isPending || instance?.status === 'stopping'}
              onClick={() => instance && eject.mutate(instance.id)}
            >
              {eject.isPending || instance?.status === 'stopping' ? <LoaderCircle className="spin" size={17} /> : <Power size={17} />}
              {instance?.status === 'stopping' ? 'Stopping…' : 'Cancel load'}
            </button>
            {instance && <button className="btn secondary" type="button" onClick={() => onOpenLogs(instance.id)}><SquareTerminal size={16} /> Logs</button>}
          </div>
        </div>
      )}

      {/* RUNNING */}
      {status === 'running' && (
        <div className="card run-card">
          <div className="run-head">
            <div>
              <p className="label">SERVING</p>
              <h3 className="display run-model">{data?.recipe.name ?? 'Qwen3.6 35B-A3B NVFP4 Fast'}</h3>
              {specStrip && <p className="mono spec-strip">{specStrip}</p>}
            </div>
            <StatusLamp state="running" />
          </div>

          {baseUrl && (
            <div className="endpoint-card dark">
              <div>
                <span className="label">OpenAI base URL</span>
                <strong className="mono">{baseUrl}</strong>
              </div>
              <CopyUrl url={baseUrl} />
            </div>
          )}

          <div className="metrics-row">
            <div className="metric"><span className="label">tok/s</span><strong>{fmtMetric(m?.generation_tokens_per_sec)}</strong></div>
            <div className="metric"><span className="label">KV cache</span><strong>{fmtMetric(m?.kv_cache_usage_perc, '%')}</strong></div>
            <div className="metric"><span className="label">running</span><strong>{fmtMetric(m?.requests_running)}</strong></div>
            <div className="metric"><span className="label">waiting</span><strong>{fmtMetric(m?.requests_waiting)}</strong></div>
          </div>

          <div className="row wrap">
            <button
              className="btn danger"
              type="button"
              disabled={eject.isPending || instance?.status === 'stopping'}
              onClick={() => instance && eject.mutate(instance.id)}
            >
              {eject.isPending || instance?.status === 'stopping' ? <LoaderCircle className="spin" size={17} /> : <Power size={17} />}
              {instance?.status === 'stopping' ? 'Ejecting…' : 'Eject'}
            </button>
            {instance && <button className="btn secondary" type="button" onClick={() => onOpenLogs(instance.id)}><SquareTerminal size={16} /> Logs</button>}
            {instance && <button className="btn secondary" type="button" onClick={() => pushToast({ kind: 'info', text: 'Open the Playground page to chat with this model.' })}><TerminalSquare size={16} /> Playground</button>}
            {baseUrl && <a className="btn secondary" href={`${baseUrl.replace(/\/v1$/, '')}/docs`} target="_blank" rel="noreferrer"><ExternalLink size={16} /> API docs</a>}
          </div>
        </div>
      )}

      {/* CRASHED */}
      {status === 'crashed' && (
        <div className="panel danger-panel">
          <div className="panel-head">
            <StatusLamp state="crashed" />
            <span className="panel-title">Model crashed</span>
          </div>
          {instance?.last_error && <div className="notice error"><AlertTriangle size={16} /> <span>{instance.last_error}</span></div>}
          <div className="row wrap">
            {instance && <button className="btn primary" type="button" onClick={() => onOpenLogs(instance.id)}><SquareTerminal size={16} /> Open logs</button>}
            <button className="btn secondary" type="button" onClick={() => load.mutate()} disabled={!ready || load.isPending}>
              {load.isPending ? <LoaderCircle className="spin" size={17} /> : <RefreshCw size={16} />}
              Retry
            </button>
          </div>
        </div>
      )}

      <p className="muted small">Eject stops the owned process group and removes the run record. It never deletes the downloaded model.</p>
    </section>
  );
}