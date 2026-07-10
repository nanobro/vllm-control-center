import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, StreamErrorPayload, streamRemoteChat } from '../api/client';

export function RemotePlaygroundPage() {
  const profiles = useQuery({ queryKey: ['remoteProfiles'], queryFn: api.remoteProfiles });
  const defaultProfileId = useMemo(() => profiles.data?.find((p) => p.is_default)?.id ?? profiles.data?.[0]?.id ?? '', [profiles.data]);
  const [profileId, setProfileId] = useState('');
  const selectedProfileId = profileId || defaultProfileId;
  const instances = useQuery({
    queryKey: ['remoteInstances', selectedProfileId],
    queryFn: () => api.remoteInstances(selectedProfileId),
    enabled: Boolean(selectedProfileId),
    refetchInterval: 4000,
  });
  const running = instances.data?.filter((x) => x.status === 'running') ?? [];
  const [instanceId, setInstanceId] = useState('');
  const selectedInstanceId = instanceId || running[0]?.id || '';
  const [prompt, setPrompt] = useState('Say hello from the remote vLLM server in one sentence.');
  const [system, setSystem] = useState('You are a concise local AI assistant running through a remote vLLM controller.');
  const [streaming, setStreaming] = useState(true);
  const [streamOutput, setStreamOutput] = useState('');
  const [streamError, setStreamError] = useState('');
  const [streamErrorActions, setStreamErrorActions] = useState<string[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const chat = useMutation({
    mutationFn: (body: { messages: { role: string; content: string }[]; temperature?: number; top_p?: number; max_tokens?: number }) =>
      api.remoteChat(selectedProfileId, selectedInstanceId, body),
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!selectedProfileId || !selectedInstanceId) return;
    const body = {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 512,
    };
    setStreamOutput('');
    setStreamError('');
    setStreamErrorActions([]);
    setLatencyMs(null);
    if (!streaming) {
      chat.mutate(body);
      return;
    }
    setIsStreaming(true);
    try {
      await streamRemoteChat(selectedProfileId, selectedInstanceId, body, {
        onToken: (text) => setStreamOutput((prev) => prev + text),
        onDone: (ms) => { setLatencyMs(ms ?? null); setIsStreaming(false); },
        onError: (message, payload?: StreamErrorPayload) => { setStreamError(message); setStreamErrorActions(payload?.next_actions ?? []); setIsStreaming(false); },
      });
    } catch (error) {
      setStreamError((error as Error).message);
      setStreamErrorActions(['Check that the controller is reachable', 'Try again']);
      setIsStreaming(false);
    }
  }

  return (
    <>
      <h2>Remote Playground</h2>
      <p className="muted">Chat through your local UI while the selected remote controller talks to its vLLM instance.</p>
      <form className="card" onSubmit={submit}>
        <label>Remote controller
          <select className="input" value={selectedProfileId} onChange={(e) => { setProfileId(e.target.value); setInstanceId(''); }}>
            {profiles.data?.length === 0 && <option value="">No remote profiles</option>}
            {profiles.data?.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} · {profile.base_url}</option>)}
          </select>
        </label>
        <label>Running remote instance
          <select className="input" value={selectedInstanceId} onChange={(e) => setInstanceId(e.target.value)}>
            {running.length === 0 && <option value="">No running remote instances</option>}
            {running.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.config.model}</option>)}
          </select>
        </label>
        <label>System prompt<textarea className="input area" value={system} onChange={(e) => setSystem(e.target.value)} /></label>
        <label>User prompt<textarea className="input area" value={prompt} onChange={(e) => setPrompt(e.target.value)} /></label>
        <label className="row"><input type="checkbox" checked={streaming} onChange={(e) => setStreaming(e.target.checked)} /> Streaming</label>
        <button className="btn" disabled={!selectedProfileId || !selectedInstanceId || chat.isPending || isStreaming}>
          {isStreaming ? 'Streaming remote tokens...' : 'Send remote test chat'}
        </button>
      </form>
      {streaming && (streamOutput || streamError || latencyMs !== null || isStreaming) && <div className="card">
        <div className="row"><h3 style={{ marginRight: 'auto' }}>Remote streaming response</h3>{latencyMs !== null && <span className="status">{latencyMs} ms</span>}</div>
        {streamError && <p style={{ color: '#b91c1c' }}>{streamError}</p>}
        {streamErrorActions.length > 0 && <div className="hint-list">{streamErrorActions.map((action) => <span className="hint-pill" key={action}>{action}</span>)}</div>}
        <pre>{streamOutput || 'Waiting for remote tokens...'}</pre>
      </div>}
      {!streaming && chat.data && <div className="card">
        <div className="row"><h3 style={{ marginRight: 'auto' }}>Remote response</h3><span className="status">{chat.data.latency_ms} ms</span><span className="status">HTTP {chat.data.status_code}</span></div>
        {chat.data.error && <p style={{ color: '#b91c1c' }}>{chat.data.user_message ?? chat.data.error}</p>}
        {(chat.data.next_actions?.length ?? 0) > 0 && <div className="hint-list">{chat.data.next_actions?.map((action) => <span className="hint-pill" key={action}>{action}</span>)}</div>}
        <pre>{JSON.stringify(chat.data.response, null, 2)}</pre>
      </div>}
    </>
  );
}
