import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, LogLine, openLogStream } from '../api/client';

export function LogsPage({ instanceId }: { instanceId: string | null }) {
  const initialLogs = useQuery({ queryKey: ['logs', instanceId], queryFn: () => api.logs(instanceId!, 500), enabled: Boolean(instanceId) });
  const [liveLogs, setLiveLogs] = useState<LogLine[]>([]);
  const [live, setLive] = useState(true);

  useEffect(() => {
    setLiveLogs([]);
  }, [instanceId]);

  useEffect(() => {
    if (!instanceId || !live) return;
    const source = openLogStream(instanceId, (line) => {
      setLiveLogs((prev) => [...prev.filter((item) => item.id !== line.id), line].slice(-1000));
    });
    return () => source.close();
  }, [instanceId, live]);

  if (!instanceId) return <div className="card">Select an instance from the Instances page first.</div>;
  const byId = new Map<number, LogLine>();
  (initialLogs.data ?? []).forEach((line) => byId.set(line.id, line));
  liveLogs.forEach((line) => byId.set(line.id, line));
  const logs = [...byId.values()].sort((a, b) => a.id - b.id);

  return (
    <>
      <div className="row"><h2 style={{ marginRight: 'auto' }}>Logs</h2><label className="row"><input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} /> Live stream</label></div>
      <div className="card">
        <pre>{logs.map((line) => `[${line.stream}] ${line.line}`).join('\n') || 'No logs yet.'}</pre>
      </div>
    </>
  );
}
