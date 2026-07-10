import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, CheckCircle2, Copy, Cpu, Play, Plus, RefreshCw, RotateCcw, Server, TerminalSquare, Unplug, Wifi, WifiOff, XCircle, Zap } from 'lucide-react';
import { api, DoctorReport, GpuInfo, InstanceRecord, LogLine, MetricsSummary, PlaygroundResponse, RemoteControllerProfile, RemoteProbeResult, openRemoteLogStream } from '../api/client';

function pickDefaultProfile(profiles?: RemoteControllerProfile[]) {
  if (!profiles?.length) return undefined;
  return profiles.find((profile) => profile.is_default) ?? profiles[0];
}

function latestProbe(profile: RemoteControllerProfile, probes: Record<string, RemoteProbeResult | undefined>) {
  return probes[profile.id];
}

function remoteState(profile?: RemoteControllerProfile, probe?: RemoteProbeResult) {
  if (!profile) return { label: 'Choose remote', tone: 'muted', connected: false };
  if (probe) return probe.ok
    ? { label: 'Connected', tone: 'online', connected: true }
    : { label: 'Disconnected', tone: 'offline', connected: false };
  if (profile.last_status === 'ok' || profile.last_status === 'online') return { label: 'Connected', tone: 'online', connected: true };
  if (profile.last_status === 'error' || profile.last_status === 'offline') return { label: 'Disconnected', tone: 'offline', connected: false };
  return { label: 'Not checked', tone: 'muted', connected: false };
}

function latencyLabel(profile?: RemoteControllerProfile, probe?: RemoteProbeResult) {
  const latency = probe?.latency_ms ?? profile?.last_latency_ms;
  return latency ? `${Math.round(latency)} ms` : 'Not measured';
}

function errorLabel(profile?: RemoteControllerProfile, probe?: RemoteProbeResult) {
  return probe?.error ?? profile?.last_error ?? null;
}

function runningInstances(instances?: InstanceRecord[]) {
  return (instances ?? []).filter((instance) => instance.status === 'running');
}

function preferredInstance(instances?: InstanceRecord[]) {
  const running = runningInstances(instances);
  return running[0] ?? instances?.[0];
}

function endpointFor(profile: RemoteControllerProfile, instance: InstanceRecord) {
  try {
    const url = new URL(profile.base_url);
    const host = instance.host === '0.0.0.0' || instance.host === '127.0.0.1' || instance.host === 'localhost'
      ? url.hostname
      : instance.host;
    return `${url.protocol}//${host}:${instance.port}/v1`;
  } catch {
    return `http://${instance.host}:${instance.port}/v1`;
  }
}


function buildRemoteHandoffBundle(endpoint: string, modelName: string) {
  return [
    `OpenAI base URL: ${endpoint}`,
    `Model: ${modelName}`,
    ``,
    `Use the base URL exactly as shown. SDKs add /chat/completions for you.`,
  ].join('\n');
}

function dotenvValue(value: string) {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) return value;
  return JSON.stringify(value);
}

function buildRemoteEnvHandoff(endpoint: string, modelName: string) {
  return [
    `# Tested by vLLM Control Center. Paste into your app .env file.`,
    `OPENAI_BASE_URL=${dotenvValue(endpoint)}`,
    `OPENAI_MODEL=${dotenvValue(modelName)}`,
    `OPENAI_API_KEY=replace-with-your-key-if-enabled`,
  ].join('\n');
}

type CopyConfirmation = {
  label: string;
  preview: string;
  charCount: number;
};

function copyConfirmationLabel(label: string) {
  if (/base url/i.test(label)) return 'Copied base URL';
  if (/model name|served model/i.test(label)) return 'Copied tested model name';
  if (/safe \.env|env handoff/i.test(label)) return 'Copied safe .env';
  if (/handoff/i.test(label)) return 'Copied handoff bundle';
  return `Copied ${label}`;
}

function copyPreview(text: string) {
  const compact = text.split(/\s*\n\s*/).find(Boolean) ?? text;
  return compact.length > 96 ? `${compact.slice(0, 93)}...` : compact;
}

function buildCopyConfirmation(text: string, label: string): CopyConfirmation {
  return { label: copyConfirmationLabel(label), preview: copyPreview(text), charCount: text.length };
}

function remoteEndpointReason(profile?: RemoteControllerProfile, instance?: InstanceRecord, connected = false, testPassed = false) {
  if (!profile) return 'Choose a remote GPU first.';
  if (!connected) return 'Remote controller is not connected yet.';
  if (!instance) return 'Choose a remote model first.';
  if (instance.status === 'running') return testPassed ? 'Remote test passed. Ready to copy.' : 'Run Quick test before copying this remote endpoint.';
  if (instance.status === 'starting') return 'Starting on the remote GPU. Wait for running before testing.';
  if (instance.status === 'crashed') return instance.last_error ? `Last crash: ${instance.last_error}` : 'The selected remote model crashed. Open logs or retry.';
  return 'Start the selected model before testing or copying the /v1 base URL.';
}

function selectedEndpoint(profile?: RemoteControllerProfile, instance?: InstanceRecord, connected = false) {
  if (!profile || !instance || !connected || instance.status !== 'running') return '';
  return endpointFor(profile, instance);
}

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back below for preview builds, insecure origins, or older browser shells.
  }

  if (typeof document === 'undefined') return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}

function formatMemory(mb?: number | null) {
  if (!mb && mb !== 0) return 'n/a';
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

function gpuPercent(gpu: GpuInfo) {
  if (typeof gpu.memory_used_percent === 'number') return gpu.memory_used_percent;
  if (gpu.memory_total_mb && gpu.memory_used_mb !== undefined) return Math.round((gpu.memory_used_mb / gpu.memory_total_mb) * 100);
  return null;
}


function extractAssistantText(response: any): string {
  return response?.choices?.[0]?.message?.content
    ?? response?.choices?.[0]?.text
    ?? response?.message
    ?? '';
}

function remoteErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error || 'The remote quick test failed.');
}

function firstGpuSummary(doctor?: DoctorReport | null, metrics?: MetricsSummary) {
  const gpu = metrics?.gpus?.[0] ?? doctor?.gpus?.[0];
  if (!gpu) return 'GPU not checked';
  const used = gpuPercent(gpu);
  return used === null ? gpu.name : `${gpu.name} · ${used}% VRAM`;
}

function healthDoctor(profile?: RemoteControllerProfile, probe?: RemoteProbeResult, doctorResponse?: unknown): DoctorReport | null {
  if (probe?.doctor) return probe.doctor;
  if (doctorResponse && typeof doctorResponse === 'object' && 'gpus' in doctorResponse) return doctorResponse as DoctorReport;
  if (profile?.last_status === 'ok') return null;
  return null;
}

function MetricSummaryCard({ metrics }: { metrics?: MetricsSummary }) {
  if (!metrics) return <p className="muted">Metrics appear after a remote model is running.</p>;
  if (!metrics.available) return <p className="error">Metrics unavailable: {metrics.error ?? 'remote server did not expose metrics yet'}</p>;
  return (
    <div className="remote-metric-grid">
      <div><span>KV cache</span><strong>{metrics.kv_cache_usage_perc ?? 'n/a'}%</strong></div>
      <div><span>Running</span><strong>{metrics.requests_running ?? '0'}</strong></div>
      <div><span>Waiting</span><strong>{metrics.requests_waiting ?? '0'}</strong></div>
      <div><span>Tokens/sec</span><strong>{metrics.generation_tokens_per_sec ? Math.round(metrics.generation_tokens_per_sec) : 'n/a'}</strong></div>
    </div>
  );
}

function GpuHealth({ doctor, metrics }: { doctor?: DoctorReport | null; metrics?: MetricsSummary }) {
  const gpus = metrics?.gpus?.length ? metrics.gpus : (doctor?.gpus ?? []);
  if (!gpus.length) {
    return <div className="remote-empty-mini">GPU data is not available yet. Reconnect or refresh health.</div>;
  }
  return (
    <div className="remote-gpu-list">
      {gpus.map((gpu) => {
        const used = gpuPercent(gpu);
        return (
          <div className="remote-gpu-card" key={`${gpu.index}-${gpu.name}`}>
            <div className="row-between">
              <strong>GPU {gpu.index}</strong>
              <span className="status">{used === null ? 'memory n/a' : `${used}% VRAM`}</span>
            </div>
            <p>{gpu.name}</p>
            <div className="progress-track"><div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, used ?? 0))}%` }} /></div>
            <small>{formatMemory(gpu.memory_used_mb)} used / {formatMemory(gpu.memory_total_mb)} total {gpu.temperature_c ? `· ${gpu.temperature_c}°C` : ''}</small>
          </div>
        );
      })}
    </div>
  );
}

function LogsPanel({ profileId, instanceId }: { profileId: string; instanceId: string }) {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const initialLogs = useQuery({
    queryKey: ['remote-inline-logs', profileId, instanceId],
    queryFn: () => api.remoteInstanceLogs(profileId, instanceId, 160),
  });

  useEffect(() => {
    if (initialLogs.data) setLogs(initialLogs.data);
  }, [initialLogs.data]);

  useEffect(() => {
    const source = openRemoteLogStream(profileId, instanceId, (line) => {
      setLogs((prev) => [...prev.slice(-240), line]);
    });
    return () => source.close();
  }, [profileId, instanceId]);

  return <pre className="remote-log-box">{logs.map((line) => `[${line.stream}] ${line.line}`).join('\n') || 'Waiting for remote logs...'}</pre>;
}

export function RemoteControllersPage() {
  const qc = useQueryClient();
  const profiles = useQuery({ queryKey: ['remote-profiles'], queryFn: api.remoteProfiles, refetchInterval: 8000 });
  const defaultProfile = useMemo(() => pickDefaultProfile(profiles.data), [profiles.data]);
  const [profileId, setProfileId] = useState('');
  const [name, setName] = useState('DGX Spark');
  const [baseUrl, setBaseUrl] = useState('http://192.168.50.229:8787');
  const [apiKey, setApiKey] = useState('');
  const [notes, setNotes] = useState('Remote GPU controller');
  const [probeResults, setProbeResults] = useState<Record<string, RemoteProbeResult | undefined>>({});
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [showLogs, setShowLogs] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualCopyText, setManualCopyText] = useState<string | null>(null);
  const [manualCopyLabel, setManualCopyLabel] = useState('Text');
  const [copyConfirmation, setCopyConfirmation] = useState<CopyConfirmation | null>(null);
  const manualCopyRef = useRef<HTMLTextAreaElement | null>(null);
  const [prompt, setPrompt] = useState('Say hello from the remote GPU in one short sentence.');
  const [testResult, setTestResult] = useState<PlaygroundResponse | null>(null);
  const [testedRemoteHandoffKey, setTestedRemoteHandoffKey] = useState('');
  const [testedRemoteModelName, setTestedRemoteModelName] = useState('');
  const [testError, setTestError] = useState<string | null>(null);
  const [testNextActions, setTestNextActions] = useState<string[]>([]);
  const [testLastRunAt, setTestLastRunAt] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId && defaultProfile) setProfileId(defaultProfile.id);
  }, [defaultProfile, profileId]);

  const activeProfile = profiles.data?.find((profile) => profile.id === profileId);
  const activeProbe = activeProfile ? latestProbe(activeProfile, probeResults) : undefined;
  const state = remoteState(activeProfile, activeProbe);

  const instances = useQuery({
    queryKey: ['remote-instances', profileId],
    queryFn: () => api.remoteInstances(profileId),
    enabled: Boolean(profileId),
    refetchInterval: 5000,
  });

  const highlighted = useMemo(() => {
    const selected = instances.data?.find((instance) => instance.id === selectedInstanceId);
    return selected ?? preferredInstance(instances.data);
  }, [instances.data, selectedInstanceId]);

  useEffect(() => {
    if (!selectedInstanceId && highlighted) setSelectedInstanceId(highlighted.id);
  }, [highlighted, selectedInstanceId]);

  const selectedInstance = instances.data?.find((instance) => instance.id === selectedInstanceId) ?? highlighted;
  const remoteHandoffKey = selectedInstance
    ? [profileId, selectedInstance.id, selectedInstance.status, selectedInstance.pid ?? 'no-pid', selectedInstance.started_at ?? 'not-started', selectedInstance.host, selectedInstance.port, selectedInstance.config.served_model_name || selectedInstance.config.model].join('|')
    : '';
  const endpoint = selectedEndpoint(activeProfile, selectedInstance, state.connected);
  const remoteTestPassed = Boolean(testResult?.ok && remoteHandoffKey && testedRemoteHandoffKey === remoteHandoffKey);
  const remoteConfiguredModelName = selectedInstance?.config.served_model_name || selectedInstance?.config.model || selectedInstance?.name || 'model';
  const remoteHandoffModelName = remoteTestPassed && testedRemoteModelName ? testedRemoteModelName : remoteConfiguredModelName;
  const remoteHandoffBundle = buildRemoteHandoffBundle(endpoint || 'Not ready yet', remoteHandoffModelName);
  const remoteEnvHandoff = buildRemoteEnvHandoff(endpoint || 'Not ready yet', remoteHandoffModelName);
  const remoteTestedNameDiffers = Boolean(remoteTestPassed && testedRemoteModelName && testedRemoteModelName !== remoteConfiguredModelName);
  const remoteModelNameSummary = remoteTestedNameDiffers
    ? `Remote test passed using served model name ${testedRemoteModelName}. Use that name in SDK calls.`
    : remoteTestPassed
      ? `Remote test passed using model name ${remoteHandoffModelName}.`
      : 'Remote Quick test will confirm the exact model name to use with this endpoint.';
  const endpointBlockedReason = remoteEndpointReason(activeProfile, selectedInstance, state.connected, remoteTestPassed);
  const endpointReady = Boolean(endpoint);
  const canCopyEndpoint = endpointReady && remoteTestPassed;
  const endpointVisualReady = endpointReady && remoteTestPassed;

  const metrics = useQuery({
    queryKey: ['remote-metrics-simple', profileId, selectedInstance?.id],
    queryFn: () => api.remoteInstanceMetrics(profileId, selectedInstance!.id),
    enabled: Boolean(profileId && selectedInstance?.id && selectedInstance.status === 'running'),
    refetchInterval: 6000,
  });

  const create = useMutation({
    mutationFn: api.createRemoteProfile,
    onSuccess: (profile) => {
      setProfileId(profile.id);
      qc.invalidateQueries({ queryKey: ['remote-profiles'] });
    },
  });
  const remove = useMutation({ mutationFn: api.deleteRemoteProfile, onSuccess: () => qc.invalidateQueries({ queryKey: ['remote-profiles'] }) });
  const setDefault = useMutation({ mutationFn: api.setDefaultRemoteProfile, onSuccess: () => qc.invalidateQueries({ queryKey: ['remote-profiles'] }) });
  const probe = useMutation({
    mutationFn: api.probeRemoteProfile,
    onSuccess: (result, id) => {
      setProbeResults((prev) => ({ ...prev, [id]: result }));
      qc.invalidateQueries({ queryKey: ['remote-profiles'] });
      qc.invalidateQueries({ queryKey: ['remote-instances', id] });
    },
  });
  const forwardDoctor = useMutation({ mutationFn: (id: string) => api.forwardRemote(id, { method: 'GET', path: '/api/system/doctor' }) });
  const start = useMutation({ mutationFn: ({ p, i }: { p: string; i: string }) => api.startRemoteInstance(p, i), onSuccess: () => qc.invalidateQueries({ queryKey: ['remote-instances', profileId] }) });
  const stop = useMutation({ mutationFn: ({ p, i }: { p: string; i: string }) => api.stopRemoteInstance(p, i), onSuccess: () => qc.invalidateQueries({ queryKey: ['remote-instances', profileId] }) });
  const restart = useMutation({ mutationFn: ({ p, i }: { p: string; i: string }) => api.restartRemoteInstance(p, i), onSuccess: () => qc.invalidateQueries({ queryKey: ['remote-instances', profileId] }) });
  const quickTest = useMutation({
    mutationFn: async ({ p, i, modelOverride, skipAutoRetry }: { p: string; i: string; modelOverride?: string | null; skipAutoRetry?: boolean }) => {
      const targetKey = remoteHandoffKey;
      const trimmedOverride = modelOverride?.trim() || null;
      const testedName = trimmedOverride || selectedInstance?.config.served_model_name || selectedInstance?.config.model || selectedInstance?.name || 'model';
      const result = await api.remoteChat(p, i, { messages: [{ role: 'user', content: prompt }], max_tokens: 80, temperature: 0.2, model_override: trimmedOverride });
      const suggestedName = result.suggested_model_name?.trim();
      const canAutoRetryServedName = !result.ok && !trimmedOverride && !skipAutoRetry && suggestedName;
      if (canAutoRetryServedName) {
        const retryResult = await api.remoteChat(p, i, { messages: [{ role: 'user', content: prompt }], max_tokens: 80, temperature: 0.2, model_override: suggestedName });
        if (retryResult.ok) return { result: retryResult, targetKey, testedName: suggestedName, autoRetriedModelName: suggestedName };
        return { result: retryResult, targetKey, testedName, autoRetriedModelName: suggestedName, firstResult: result };
      }
      return { result, targetKey, testedName, autoRetriedModelName: null, firstResult: null };
    },
    onMutate: () => {
      setTestResult(null);
      setTestedRemoteHandoffKey('');
      setTestedRemoteModelName('');
      setTestError(null);
      setTestNextActions([]);
      setTestLastRunAt(null);
    },
    onSuccess: ({ result, targetKey, testedName, autoRetriedModelName }) => {
      setTestLastRunAt(new Date().toLocaleTimeString());
      setTestResult(result);
      setTestedRemoteHandoffKey(result.ok ? targetKey : '');
      setTestedRemoteModelName(result.ok ? testedName : '');
      setTestError(result.ok ? null : (result.user_message ?? result.error ?? 'Remote endpoint returned an error.'));
      setTestNextActions(result.ok ? [] : (result.next_actions ?? ['Open logs', 'Try again', 'Restart the selected remote model']));
      if (result.ok && autoRetriedModelName) setCopied(false);
    },
    onError: (err) => {
      setTestLastRunAt(new Date().toLocaleTimeString());
      setTestResult(null);
      setTestedRemoteHandoffKey('');
      setTestedRemoteModelName('');
      setTestError(remoteErrorMessage(err));
      setTestNextActions(['Check remote connection', 'Open logs', 'Try again']);
    },
  });

  useEffect(() => {
    setTestResult(null);
    setTestedRemoteHandoffKey('');
    setTestedRemoteModelName('');
    setTestError(null);
    setTestNextActions([]);
    setTestLastRunAt(null);
    setCopied(false);
    setCopyConfirmation(null);
  }, [remoteHandoffKey]);

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate({ name, base_url: baseUrl, api_key: apiKey || null, notes, is_default: profiles.data?.length === 0 });
  }

  function selectManualCopyText() {
    manualCopyRef.current?.focus();
    manualCopyRef.current?.select();
  }

  async function copyWithFeedback(text: string, label = 'Text') {
    const ok = await copyText(text);
    setCopied(ok);
    if (ok) {
      setManualCopyText(null);
      setCopyConfirmation(buildCopyConfirmation(text, label));
      setTimeout(() => setCopied(false), 1800);
    } else {
      setManualCopyLabel(label);
      setManualCopyText(text);
      setCopyConfirmation(null);
    }
  }

  async function copyEndpoint() {
    if (!canCopyEndpoint || !endpoint) return;
    await copyWithFeedback(endpoint, 'Base URL');
  }

  const doctor = healthDoctor(activeProfile, activeProbe, forwardDoctor.data);
  const running = runningInstances(instances.data);
  const otherRunningCount = running.filter((instance) => instance.id !== selectedInstance?.id).length;
  const remoteTestState = quickTest.isPending ? 'running' : testResult?.ok ? 'passed' : testError ? 'failed' : 'idle';
  const remoteTestTitle = remoteTestState === 'running' ? 'Testing remote model...' : remoteTestState === 'passed' ? 'Remote test passed' : remoteTestState === 'failed' ? 'Remote test needs attention' : 'Remote test not run yet';
  const remoteTestHint = remoteTestState === 'running'
    ? 'Sending one chat request to the selected remote /v1/chat/completions endpoint.'
    : remoteTestState === 'passed'
      ? 'The selected remote model responded. Copy is now unlocked for this /v1 base URL.'
      : remoteTestState === 'failed'
        ? 'The remote endpoint is reachable, but the test request failed. Open logs if it repeats.'
        : 'Run one short test before handing off the endpoint.';
  const remoteAssistantText = testResult?.ok ? extractAssistantText(testResult.response) : '';
  const remoteSuggestedModel = !testResult?.ok ? testResult?.suggested_model_name : null;
  const remoteServedNames = !testResult?.ok ? (testResult?.served_model_names ?? []) : [];

  return (
    <div className="remote-simple-page remote-focused-page stack">
      <section className="card remote-workbench-card">
        <div className="remote-workbench-header">
          <div>
            <p className="label">Remote GPU</p>
            <h2>{activeProfile?.name ?? 'Connect a remote GPU'}</h2>
            <p className="muted">Daily remote controls: connection, running model, endpoint, quick test, and logs.</p>
          </div>
          <div className="remote-workbench-actions">
            <select className="input" value={profileId} onChange={(e) => { setProfileId(e.target.value); setSelectedInstanceId(''); setShowLogs(false); }}>
              <option value="">Choose remote GPU</option>
              {profiles.data?.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} · {profile.base_url}</option>)}
            </select>
            <button className="btn secondary" disabled={!activeProfile || probe.isPending} onClick={() => activeProfile && probe.mutate(activeProfile.id)}><RefreshCw size={15} /> Recheck</button>
          </div>
        </div>

        <div className="remote-compact-facts">
          <div>
            <span>Connection</span>
            <strong className={`remote-connection ${state.tone}`}>{state.connected ? <Wifi size={14} /> : <WifiOff size={14} />} {state.label}</strong>
          </div>
          <div>
            <span>Selected model</span>
            <strong>{selectedInstance ? `${selectedInstance.name} · ${selectedInstance.status}` : 'None'}</strong>
          </div>
          <div>
            <span>Selected endpoint</span>
            <strong>{endpoint || 'Start selected model first'}</strong>
          </div>
          <div>
            <span>GPU</span>
            <strong>{firstGpuSummary(doctor, metrics.data)}</strong>
          </div>
        </div>

        {errorLabel(activeProfile, activeProbe) && <p className="error remote-one-line-error">{errorLabel(activeProfile, activeProbe)}</p>}

        {!activeProfile ? (
          <div className="empty-state remote-empty-state">
            Add a remote GPU once. After that this page stays focused on run, test, and copy endpoint.
          </div>
        ) : selectedInstance ? (
          <div className="remote-current-model-panel">
            <div>
              <p className="label">Selected model</p>
              <h3>{selectedInstance.name}</h3>
              <p className="muted" title={selectedInstance.config.model}>{selectedInstance.config.model}</p>
            </div>
            <span className={`server-status ${selectedInstance.status}`}>{selectedInstance.status}</span>
            <div className={endpointVisualReady ? 'remote-endpoint-card compact ready' : endpointReady ? 'remote-endpoint-card compact untested' : 'remote-endpoint-card compact blocked'}>
              <span>{endpointVisualReady ? 'Tested /v1 base URL' : endpointReady ? 'Untested /v1 base URL' : '/v1 base URL for selected model'}</span>
              <code title={endpoint || undefined}>{endpoint || 'Not ready yet'}</code>
              <p className="muted tiny">{endpointReady ? endpointBlockedReason : endpointBlockedReason}</p>
              <div className={remoteTestPassed ? 'tested-model-strip ready' : 'tested-model-strip'}>
                <span>{remoteTestPassed ? 'Tested model name' : 'Model name will be confirmed by test'}</span>
                <code title={remoteHandoffModelName}>{remoteHandoffModelName}</code>
                <button className="tag-chip mini" type="button" disabled={!remoteTestPassed} onClick={() => copyWithFeedback(remoteHandoffModelName, 'Model name')}>Copy model</button>
                <button className="tag-chip mini" type="button" disabled={!canCopyEndpoint} onClick={() => copyWithFeedback(remoteHandoffBundle, 'Endpoint handoff')}>Copy handoff</button>
                <button className="tag-chip mini" type="button" disabled={!canCopyEndpoint} onClick={() => copyWithFeedback(remoteEnvHandoff, 'safe .env handoff')}>Copy safe .env</button>
              </div>
              <button className="btn secondary" disabled={!canCopyEndpoint} onClick={copyEndpoint}><Copy size={15} /> {copied ? 'Copied' : canCopyEndpoint ? 'Copy base URL' : 'Test first to copy'}</button>
            </div>
            {copyConfirmation && (
              <div className="copy-confirmation-card remote-copy-confirmation" role="status" aria-live="polite">
                <CheckCircle2 size={17} />
                <div className="copy-confirmation-copy">
                  <strong>{copyConfirmation.label}</strong>
                  <code title={copyConfirmation.preview}>{copyConfirmation.preview}</code>
                  <p className="muted tiny">{copyConfirmation.charCount.toLocaleString()} characters copied for this selected remote run.</p>
                </div>
                <button className="tag-chip mini" type="button" onClick={() => setCopyConfirmation(null)}>Hide</button>
              </div>
            )}
            {manualCopyText && (
              <div className="manual-copy-card remote-manual-copy">
                <div className="row-between">
                  <div>
                    <p className="label">Manual copy fallback</p>
                    <strong>{manualCopyLabel}</strong>
                  </div>
                  <div className="manual-copy-actions">
                    <button className="tag-chip mini" type="button" onClick={selectManualCopyText}>Select all</button>
                    <button className="tag-chip mini" type="button" onClick={() => setManualCopyText(null)}>Hide</button>
                  </div>
                </div>
                <textarea ref={manualCopyRef} className="input area manual-copy-text" readOnly value={manualCopyText} onFocus={(event) => event.currentTarget.select()} />
                <p className="muted tiny">{manualCopyText.length.toLocaleString()} characters. Select all, then copy. This appears only when browser clipboard access is blocked.</p>
              </div>
            )}
            <div className="run-success-actions remote-primary-actions">
              <button className="btn" disabled={selectedInstance.status === 'running' || start.isPending} onClick={() => activeProfile && start.mutate({ p: activeProfile.id, i: selectedInstance.id })}><Play size={15} /> Start</button>
              <button className="btn secondary" disabled={selectedInstance.status !== 'running' || stop.isPending} onClick={() => activeProfile && stop.mutate({ p: activeProfile.id, i: selectedInstance.id })}><Unplug size={15} /> Stop</button>
              <button className="btn secondary" disabled={restart.isPending} onClick={() => activeProfile && restart.mutate({ p: activeProfile.id, i: selectedInstance.id })}><RotateCcw size={15} /> Restart</button>
              <button className="btn secondary" onClick={() => setShowLogs((value) => !value)}><TerminalSquare size={15} /> {showLogs ? 'Hide logs' : 'Logs'}</button>
            </div>
            {otherRunningCount > 0 && <p className="muted tiny">{otherRunningCount} other remote model{otherRunningCount === 1 ? ' is' : 's are'} running. Select one before copying its endpoint.</p>}
          </div>
        ) : (
          <div className="empty-state remote-empty-state">No remote models found yet. Start or add a model on the remote machine, then recheck.</div>
        )}
      </section>

      {selectedInstance && endpointReady && activeProfile && (
        <section className="card remote-test-card remote-compact-test">
          <div className="row-between">
            <div>
              <p className="label">Quick test</p>
              <h3>Ask the remote model once</h3>
            </div>
            <button className="btn" disabled={quickTest.isPending} onClick={() => quickTest.mutate({ p: activeProfile.id, i: selectedInstance.id })}><Zap size={15} /> Test</button>
          </div>
          <textarea className="input area" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <div className={`quick-test-result ${remoteTestState}`}>
            <div className="quick-test-result-head">
              <span className="quick-test-icon">{remoteTestState === 'passed' ? <CheckCircle2 size={16} /> : remoteTestState === 'failed' ? <XCircle size={16} /> : <Zap size={16} />}</span>
              <div><strong>{remoteTestTitle}</strong><p>{remoteTestHint}</p></div>
              {testResult?.latency_ms != null && <span className="pill soft">{testResult.latency_ms} ms</span>}
            </div>
            {remoteAssistantText && <pre className="quick-test-preview">{remoteAssistantText}</pre>}
            {testError && <div className="inline-warning">{testError}</div>}
            {remoteSuggestedModel && (
              <div className="served-model-hint">
                <span>Remote vLLM reports served model</span>
                <button className="tag-chip mini active" type="button" onClick={async () => { await copyText(remoteSuggestedModel); setCopied(true); }}>{remoteSuggestedModel}</button>
                <button className="tag-chip mini" type="button" onClick={() => activeProfile && selectedInstance && quickTest.mutate({ p: activeProfile.id, i: selectedInstance.id, modelOverride: remoteSuggestedModel })}>Test with this name</button>
                {remoteServedNames.length > 1 && <small>{remoteServedNames.length} served names found.</small>}
              </div>
            )}
            {testNextActions.length > 0 && (
              <div className="quick-test-next-actions">
                <span>Try next:</span>
                {testNextActions.slice(0, 3).map((action) => <em key={action}>{action}</em>)}
              </div>
            )}
            {testLastRunAt && <p className="muted tiny">Last test: {testLastRunAt}{remoteTestPassed && testedRemoteModelName ? ` · model ${testedRemoteModelName}` : ''}{remoteTestedNameDiffers ? ' · auto-tested served name' : ''}</p>}
            {remoteTestPassed && <p className="muted tiny">{remoteModelNameSummary}</p>}
          </div>
        </section>
      )}

      {showLogs && activeProfile && selectedInstance && (
        <section className="card">
          <div className="row-between"><h3>Remote logs</h3><span className="status">live</span></div>
          <LogsPanel profileId={activeProfile.id} instanceId={selectedInstance.id} />
        </section>
      )}

      <details className="card remote-secondary-details">
        <summary><Server size={15} /> Remote models and GPU health</summary>
        <div className="remote-secondary-grid">
          <div>
            <div className="row-between">
              <h3>Remote models</h3>
              <button className="btn secondary" disabled={!activeProfile} onClick={() => instances.refetch()}>Refresh</button>
            </div>
            {instances.isError && <p className="error">Could not load remote models: {(instances.error as Error).message}</p>}
            <div className="remote-instance-list">
              {instances.data?.map((instance) => (
                <button
                  key={instance.id}
                  className={instance.id === selectedInstance?.id ? 'remote-instance-row active' : 'remote-instance-row'}
                  onClick={() => { setSelectedInstanceId(instance.id); setShowLogs(false); }}
                >
                  <span><strong>{instance.name}</strong><small>{instance.config.model}</small></span>
                  <em className={`server-status ${instance.status}`}>{instance.status}</em>
                </button>
              ))}
            </div>
            {instances.data?.length === 0 && <p className="muted">No remote models yet.</p>}
          </div>
          <div className="stack">
            <div>
              <div className="row-between">
                <h3><Cpu size={16} /> GPU health</h3>
                <button className="btn secondary" disabled={!activeProfile || forwardDoctor.isPending} onClick={() => activeProfile && forwardDoctor.mutate(activeProfile.id)}><Activity size={15} /> Refresh</button>
              </div>
              <GpuHealth doctor={doctor} metrics={metrics.data} />
            </div>
            <div>
              <h3><Activity size={16} /> Runtime metrics</h3>
              <MetricSummaryCard metrics={metrics.data} />
            </div>
          </div>
        </div>
      </details>

      <details className="card remote-secondary-details">
        <summary><Plus size={15} /> Add or manage remote GPUs</summary>
        <div className="remote-secondary-grid">
          <form className="form" onSubmit={submit}>
            <label>Name<input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label>Controller URL<input className="input" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} /></label>
            <label>API key<input className="input" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="optional" /></label>
            <label>Notes<input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
            <button className="btn" disabled={create.isPending}>Add remote</button>
          </form>
          <div className="remote-profile-list">
            <h3>Saved remotes</h3>
            {profiles.data?.map((profile) => {
              const profileState = remoteState(profile, latestProbe(profile, probeResults));
              return (
                <div className="remote-profile-row" key={profile.id}>
                  <button onClick={() => setProfileId(profile.id)} className={profile.id === profileId ? 'active' : ''}>
                    <strong>{profile.name}</strong>
                    <small>{profile.base_url}</small>
                  </button>
                  <div className="row">
                    {profile.is_default && <span className="status">default</span>}
                    <span className={`remote-dot ${profileState.tone}`} />
                    <button className="tag-chip mini" onClick={() => probe.mutate(profile.id)}>check</button>
                    <button className="tag-chip mini" onClick={() => setDefault.mutate(profile.id)}>default</button>
                    <button className="tag-chip mini" onClick={() => remove.mutate(profile.id)}>delete</button>
                  </div>
                </div>
              );
            })}
            {!profiles.data?.length && <p className="muted">No saved remote GPU controllers yet.</p>}
          </div>
        </div>
      </details>
    </div>
  );
}
