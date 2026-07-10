import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

type Props = { onSelectLogs: (id: string) => void };

export function InstancesPage({ onSelectLogs }: Props) {
  const qc = useQueryClient();
  const instances = useQuery({ queryKey: ['instances'], queryFn: api.instances, refetchInterval: 2500 });
  const create = useMutation({ mutationFn: api.createInstance, onSuccess: () => qc.invalidateQueries({ queryKey: ['instances'] }) });
  const start = useMutation({ mutationFn: api.start, onSuccess: () => qc.invalidateQueries({ queryKey: ['instances'] }) });
  const stop = useMutation({ mutationFn: api.stop, onSuccess: () => qc.invalidateQueries({ queryKey: ['instances'] }) });
  const [name, setName] = useState('qwen-test');
  const [model, setModel] = useState('Qwen/Qwen3-0.6B');
  const [port, setPort] = useState(8000);

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate({ name, config: { model, host: '127.0.0.1', port, dtype: 'auto', gpu_memory_utilization: 0.92 } });
  }

  return (
    <>
      <h2>Instances</h2>
      <form className="card" onSubmit={submit}>
        <h3>Create instance</h3>
        <div className="grid">
          <label>Name<input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>Model ID<input className="input" value={model} onChange={(e) => setModel(e.target.value)} /></label>
          <label>Port<input className="input" type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} /></label>
        </div>
        <p><button className="btn" type="submit">Create</button></p>
      </form>
      {instances.data?.map((item) => (
        <div className="card" key={item.id}>
          <div className="row">
            <h3 style={{ marginRight: 'auto' }}>{item.name}</h3>
            <span className="status">{item.status}</span>
          </div>
          <p>{item.config.model}</p>
          <p>Endpoint: http://{item.host}:{item.port}/v1</p>
          <div className="row">
            <button className="btn" onClick={() => start.mutate(item.id)} disabled={item.status === 'running'}>Start</button>
            <button className="btn secondary" onClick={() => stop.mutate(item.id)} disabled={item.status !== 'running'}>Stop</button>
            <button className="btn secondary" onClick={() => onSelectLogs(item.id)}>Logs</button>
            <CommandButton id={item.id} />
          </div>
          {item.last_error && <p style={{ color: '#b91c1c' }}>Last error: {item.last_error}</p>}
        </div>
      ))}
    </>
  );
}

function CommandButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const command = useQuery({ queryKey: ['command', id], queryFn: () => api.command(id), enabled: open });
  return (
    <>
      <button className="btn secondary" onClick={() => setOpen((x) => !x)}>Command</button>
      {open && command.data && <pre>{command.data.redacted_command}</pre>}
    </>
  );
}
