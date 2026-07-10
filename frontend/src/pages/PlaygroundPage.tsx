import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, InstanceRecord, StreamErrorPayload, streamChat } from '../api/client';

const ACTIVE_PLAYGROUND_STATUSES = new Set<InstanceRecord['status']>(['running', 'starting']);

function displayHost(host: string): string {
  return !host || host === '0.0.0.0' || host === '::' ? 'localhost' : host;
}

function isPlaygroundSelectable(instance: InstanceRecord): boolean {
  return ACTIVE_PLAYGROUND_STATUSES.has(instance.status);
}

function instanceLabel(instance: InstanceRecord): string {
  const statusLabel = instance.status === 'running' ? 'Loaded' : instance.status === 'starting' ? 'Warming' : instance.status;
  return `${statusLabel}: ${instance.name} · ${instance.config.served_model_name || instance.config.model} · :${instance.port}`;
}

function shouldAutoRetryServedName(payload?: StreamErrorPayload): payload is StreamErrorPayload & { suggested_model_name: string } {
  return payload?.error_type === 'served_model_name_mismatch' && Boolean(payload.suggested_model_name?.trim());
}

function servedNameRetryMessage(suggested: string): string {
  return `vLLM is serving this endpoint as “${suggested}”. Playground retried automatically with that served model name.`;
}

export function PlaygroundPage({ initialInstanceId }: { initialInstanceId?: string | null }) {
  const instances = useQuery({ queryKey: ['instances'], queryFn: api.instances, refetchInterval: 3000 });
  const activeInstances = useMemo(() => instances.data?.filter(isPlaygroundSelectable) ?? [], [instances.data]);
  const [instanceId, setInstanceId] = useState(initialInstanceId ?? '');
  const [prompt, setPrompt] = useState('Say hello from vLLM in one sentence.');
  const [system, setSystem] = useState('You are a concise local AI assistant.');
  const [streaming, setStreaming] = useState(true);
  const [streamOutput, setStreamOutput] = useState('');
  const [streamError, setStreamError] = useState('');
  const [streamErrorActions, setStreamErrorActions] = useState<string[]>([]);
  const [autoRetryNotice, setAutoRetryNotice] = useState('');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamAbortRef = useRef<AbortController | null>(null);
  const chat = useMutation({ mutationFn: api.chat });

  const selected = instanceId || activeInstances[0]?.id || '';
  const selectedInstance = useMemo(
    () => instances.data?.find((item) => item.id === selected) ?? null,
    [instances.data, selected],
  );
  const selectedIsActive = selectedInstance ? isPlaygroundSelectable(selectedInstance) : false;
  const selectedEndpoint = selectedInstance ? `http://${displayHost(selectedInstance.host)}:${selectedInstance.port}/v1` : '';
  const inactiveSelected = selectedInstance && !selectedIsActive ? selectedInstance : null;
  const selectableInstances = useMemo(() => {
    if (!inactiveSelected) return activeInstances;
    return [inactiveSelected, ...activeInstances.filter((item) => item.id !== inactiveSelected.id)];
  }, [activeInstances, inactiveSelected]);

  useEffect(() => {
    if (initialInstanceId) setInstanceId(initialInstanceId);
  }, [initialInstanceId]);

  useEffect(() => {
    if (!instanceId && activeInstances[0]?.id) {
      setInstanceId(activeInstances[0].id);
    }
  }, [activeInstances, instanceId]);

  useEffect(() => {
    setAutoRetryNotice('');
    setStreamError('');
    setStreamErrorActions([]);
  }, [selected]);

  function stopStreaming() {
    streamAbortRef.current?.abort();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!selected || !selectedIsActive) return;

    streamAbortRef.current?.abort();

    const makeBody = (modelOverride?: string) => ({
      instance_id: selected,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 512,
      model_override: modelOverride,
    });

    setStreamOutput('');
    setStreamError('');
    setStreamErrorActions([]);
    setAutoRetryNotice('');
    setLatencyMs(null);
    chat.reset();

    if (!streaming) {
      const result = await chat.mutateAsync(makeBody());
      if (!result.ok && result.error_type === 'served_model_name_mismatch' && result.suggested_model_name) {
        setAutoRetryNotice(servedNameRetryMessage(result.suggested_model_name));
        await chat.mutateAsync(makeBody(result.suggested_model_name));
      }
      return;
    }

    setIsStreaming(true);
    const abortController = new AbortController();
    streamAbortRef.current = abortController;
    const runStream = async (modelOverride?: string, autoRetryUsed = false): Promise<void> => {
      await streamChat(makeBody(modelOverride), {
        onToken: (text) => setStreamOutput((prev) => prev + text),
        onDone: (ms) => {
          setLatencyMs(ms ?? null);
          setIsStreaming(false);
          if (streamAbortRef.current === abortController) streamAbortRef.current = null;
        },
        onError: async (message, payload?: StreamErrorPayload) => {
          if (!autoRetryUsed && shouldAutoRetryServedName(payload)) {
            const suggested = payload.suggested_model_name.trim();
            setAutoRetryNotice(servedNameRetryMessage(suggested));
            setStreamError('');
            setStreamErrorActions([`Retrying with served model name: ${suggested}`]);
            setStreamOutput('');
            await runStream(suggested, true);
            return;
          }
          setStreamError(message);
          setStreamErrorActions(payload?.next_actions ?? []);
          setIsStreaming(false);
          if (streamAbortRef.current === abortController) streamAbortRef.current = null;
        },
      }, { signal: abortController.signal });
    };

    try {
      await runStream();
    } catch (error) {
      setStreamError((error as Error).message);
      setStreamErrorActions(['Check that the controller is reachable', 'Try again']);
      setIsStreaming(false);
      if (streamAbortRef.current === abortController) streamAbortRef.current = null;
    }
  }

  return (
    <>
      <div className="row-between playground-heading">
        <div>
          <h2>Playground</h2>
          <p className="muted">Send a test chat to the model that is actually loaded on this machine.</p>
        </div>
        {activeInstances.length > 0 && <span className="pill running">{activeInstances.length} loaded</span>}
      </div>
      <form className="card" onSubmit={submit}>
        <label>Loaded model
          <select className="input" value={selected} onChange={(e) => setInstanceId(e.target.value)}>
            {selectableInstances.length === 0 && <option value="">No loaded models</option>}
            {selectableInstances.map((item) => <option key={item.id} value={item.id}>{instanceLabel(item)}</option>)}
          </select>
        </label>
        {instances.isLoading && <div className="empty-state compact-empty-state">Checking loaded models...</div>}
        {!instances.isLoading && activeInstances.length === 0 && (
          <div className="inline-warning playground-state-message">
            No loaded model is available for Playground yet. Go to Run Model, start one model, and wait for Warming up to become Running.
          </div>
        )}
        {selectedInstance && (
          <div className={selectedIsActive ? 'playground-selected-model' : 'inline-warning playground-state-message'}>
            <div>
              <span>{selectedInstance.status === 'running' ? 'Loaded model' : selectedInstance.status === 'starting' ? 'Model warming up' : 'Selected model'}</span>
              <strong title={selectedInstance.config.served_model_name || selectedInstance.config.model}>{selectedInstance.config.served_model_name || selectedInstance.config.model}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{selectedInstance.status}</strong>
            </div>
            <div>
              <span>Endpoint</span>
              <code title={selectedEndpoint}>{selectedEndpoint}</code>
            </div>
          </div>
        )}
        {selectedInstance?.status === 'starting' && (
          <div className="empty-state compact-empty-state">
            This model is still warming up. Playground can test it, but if it waits too long, open Logs and check whether /v1/models became ready.
          </div>
        )}
        <label>System prompt<textarea className="input area" value={system} onChange={(e) => setSystem(e.target.value)} /></label>
        <label>User prompt<textarea className="input area" value={prompt} onChange={(e) => setPrompt(e.target.value)} /></label>
        <label className="row"><input type="checkbox" checked={streaming} onChange={(e) => setStreaming(e.target.checked)} /> Streaming</label>
        <div className="row playground-submit-row">
          <button className="btn" disabled={!selectedIsActive || chat.isPending || isStreaming}>{isStreaming ? 'Streaming...' : 'Send test chat'}</button>
          {isStreaming && <button className="btn secondary" type="button" onClick={stopStreaming}>Stop test</button>}
        </div>
        {autoRetryNotice && <div className="playground-auto-retry-notice">{autoRetryNotice}</div>}
      </form>
      {streaming && (streamOutput || streamError || latencyMs !== null || isStreaming || autoRetryNotice) && <div className="card">
        <div className="row"><h3 style={{ marginRight: 'auto' }}>Streaming response</h3>{latencyMs !== null && <span className="status">{latencyMs} ms</span>}</div>
        {streamError && <p style={{ color: '#b91c1c' }}>{streamError}</p>}
        {streamErrorActions.length > 0 && <div className="hint-list">{streamErrorActions.map((action) => <span className="hint-pill" key={action}>{action}</span>)}</div>}
        <pre>{streamOutput || (isStreaming ? 'Waiting for first token…' : 'No tokens received yet.')}</pre>
      </div>}
      {!streaming && chat.data && <div className="card">
        <div className="row"><h3 style={{ marginRight: 'auto' }}>Response</h3><span className="status">{chat.data.latency_ms} ms</span><span className="status">HTTP {chat.data.status_code}</span></div>
        {chat.data.error && <p style={{ color: '#b91c1c' }}>{chat.data.user_message ?? chat.data.error}</p>}
        {(chat.data.next_actions?.length ?? 0) > 0 && <div className="hint-list">{chat.data.next_actions?.map((action) => <span className="hint-pill" key={action}>{action}</span>)}</div>}
        <pre>{JSON.stringify(chat.data.response, null, 2)}</pre>
      </div>}
    </>
  );
}
