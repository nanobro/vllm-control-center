import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function DashboardPage() {
  const health = useQuery({ queryKey: ['health'], queryFn: api.health, retry: false });
  const instances = useQuery({ queryKey: ['instances'], queryFn: api.instances, refetchInterval: 3000 });

  const running = instances.data?.filter((x) => x.status === 'running').length ?? 0;
  const total = instances.data?.length ?? 0;

  return (
    <>
      <h2>Dashboard</h2>
      <div className="grid">
        <div className="card"><div className="label">Controller</div><div className="value">{health.data?.ok ? 'Online' : health.isError ? 'Offline' : 'Checking'}</div></div>
        <div className="card"><div className="label">Instances</div><div className="value">{running} / {total} running</div></div>
        <div className="card"><div className="label">Default Endpoint</div><div className="value">:8000/v1</div></div>
      </div>
      <div className="card">
        <h3>North Star</h3>
        <p>Launch vLLM, watch logs and metrics, test the OpenAI-compatible endpoint, then export the exact config for local, Docker, or remote GPU servers.</p>
      </div>
    </>
  );
}
