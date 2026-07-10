import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, ExportBundle } from '../api/client';

const labels: Record<keyof ExportBundle, string> = {
  yaml_config: 'vLLM YAML',
  docker_command: 'Docker command',
  docker_compose: 'Docker Compose',
  curl_chat: 'cURL chat test',
  python_openai: 'Python OpenAI SDK',
  typescript_openai: 'TypeScript OpenAI SDK',
  openwebui: 'Open WebUI notes',
};

export function ExportsPage() {
  const instances = useQuery({ queryKey: ['instances'], queryFn: api.instances, refetchInterval: 3000 });
  const [instanceId, setInstanceId] = useState('');
  const selected = instanceId || instances.data?.[0]?.id || '';
  const bundle = useQuery({ queryKey: ['exports', selected], queryFn: () => api.exportBundle(selected), enabled: Boolean(selected) });

  return (
    <>
      <h2>Exports</h2>
      <div className="card">
        <label>Instance
          <select className="input" value={selected} onChange={(e) => setInstanceId(e.target.value)}>
            {instances.data?.length === 0 && <option value="">No instances</option>}
            {instances.data?.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.config.model}</option>)}
          </select>
        </label>
      </div>
      {bundle.data && (Object.keys(labels) as (keyof ExportBundle)[]).map((key) => (
        <div className="card" key={key}>
          <div className="row"><h3 style={{ marginRight: 'auto' }}>{labels[key]}</h3><button className="btn secondary" onClick={() => navigator.clipboard.writeText(bundle.data[key])}>Copy</button></div>
          <pre>{bundle.data[key]}</pre>
        </div>
      ))}
    </>
  );
}
