import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, CatalogModelRecord } from '../api/client';

function tagClass(tag: string) {
  if (tag.includes('gated')) return 'pill warning-pill';
  if (tag.includes('coding') || tag.includes('agent')) return 'pill accent-pill';
  if (tag.includes('reasoning')) return 'pill reasoning-pill';
  return 'pill';
}

function ModelStatus({ model, registered, activeDownload, running }: { model: CatalogModelRecord; registered: boolean; activeDownload: boolean; running: boolean }) {
  return (
    <div className="row">
      {registered && <span className="pill completed">registered</span>}
      {activeDownload && <span className="pill running">downloading</span>}
      {running && <span className="pill running">running</span>}
      {model.gated && <span className="pill warning-pill">HF token / gated</span>}
    </div>
  );
}

export function ModelHubPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [port, setPort] = useState(8000);
  const [dryRun, setDryRun] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hub = useQuery({ queryKey: ['model-hub', query, tag], queryFn: () => api.modelHubCatalog(query, tag), refetchInterval: 3000 });
  const instances = useQuery({ queryKey: ['instances'], queryFn: api.instances, refetchInterval: 3000 });
  const downloads = useQuery({ queryKey: ['downloads'], queryFn: api.downloads, refetchInterval: 3000 });

  const busy = useMemo(() => new Set(downloads.data?.filter((job) => job.status === 'queued' || job.status === 'running').map((job) => job.model_id) ?? []), [downloads.data]);
  const running = useMemo(() => new Set(instances.data?.filter((item) => item.status === 'running' || item.status === 'starting').map((item) => item.config.model) ?? []), [instances.data]);

  const register = useMutation({ mutationFn: (catalogId: string) => api.registerCatalogModel(catalogId), onSuccess: () => qc.invalidateQueries({ queryKey: ['model-hub'] }) });
  const download = useMutation({
    mutationFn: (catalogId: string) => api.downloadCatalogModel(catalogId, { dry_run: dryRun, register_model: true, hf_token_env: dryRun ? null : 'HF_TOKEN' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['downloads'] });
      qc.invalidateQueries({ queryKey: ['model-hub'] });
    },
  });
  const quickLaunch = useMutation({
    mutationFn: (payload: { catalogId: string; model: CatalogModelRecord; start: boolean }) =>
      api.quickLaunchCatalogModel(payload.catalogId, {
        name: payload.model.display_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        host: '127.0.0.1',
        port,
        dtype: payload.model.default_dtype,
        gpu_memory_utilization: payload.model.suggested_gpu_memory_utilization,
        max_model_len: payload.model.suggested_max_model_len ?? null,
        trust_remote_code: payload.model.trust_remote_code,
        start: payload.start,
      }),
    onSuccess: (result) => {
      setPort((current) => current + 1);
      qc.invalidateQueries({ queryKey: ['instances'] });
      qc.invalidateQueries({ queryKey: ['model-hub'] });
      if (result.start_error) setError(`Instance created, but start failed: ${result.start_error}`);
    },
  });

  async function act(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div className="stack model-hub-page">
      <div className="hero-card">
        <div>
          <p className="label">LM Studio-style flow</p>
          <h2>Model Hub</h2>
          <p>
            Pick a model, queue a Hugging Face download, register it, create an instance, then start/stop it from the app.
            This is the missing “select model → start server” path from LM Studio, adapted for vLLM.
          </p>
        </div>
        <div className="hero-actions">
          <label className="checkbox-row">
            <input type="checkbox" checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} />
            Dry-run downloads
          </label>
          <label>
            Next port
            <input className="input" type="number" value={port} onChange={(event) => setPort(Number(event.target.value))} />
          </label>
        </div>
      </div>

      <div className="card">
        <div className="grid">
          <label>
            Search
            <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="qwen, coder, llama, reasoning..." />
          </label>
          <label>
            Tag filter
            <select className="input" value={tag} onChange={(event) => setTag(event.target.value)}>
              <option value="">All tags</option>
              <option value="qwen">qwen</option>
              <option value="coding">coding</option>
              <option value="reasoning">reasoning</option>
              <option value="general">general</option>
              <option value="gated">gated</option>
            </select>
          </label>
        </div>
        {error && <pre className="error">{error}</pre>}
      </div>

      <div className="model-list">
        {hub.data?.catalog.map((model) => {
          const registered = hub.data?.registered_model_ids.includes(model.model_id) ?? false;
          const activeDownload = busy.has(model.model_id) || (hub.data?.active_download_model_ids.includes(model.model_id) ?? false);
          const isRunning = running.has(model.model_id) || (hub.data?.running_model_ids.includes(model.model_id) ?? false);
          return (
            <div className="model-row-card" key={model.id}>
              <div className="model-main">
                <div className="row-between">
                  <div>
                    <h3>{model.display_name}</h3>
                    <code title={model.model_id}>{model.model_id}</code>
                  </div>
                  <div className="model-size">{model.size_label ?? '—'}</div>
                </div>
                <p>{model.description}</p>
                <div className="row">
                  {model.tags.map((item) => <span className={tagClass(item)} key={item}>{item}</span>)}
                </div>
                <ModelStatus model={model} registered={registered} activeDownload={activeDownload} running={isRunning} />
              </div>
              <div className="model-actions">
                <button className="btn secondary" onClick={() => act(() => register.mutateAsync(model.id))} disabled={registered}>Register</button>
                <button className="btn secondary" onClick={() => act(() => download.mutateAsync(model.id))} disabled={activeDownload}>Download</button>
                <button className="btn secondary" onClick={() => act(() => quickLaunch.mutateAsync({ catalogId: model.id, model, start: false }))}>Create Instance</button>
                <button className="btn" onClick={() => act(() => quickLaunch.mutateAsync({ catalogId: model.id, model, start: true }))}>Create + Start</button>
              </div>
            </div>
          );
        })}
        {hub.data?.catalog.length === 0 && <div className="card">No catalog models matched your filters.</div>}
      </div>

      <div className="card muted-card">
        <h3>Important vLLM note</h3>
        <p>
          LM Studio usually shows GGUF/MLX downloads. vLLM normally serves Hugging Face Transformers/safetensors repos.
          This hub is intentionally HF-first; GGUF-style local files are not the main target for vLLM.
        </p>
      </div>
    </div>
  );
}
