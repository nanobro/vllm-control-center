import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, InstanceRecord, LogLine, MetricsSummary, openRemoteLogStream, RemoteControllerProfile } from '../api/client';

type SelectedRemote = { profile: RemoteControllerProfile; instance: InstanceRecord } | null;

function pickDefaultProfile(profiles?: RemoteControllerProfile[]) {
  if (!profiles?.length) return undefined;
  return profiles.find((profile) => profile.is_default) ?? profiles[0];
}

function MetricMiniCard({ metrics }: { metrics?: MetricsSummary }) {
  if (!metrics) return <p className="muted">Select an instance and fetch metrics.</p>;
  if (!metrics.available) return <p className="error">Metrics unavailable: {metrics.error ?? 'unknown error'}</p>;
  return (
    <div className="grid">
      <div><strong>KV cache</strong><br />{metrics.kv_cache_usage_perc ?? 'n/a'}%</div>
      <div><strong>Running</strong><br />{metrics.requests_running ?? 'n/a'}</div>
      <div><strong>Waiting</strong><br />{metrics.requests_waiting ?? 'n/a'}</div>
      <div><strong>GPU count</strong><br />{metrics.gpus.length}</div>
    </div>
  );
}

export function RemoteInstancesPage() {
  const qc = useQueryClient();
  const profiles = useQuery({ queryKey: ['remote-profiles'], queryFn: api.remoteProfiles });
  const defaultProfile = useMemo(() => pickDefaultProfile(profiles.data), [profiles.data]);
  const [profileId, setProfileId] = useState('');
  const [selected, setSelected] = useState<SelectedRemote>(null);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [metrics, setMetrics] = useState<MetricsSummary | undefined>();

  useEffect(() => {
    if (!profileId && defaultProfile) setProfileId(defaultProfile.id);
  }, [defaultProfile, profileId]);

  const activeProfile = profiles.data?.find((profile) => profile.id === profileId);
  const instances = useQuery({
    queryKey: ['remote-instances', profileId],
    queryFn: () => api.remoteInstances(profileId),
    enabled: Boolean(profileId),
    refetchInterval: 4000,
  });

  const start = useMutation({ mutationFn: ({ p, i }: { p: string; i: string }) => api.startRemoteInstance(p, i), onSuccess: () => qc.invalidateQueries({ queryKey: ['remote-instances', profileId] }) });
  const stop = useMutation({ mutationFn: ({ p, i }: { p: string; i: string }) => api.stopRemoteInstance(p, i), onSuccess: () => qc.invalidateQueries({ queryKey: ['remote-instances', profileId] }) });
  const restart = useMutation({ mutationFn: ({ p, i }: { p: string; i: string }) => api.restartRemoteInstance(p, i), onSuccess: () => qc.invalidateQueries({ queryKey: ['remote-instances', profileId] }) });

  async function openInstance(profile: RemoteControllerProfile, instance: InstanceRecord) {
    setSelected({ profile, instance });
    setMetrics(undefined);
    const initialLogs = await api.remoteInstanceLogs(profile.id, instance.id, 200);
    setLogs(initialLogs);
    try {
      setMetrics(await api.remoteInstanceMetrics(profile.id, instance.id));
    } catch {
      setMetrics(undefined);
    }
  }

  useEffect(() => {
    if (!selected) return;
    const source = openRemoteLogStream(selected.profile.id, selected.instance.id, (line) => {
      setLogs((prev) => [...prev.slice(-300), line]);
    });
    return () => source.close();
  }, [selected?.profile.id, selected?.instance.id]);

  return (
    <>
      <h2>Remote Instances Bridge</h2>
      <div className="card">
        <h3>Control remote vLLM servers</h3>
        <p>
          This page lets the local UI list, start, stop, restart, inspect metrics, and stream logs from a remote controller profile such as DGX Spark.
        </p>
        <label>
          Remote controller
          <select className="input" value={profileId} onChange={(e) => { setProfileId(e.target.value); setSelected(null); }}>
            <option value="">Choose remote controller</option>
            {profiles.data?.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} · {profile.base_url}</option>)}
          </select>
        </label>
        {!profiles.data?.length && <p className="muted">Add a remote controller profile first in the Remote page.</p>}
      </div>

      {activeProfile && (
        <div className="card">
          <div className="row">
            <h3 style={{ marginRight: 'auto' }}>{activeProfile.name}</h3>
            <button className="btn secondary" onClick={() => instances.refetch()}>Refresh</button>
          </div>
          <p>{activeProfile.base_url}</p>
          {instances.isError && <p className="error">Could not load remote instances: {(instances.error as Error).message}</p>}
          {instances.data?.map((instance) => (
            <div className="item" key={instance.id}>
              <div className="row">
                <div style={{ marginRight: 'auto' }}>
                  <strong>{instance.name}</strong>
                  <p className="muted">{instance.config.model} · {instance.host}:{instance.port}</p>
                  {instance.last_error && <p className="error">{instance.last_error}</p>}
                </div>
                <span className="status">{instance.status}</span>
                <button className="btn" onClick={() => start.mutate({ p: activeProfile.id, i: instance.id })}>Start</button>
                <button className="btn secondary" onClick={() => stop.mutate({ p: activeProfile.id, i: instance.id })}>Stop</button>
                <button className="btn secondary" onClick={() => restart.mutate({ p: activeProfile.id, i: instance.id })}>Restart</button>
                <button className="btn secondary" onClick={() => openInstance(activeProfile, instance)}>Open</button>
              </div>
            </div>
          ))}
          {instances.data?.length === 0 && <p className="muted">No instances found on this remote controller.</p>}
        </div>
      )}

      {selected && (
        <div className="card">
          <h3>{selected.profile.name} / {selected.instance.name}</h3>
          <p className="muted">Remote instance id: {selected.instance.id}</p>
          <h4>Metrics</h4>
          <MetricMiniCard metrics={metrics} />
          <div className="row">
            <button className="btn secondary" onClick={async () => setMetrics(await api.remoteInstanceMetrics(selected.profile.id, selected.instance.id))}>Refresh metrics</button>
            <button className="btn secondary" onClick={async () => setLogs(await api.remoteInstanceLogs(selected.profile.id, selected.instance.id, 500))}>Reload logs</button>
          </div>
          <h4>Live logs</h4>
          <pre>{logs.map((line) => `[${line.stream}] ${line.line}`).join('\n') || 'Waiting for remote logs...'}</pre>
        </div>
      )}
    </>
  );
}
