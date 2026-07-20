import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ExternalLink, LoaderCircle, Play, Power, Settings2, SquareTerminal } from 'lucide-react';
import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8787';
const DEFAULT_MODEL = 'unsloth/Qwen3.6-35B-A3B-NVFP4-Fast';

type Instance = {
  id: string;
  name: string;
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'crashed';
  host: string;
  port: number;
  last_error?: string | null;
};

type RecipeResponse = {
  recipe: {
    id: string;
    name: string;
    model_id: string;
    verified_runtime: string;
    startup_timeout_seconds: number;
    warmup_requests: number;
    note: string;
  };
  inspection: {
    ready: boolean;
    blockers: string[];
    warnings: string[];
    details: Record<string, unknown>;
  };
  instance?: Instance | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error((await response.text()) || `${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}

function endpoint(instance?: Instance | null) {
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

export function RecipeRunPage({
  onOpenAdvanced,
  onOpenLogs,
}: {
  onOpenAdvanced: () => void;
  onOpenLogs: (instanceId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [port, setPort] = useState(8000);
  const [notice, setNotice] = useState<string | null>(null);

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
      setNotice(result.message);
      await refresh();
    },
    onError: (error) => setNotice(friendlyError(error)),
  });

  const eject = useMutation({
    mutationFn: (instanceId: string) => request(`/api/runtime-recipes/qwen36-dgx-spark/${instanceId}/eject`, { method: 'POST' }),
    onSuccess: async () => {
      setNotice('Model ejected. Model files remain on disk.');
      await refresh();
    },
    onError: (error) => setNotice(friendlyError(error)),
  });

  const data = recipe.data;
  const instance = data?.instance;
  const active = instance?.status === 'running' || instance?.status === 'starting' || instance?.status === 'stopping';
  const ready = data?.inspection.ready ?? false;
  const baseUrl = endpoint(instance);

  return (
    <section className="page server-page">
      <div className="page-header">
        <div>
          <p className="label">RUN MODEL</p>
          <h2>One-click model runtime</h2>
          <p className="muted">Choose the model, press Load, then press Eject when finished. The known-good vLLM settings stay out of your way.</p>
        </div>
        <button className="btn secondary" type="button" onClick={onOpenAdvanced}><Settings2 size={16} /> Advanced</button>
      </div>

      <div className="card">
        <div className="row between">
          <div>
            <p className="label">MODEL</p>
            <h3>{data?.recipe.name ?? 'Qwen3.6 35B-A3B NVFP4 Fast'}</h3>
            <p className="muted">Single DGX Spark recipe · MTP k=3 · automatic warm-up</p>
          </div>
          <span className={`status-pill ${instance?.status ?? (ready ? 'running' : 'crashed')}`}>
            {instance?.status ?? (ready ? 'ready to load' : 'setup needed')}
          </span>
        </div>

        <label className="field">
          <span>Model folder or Hugging Face ID</span>
          <input value={model} onChange={(event) => setModel(event.target.value)} disabled={Boolean(active)} />
        </label>

        <div className="grid two-col">
          <label className="field">
            <span>Port</span>
            <input type="number" min={1} max={65535} value={port} onChange={(event) => setPort(Number(event.target.value))} disabled={Boolean(active)} />
          </label>
          <div className="field">
            <span>Recipe readiness</span>
            <strong>{ready ? 'Checks passed' : 'Needs attention'}</strong>
            <small>{data?.recipe.verified_runtime ?? 'Checking runtime…'}</small>
          </div>
        </div>

        {data?.inspection.blockers.map((blocker) => (
          <div className="notice error" key={blocker}><AlertTriangle size={16} /> <span>{blocker}</span></div>
        ))}
        {data?.inspection.warnings.map((warning) => (
          <div className="notice warning" key={warning}><AlertTriangle size={16} /> <span>{warning}</span></div>
        ))}
        {notice && <div className="notice"><CheckCircle2 size={16} /> <span>{notice}</span></div>}
        {instance?.last_error && <div className="notice error"><AlertTriangle size={16} /> <span>{instance.last_error}</span></div>}

        {baseUrl && instance?.status === 'running' && (
          <div className="endpoint-card">
            <span>OpenAI base URL</span>
            <strong>{baseUrl}</strong>
            <button className="btn secondary compact-btn" onClick={() => navigator.clipboard.writeText(baseUrl)} type="button">Copy URL</button>
          </div>
        )}

        <div className="row wrap">
          {active ? (
            <button className="btn danger" type="button" disabled={eject.isPending || instance?.status === 'stopping'} onClick={() => instance && eject.mutate(instance.id)}>
              {eject.isPending || instance?.status === 'stopping' ? <LoaderCircle className="spin" size={17} /> : <Power size={17} />}
              {instance?.status === 'stopping' ? 'Ejecting…' : 'Eject'}
            </button>
          ) : (
            <button className="btn primary" type="button" disabled={!ready || load.isPending || recipe.isLoading} onClick={() => load.mutate()}>
              {load.isPending ? <LoaderCircle className="spin" size={17} /> : <Play size={17} />}
              {load.isPending ? 'Starting…' : 'Load model'}
            </button>
          )}
          {instance && <button className="btn secondary" type="button" onClick={() => onOpenLogs(instance.id)}><SquareTerminal size={16} /> Logs</button>}
          {baseUrl && instance?.status === 'running' && <a className="btn secondary" href={`${baseUrl.replace(/\/v1$/, '')}/docs`} target="_blank" rel="noreferrer"><ExternalLink size={16} /> API docs</a>}
        </div>

        {instance?.status === 'starting' && (
          <div className="notice"><LoaderCircle className="spin" size={17} /><span>Loading weights, compiling kernels, and warming the endpoint. This recipe allows up to 10 minutes.</span></div>
        )}
        <p className="muted small">Eject stops the owned process group and removes the run record. It never deletes the downloaded model.</p>
      </div>
    </section>
  );
}
