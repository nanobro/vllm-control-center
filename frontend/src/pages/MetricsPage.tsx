import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type MetricsAlert, type MetricsHistoryPoint } from '../api/client';

function fmt(value?: number | null, suffix = '') {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return `${Math.round(value * 100) / 100}${suffix}`;
}

function severityClass(alert: MetricsAlert) {
  if (alert.severity === 'critical') return 'alert critical';
  if (alert.severity === 'warning') return 'alert warning';
  return 'alert';
}

function Sparkline({ points, field, suffix = '' }: { points: MetricsHistoryPoint[]; field: keyof MetricsHistoryPoint; suffix?: string }) {
  const values = points.map((point) => Number(point[field])).filter((value) => Number.isFinite(value));
  if (values.length < 2) return <p className="muted">Need at least two samples for history.</p>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const width = 420;
  const height = 96;
  const coords = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - ((value - min) / span) * (height - 12) - 6;
    return `${x},${y}`;
  }).join(' ');
  const latest = values[values.length - 1];
  return (
    <div>
      <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${String(field)} chart`}>
        <polyline points={coords} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="small-grid"><span>min {fmt(min, suffix)}</span><span>latest {fmt(latest, suffix)}</span><span>max {fmt(max, suffix)}</span></div>
    </div>
  );
}

export function MetricsPage({ initialInstanceId }: { initialInstanceId?: string | null }) {
  const instances = useQuery({ queryKey: ['instances'], queryFn: api.instances, refetchInterval: 3000 });
  const running = instances.data?.filter((x) => x.status === 'running') ?? [];
  const [instanceId, setInstanceId] = useState(initialInstanceId ?? '');
  const selected = instanceId || running[0]?.id || '';
  const metrics = useQuery({ queryKey: ['metrics', selected], queryFn: () => api.metrics(selected), enabled: Boolean(selected), refetchInterval: 2500 });
  const history = useQuery({ queryKey: ['metrics-history', selected], queryFn: () => api.metricsHistory(selected, 80), enabled: Boolean(selected), refetchInterval: 5000 });

  useEffect(() => {
    if (initialInstanceId) setInstanceId(initialInstanceId);
  }, [initialInstanceId]);

  useEffect(() => {
    if (!instanceId && running[0]?.id) setInstanceId(running[0].id);
  }, [instanceId, running]);

  return (
    <>
      <h2>Metrics</h2>
      <div className="card">
        <div className="row-between">
          <label style={{ flex: 1 }}>Running instance
            <select className="input" value={selected} onChange={(e) => setInstanceId(e.target.value)}>
              {running.length === 0 && <option value="">No running instances</option>}
              {running.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.config.model}</option>)}
            </select>
          </label>
          <div className="muted">Auto-refreshes every few seconds</div>
        </div>
      </div>

      {!selected && <div className="card muted-card">Start a vLLM instance to see live operator metrics.</div>}

      {metrics.data && <>
        {metrics.data.alerts.length > 0 && <div className="stack">
          {metrics.data.alerts.map((alert, idx) => (
            <div className={severityClass(alert)} key={`${alert.title}-${idx}`}>
              <strong>{alert.title}</strong>
              <p>{alert.message}</p>
            </div>
          ))}
        </div>}

        {!metrics.data.available && <div className="card warning">Metrics unavailable: {metrics.data.error}</div>}

        <div className="grid">
          <div className="card"><div className="label">KV cache</div><div className="value">{fmt(metrics.data.kv_cache_usage_perc, '%')}</div><p className="muted">Pressure on vLLM's KV cache.</p></div>
          <div className="card"><div className="label">Running requests</div><div className="value">{fmt(metrics.data.requests_running)}</div><p className="muted">Currently executing.</p></div>
          <div className="card"><div className="label">Waiting requests</div><div className="value">{fmt(metrics.data.requests_waiting)}</div><p className="muted">Queue depth.</p></div>
          <div className="card"><div className="label">Generation tok/s</div><div className="value">{fmt(metrics.data.generation_tokens_per_sec)}</div><p className="muted">Computed from stored snapshots.</p></div>
          <div className="card"><div className="label">Prompt tok/s</div><div className="value">{fmt(metrics.data.prompt_tokens_per_sec)}</div><p className="muted">Computed from stored snapshots.</p></div>
          <div className="card"><div className="label">Avg E2E latency</div><div className="value">{fmt(metrics.data.e2e_latency_avg_ms, ' ms')}</div><p className="muted">From vLLM histogram sum/count.</p></div>
        </div>

        <div className="grid">
          <div className="card">
            <h3>KV cache history</h3>
            <Sparkline points={history.data?.points ?? []} field="kv_cache_usage_perc" suffix="%" />
          </div>
          <div className="card">
            <h3>Generation throughput</h3>
            <Sparkline points={history.data?.points ?? []} field="generation_tokens_per_sec" />
          </div>
          <div className="card">
            <h3>Waiting requests</h3>
            <Sparkline points={history.data?.points ?? []} field="requests_waiting" />
          </div>
          <div className="card">
            <h3>Average latency</h3>
            <Sparkline points={history.data?.points ?? []} field="e2e_latency_avg_ms" suffix=" ms" />
          </div>
        </div>

        <div className="card">
          <h3>GPU</h3>
          {metrics.data.gpus.length === 0 && <p>No NVIDIA GPU info available.</p>}
          {metrics.data.gpus.map((gpu) => {
            const percent = gpu.memory_used_percent ?? (gpu.memory_total_mb ? ((gpu.memory_used_mb ?? 0) / gpu.memory_total_mb) * 100 : 0);
            return (
              <div className="item" key={gpu.index}>
                <div className="row-between"><strong>{gpu.index}: {gpu.name}</strong><span className="pill">{fmt(percent, '%')} VRAM</span></div>
                <div className="progress-track"><div className="progress-bar" style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }} /></div>
                <div className="small-grid">
                  <span>VRAM {gpu.memory_used_mb ?? '—'} / {gpu.memory_total_mb ?? '—'} MB</span>
                  <span>Util {gpu.utilization_percent ?? '—'}%</span>
                  <span>Temp {gpu.temperature_c ?? '—'}°C</span>
                </div>
              </div>
            );
          })}
        </div>
      </>}
    </>
  );
}
