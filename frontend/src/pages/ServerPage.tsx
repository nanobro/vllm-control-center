import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, AlertTriangle, Box, CheckCircle2, Clipboard, Copy, Download, Gauge, HardDrive, Info, Play, RefreshCw, Search, Square, TerminalSquare, Trash2, Wrench, XCircle, Zap } from 'lucide-react';
import { api, CatalogModelRecord, DoctorReport, DownloadJobRecord, HfModelVariant, InstanceRecord, LocalModelRecord, LogLine, ServerQaCheck, ServerQaSummary, openLogStream } from '../api/client';
import { ModelDetail, ModelDetailDrawer } from '../components/ModelDetailDrawer';
import { ErrorRecoveryCard } from '../components/ErrorRecoveryCard';

function statusClass(status?: string) {
  if (status === 'running') return 'server-status running';
  if (status === 'starting') return 'server-status starting';
  if (status === 'crashed') return 'server-status crashed';
  return 'server-status stopped';
}

function endpointFor(instance?: InstanceRecord | null) {
  if (!instance) return 'No server selected';
  const host = instance.host === '0.0.0.0' ? 'localhost' : instance.host;
  return `http://${host}:${instance.port}/v1`;
}


function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function modelNameForApi(instance?: InstanceRecord | null) {
  return instance?.config.served_model_name || instance?.name || instance?.config.model || 'model';
}

function buildCurlSnippet(endpoint: string, modelName: string) {
  return [
    `curl ${shellQuote(`${endpoint}/chat/completions`)} \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -d ${shellQuote(JSON.stringify({
      model: modelName,
      messages: [{ role: 'user', content: 'Say hello from vLLM.' }],
      max_tokens: 80,
    }))}`,
  ].join('\n');
}

function buildOpenAiJsSnippet(endpoint: string, modelName: string) {
  return [
    `import OpenAI from 'openai';`,
    ``,
    `const client = new OpenAI({`,
    `  baseURL: '${endpoint}',`,
    `  apiKey: 'not-needed-for-local',`,
    `});`,
    ``,
    `const result = await client.chat.completions.create({`,
    `  model: '${modelName}',`,
    `  messages: [{ role: 'user', content: 'Say hello from vLLM.' }],`,
    `});`,
    ``,
    `console.log(result.choices[0].message.content);`,
  ].join('\n');
}

function buildOpenAiPythonSnippet(endpoint: string, modelName: string) {
  return [
    `from openai import OpenAI`,
    ``,
    `client = OpenAI(`,
    `    base_url="${endpoint}",`,
    `    api_key="not-needed-for-local",`,
    `)`,
    ``,
    `result = client.chat.completions.create(`,
    `    model="${modelName}",`,
    `    messages=[{"role": "user", "content": "Say hello from vLLM."}],`,
    `)`,
    ``,
    `print(result.choices[0].message.content)`,
  ].join('\n');
}

function buildHandoffBundle(endpoint: string, modelName: string) {
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

function buildEnvHandoff(endpoint: string, modelName: string) {
  return [
    `# Tested by vLLM Control Center. Paste into your app .env file.`,
    `OPENAI_BASE_URL=${dotenvValue(endpoint)}`,
    `OPENAI_MODEL=${dotenvValue(modelName)}`,
    `OPENAI_API_KEY=not-needed-for-local`,
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
  if (/curl/i.test(label)) return 'Copied curl snippet';
  if (/javascript|js/i.test(label)) return 'Copied JavaScript snippet';
  if (/python/i.test(label)) return 'Copied Python snippet';
  if (/command/i.test(label)) return 'Copied command';
  return `Copied ${label}`;
}

function copyPreview(text: string) {
  const compact = text.split(/\s*\n\s*/).find(Boolean) ?? text;
  return compact.length > 96 ? `${compact.slice(0, 93)}...` : compact;
}

function buildCopyConfirmation(text: string, label: string): CopyConfirmation {
  return { label: copyConfirmationLabel(label), preview: copyPreview(text), charCount: text.length };
}


function shortModelId(value?: string | null, max = 46) {
  if (!value) return '';
  if (value.length <= max) return value;
  const head = Math.ceil((max - 3) * 0.55);
  const tail = Math.floor((max - 3) * 0.45);
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function simpleModelName(value?: string | null) {
  if (!value) return 'None selected';
  const parts = value.split(/[\/]/).filter(Boolean);
  const last = parts[parts.length - 1] ?? value;
  return shortModelId(last.replace(/^models--/, '').replace(/--/g, '/'), 54);
}

function localOptionLabel(model: LocalModelRecord) {
  const base = `${model.variant_label ?? model.display_name} — ${shortModelId(model.model_id, 42)}`;
  if (model.active_status === 'crashed') {
    return `${base} — CRASHED: ${shortModelId(model.active_last_error || 'load failed', 34)}`;
  }
  if (model.active_status === 'starting') return `${base} — warming up`;
  if (model.active_status === 'running') return `${base} — running`;
  return base;
}

function modelSlug(modelId: string) {
  return modelId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'vllm-model';
}

function instanceMatchesModel(instance: InstanceRecord, modelId?: string | null, localPath?: string | null) {
  if (!modelId && !localPath) return false;
  return instance.config.model === modelId || Boolean(localPath && instance.config.model === localPath);
}

function statusRank(status: string) {
  if (status === 'running') return 0;
  if (status === 'starting') return 1;
  if (status === 'stopped') return 2;
  if (status === 'crashed') return 3;
  return 4;
}

function compactBytesLabel(model?: CatalogModelRecord | null) {
  if (!model) return 'Unknown';
  return model.size_label ?? (model.parameter_count_b ? `${model.parameter_count_b}B params` : 'Unknown');
}

function formatApiError(err: unknown) {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.detail === 'string') return parsed.detail;
    if (Array.isArray(parsed.detail)) return parsed.detail.map((item: { msg?: string }) => item.msg ?? JSON.stringify(item)).join('\n');
    if (parsed.error) return String(parsed.error);
  } catch {
    // ignore JSON parse failures
  }
  if (/Command not found: vllm|vLLM CLI not found|No module named ['\"]?vllm|not installed or not in this environment/i.test(raw)) {
    return `${raw}\n\nInstall vLLM in the same Python environment that runs the controller, then recheck setup. Example: python -m pip install vllm`;
  }
  if (/address already in use|port.*in use|Port already used/i.test(raw)) {
    return `${raw}\n\nThe port is occupied. Retry to use the next free port, or stop the existing server first.`;
  }
  if (/CUDA out of memory|out of memory|Insufficient GPU memory/i.test(raw)) {
    return `${raw}\n\nUse Low VRAM, lower max model length, lower GPU memory utilization, or unload other models. Large models are not blocked by size alone.`;
  }
  if (/401|gated|Repository Not Found|authentication/i.test(raw)) {
    return `${raw}\n\nThis may be a private/gated Hugging Face model. Set HF_TOKEN and accept the model terms on Hugging Face first.`;
  }
  if (/snapshot path|snapshots\/|config.json|tokenizer/i.test(raw)) {
    return `${raw}\n\nPick the complete model snapshot folder that contains config.json, tokenizer files, and weights.`;
  }
  if (/unsupported architecture|model architectures|wrong model type|diffusion|audio|image/i.test(raw)) {
    return `${raw}\n\nPick a text-generation model or update vLLM if this architecture is newly supported.`;
  }
  return raw;
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

function downloadProgress(job?: DownloadJobRecord | null) {
  if (!job) return null;
  if (job.total_bytes && job.downloaded_bytes != null && job.total_bytes > 0) {
    return Math.max(0, Math.min(100, Math.round((job.downloaded_bytes / job.total_bytes) * 100)));
  }
  if (job.status === 'completed') return 100;
  if (job.status === 'running') return 45;
  if (job.status === 'queued') return 10;
  return null;
}

function extractAssistantText(response: unknown): string {
  const body = response as { choices?: Array<{ message?: { content?: string } }> } | undefined;
  return body?.choices?.[0]?.message?.content ?? '';
}


type VllmPresetId = 'fast-test' | 'balanced' | 'long-context' | 'high-throughput' | 'low-vram' | 'custom';

type LoadPresetInfo = {
  id: VllmPresetId;
  name: string;
  badge: string;
  description: string;
  bestFor: string;
};

type ResolvedLoadPreset = LoadPresetInfo & {
  dtype: string;
  gpuMemory: number;
  maxModelLen: number | null;
  tensorParallelSize: number | null;
  extraArgs: string[];
};

const VLLM_PRESETS: LoadPresetInfo[] = [
  { id: 'fast-test', name: 'Fast test', badge: 'quick check', description: 'Small context and lighter scheduling so users can confirm the model works quickly.', bestFor: 'First run, smoke tests, demos' },
  { id: 'balanced', name: 'Balanced', badge: 'recommended', description: 'Safe everyday settings for most local and remote GPU runs.', bestFor: 'Default app / agent usage' },
  { id: 'long-context', name: 'Long context', badge: 'more tokens', description: 'Prioritizes a larger context window while keeping the rest simple.', bestFor: 'RAG, long docs, coding context' },
  { id: 'high-throughput', name: 'High throughput', badge: 'many users', description: 'Adds batching-friendly defaults for serving more parallel requests.', bestFor: 'Shared endpoint, API traffic' },
  { id: 'low-vram', name: 'Low VRAM', badge: 'safer fit', description: 'Uses less GPU memory and shorter context to reduce out-of-memory failures.', bestFor: 'Small GPUs, borderline models' },
  { id: 'custom', name: 'Custom', badge: 'advanced', description: 'Use exact values from Advanced load settings.', bestFor: 'Known-good vLLM args' },
];

function clampPresetContext(value: number | null, fallback: number, cap: number) {
  const base = value && Number.isFinite(value) ? value : fallback;
  return Math.max(1024, Math.min(base, cap));
}

function resolveLoadPreset(presetId: VllmPresetId, catalog?: CatalogModelRecord | null, localModel?: LocalModelRecord | null): ResolvedLoadPreset {
  const preset = VLLM_PRESETS.find((item) => item.id === presetId) ?? VLLM_PRESETS[1];
  const contextHint = localModel?.context_length ?? catalog?.suggested_max_model_len ?? null;
  const base: Omit<ResolvedLoadPreset, keyof LoadPresetInfo> = {
    dtype: catalog?.default_dtype || 'auto',
    gpuMemory: catalog?.suggested_gpu_memory_utilization ?? 0.92,
    maxModelLen: contextHint ?? catalog?.suggested_max_model_len ?? null,
    tensorParallelSize: null,
    extraArgs: [],
  };

  if (preset.id === 'fast-test') {
    return { ...preset, ...base, gpuMemory: 0.86, maxModelLen: clampPresetContext(contextHint, 4096, 4096), extraArgs: ['--max-num-seqs', '16'] };
  }
  if (preset.id === 'long-context') {
    return { ...preset, ...base, gpuMemory: 0.94, maxModelLen: clampPresetContext(contextHint, 32768, 32768) };
  }
  if (preset.id === 'high-throughput') {
    return { ...preset, ...base, gpuMemory: 0.94, maxModelLen: clampPresetContext(contextHint, 8192, 8192), extraArgs: ['--max-num-seqs', '128', '--enable-prefix-caching'] };
  }
  if (preset.id === 'low-vram') {
    return { ...preset, ...base, gpuMemory: 0.76, maxModelLen: clampPresetContext(contextHint, 4096, 4096), extraArgs: ['--max-num-seqs', '8'] };
  }
  if (preset.id === 'custom') {
    return { ...preset, ...base };
  }
  return { ...preset, ...base, maxModelLen: contextHint ? clampPresetContext(contextHint, 8192, 8192) : null };
}

function ServerLogs({ instanceId }: { instanceId?: string | null }) {
  const [logs, setLogs] = useState<LogLine[]>([]);

  useEffect(() => {
    setLogs([]);
    if (!instanceId) return;
    let closed = false;
    api.logs(instanceId, 80).then((lines) => {
      if (!closed) setLogs(lines);
    }).catch(() => undefined);
    const source = openLogStream(instanceId, (line) => {
      setLogs((current) => [...current, line].slice(-120));
    });
    return () => {
      closed = true;
      source.close();
    };
  }, [instanceId]);

  if (!instanceId) {
    return <pre className="server-log-box">Select or create an instance to see server logs.</pre>;
  }

  return (
    <pre className="server-log-box">
      {logs.length ? logs.map((line) => `${line.created_at} [${line.stream}] ${line.line}`).join('\n') : 'Waiting for server logs...'}
    </pre>
  );
}


function BetaLaunchGuide({
  doneCount,
  totalCount,
  localCount,
  activeDownloads,
  runningName,
  vllmReady,
  onUseDevice,
  onDownload,
  onRefresh,
}: {
  doneCount: number;
  totalCount: number;
  localCount: number;
  activeDownloads: number;
  runningName?: string | null;
  vllmReady?: boolean;
  onUseDevice: () => void;
  onDownload: () => void;
  onRefresh: () => void;
}) {
  const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  return (
    <div className="card beta-launch-card">
      <div className="beta-launch-main">
        <p className="label">First-run guide</p>
        <h3>Get to a working endpoint in one flow</h3>
        <p className="muted">Find a model, load it, quick-test it, then copy the OpenAI-compatible /v1 URL.</p>
        <div className="beta-progress-line"><span style={{ width: `${progress}%` }} /></div>
        <p className="muted"><strong>{doneCount}/{totalCount}</strong> first-run steps complete.</p>
      </div>
      <div className="beta-launch-actions">
        <button className="btn" type="button" onClick={onUseDevice}><HardDrive size={15} /> Use local model</button>
        <button className="btn secondary" type="button" onClick={onDownload}><Download size={15} /> Download model</button>
        <button className="btn secondary" type="button" onClick={onRefresh}><RefreshCw size={15} /> Recheck</button>
      </div>
      <div className="beta-launch-facts">
        <div><span>On this device</span><strong>{localCount}</strong></div>
        <div><span>Downloads</span><strong>{activeDownloads}</strong></div>
        <div><span>Running now</span><strong>{runningName ?? 'none'}</strong></div>
        <div><span>vLLM</span><strong>{vllmReady ? 'ready' : 'check setup'}</strong></div>
      </div>
    </div>
  );
}


type SetupDoctorAction = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

type SetupDoctorStep = {
  id: string;
  label: string;
  status: 'ok' | 'working' | 'attention' | 'optional';
  message: string;
  action?: SetupDoctorAction;
};

function setupStatusIcon(status: SetupDoctorStep['status']) {
  if (status === 'ok') return <CheckCircle2 size={17} />;
  if (status === 'working') return <RefreshCw size={17} />;
  if (status === 'optional') return <Info size={17} />;
  return <XCircle size={17} />;
}

function SetupDoctorCard({
  doctor,
  serverQa,
  localCount,
  activeDownloads,
  runningName,
  port,
  portInUse,
  portAvailable,
  onUseDevice,
  onDownload,
  onDownloadStarter,
  onRefresh,
  onAddModelFolder,
  onCopyInstall,
}: {
  doctor?: DoctorReport;
  serverQa?: ServerQaSummary;
  localCount: number;
  activeDownloads: number;
  runningName?: string | null;
  port: number;
  portInUse: boolean;
  portAvailable?: boolean;
  onUseDevice: () => void;
  onDownload: () => void;
  onDownloadStarter: () => void;
  onRefresh: () => void;
  onAddModelFolder: (path: string) => void;
  onCopyInstall: () => void;
}) {
  const vllmOk = Boolean(doctor?.vllm?.ok);
  const gpuOk = Boolean(doctor?.nvidia?.ok);
  const hfOk = Boolean(doctor?.hf_token?.ok);
  const hasModelSource = localCount > 0 || (serverQa?.completed_downloads ?? 0) > 0 || activeDownloads > 0;
  const externalPortBlocked = portAvailable === false;
  const portOk = Boolean(runningName) || (!portInUse && !externalPortBlocked);

  const steps: SetupDoctorStep[] = [
    {
      id: 'vllm',
      label: 'vLLM installed',
      status: vllmOk ? 'ok' : 'attention',
      message: doctor?.vllm?.message ?? 'Checking the vLLM command on this machine.',
      action: vllmOk ? undefined : { label: 'Copy install command', onClick: onCopyInstall },
    },
    {
      id: 'gpu',
      label: 'GPU visible',
      status: gpuOk ? 'ok' : 'attention',
      message: doctor?.nvidia?.message ?? 'Checking NVIDIA GPU visibility.',
      action: gpuOk ? undefined : { label: 'Recheck', onClick: onRefresh },
    },
    {
      id: 'models',
      label: 'Model source ready',
      status: hasModelSource ? (activeDownloads ? 'working' : 'ok') : 'attention',
      message: hasModelSource
        ? activeDownloads
          ? `${activeDownloads} download${activeDownloads === 1 ? '' : 's'} in progress. You can load after it finishes.`
          : `${localCount || serverQa?.completed_downloads || 0} model${(localCount || serverQa?.completed_downloads || 0) === 1 ? '' : 's'} ready or downloaded.`
        : 'No model found yet. Scan a folder or download a starter model.',
      action: hasModelSource ? { label: 'Use local model', onClick: onUseDevice } : { label: 'Add ./models', onClick: () => onAddModelFolder('./models') },
    },
    {
      id: 'hf',
      label: 'Hugging Face access',
      status: hfOk ? 'ok' : 'optional',
      message: doctor?.hf_token?.message ?? 'Optional. Public models work without a token; gated/private models need HF_TOKEN.',
      action: hfOk ? undefined : { label: 'Download starter', onClick: onDownloadStarter },
    },
    {
      id: 'port',
      label: `Port ${port}`,
      status: portOk ? 'ok' : 'attention',
      message: portOk ? 'Endpoint port looks available.' : `Port ${port} appears busy. Use a different port before loading a new model.`,
      action: portOk ? undefined : { label: 'Recheck', onClick: onRefresh },
    },
    {
      id: 'endpoint',
      label: 'Endpoint live',
      status: runningName ? 'ok' : 'optional',
      message: runningName ? `${runningName} is running. Copy the /v1 endpoint after a quick test.` : 'Load a model to create the OpenAI-compatible endpoint.',
      action: runningName ? undefined : { label: 'Choose/download model', onClick: onDownload },
    },
  ];

  const blockers = steps.filter((step) => step.status === 'attention').length;
  const okCount = steps.filter((step) => step.status === 'ok').length;
  const headline = blockers ? `${blockers} thing${blockers === 1 ? '' : 's'} need attention` : 'Your machine is ready to run models';
  const subline = blockers
    ? 'Fix the top items first. Details stay tucked away unless you need them.'
    : 'You can pick a model, load it, quick-test it, then copy the /v1 endpoint.';

  return (
    <div className={blockers ? 'card setup-doctor-card needs-attention' : 'card setup-doctor-card ready'}>
      <div className="setup-doctor-head">
        <div>
          <p className="label">Setup check</p>
          <h3>{headline}</h3>
          <p className="muted">{subline}</p>
        </div>
        <div className="setup-doctor-score">
          <strong>{okCount}/{steps.length}</strong>
          <span>ready</span>
        </div>
      </div>
      <div className="setup-doctor-grid">
        {steps.map((step) => (
          <div className={`setup-doctor-step ${step.status}`} key={step.id}>
            <div className="setup-step-icon">{setupStatusIcon(step.status)}</div>
            <div>
              <strong>{step.label}</strong>
              <p>{step.message}</p>
              {step.action && <button className="btn secondary compact-btn" disabled={step.action.disabled} type="button" onClick={step.action.onClick}>{step.action.label}</button>}
            </div>
          </div>
        ))}
      </div>
      {!hasModelSource && (
        <div className="starter-model-strip">
          <span>Starter picks:</span>
          <button type="button" className="tag-chip" onClick={onDownloadStarter}>Qwen3 0.6B fast smoke test</button>
          <button type="button" className="tag-chip" onClick={() => onAddModelFolder('~/.cache/huggingface/hub')}>Scan HF cache</button>
          <button type="button" className="tag-chip" onClick={() => onAddModelFolder('~/.lmstudio/models')}>Scan LM Studio</button>
          <button type="button" className="tag-chip" onClick={() => onAddModelFolder('~/Downloads')}>Scan Downloads</button>
          <button type="button" className="tag-chip" onClick={onDownload}>Browse Hugging Face</button>
        </div>
      )}
    </div>
  );
}

function DownloadStatus({ job }: { job?: DownloadJobRecord | null }) {
  if (!job) return null;
  const progress = downloadProgress(job);
  return (
    <div className={`download-status download-${job.status}`}>
      <div className="row-between">
        <strong>Download: {job.status}</strong>
        {progress != null && <span>{progress}%</span>}
      </div>
      <div className="progress-track"><div className="progress-bar" style={{ width: `${progress ?? 0}%` }} /></div>
      <p className="muted">{job.current_file || job.message || job.error || 'Queued via Hugging Face download manager.'}</p>
    </div>
  );
}

function FirstRunChecklist({ steps }: { steps: { label: string; done: boolean; help: string }[] }) {
  return (
    <div className="first-success-checklist">
      {steps.map((step, index) => (
        <div key={step.label} className={step.done ? 'success-step done' : 'success-step'}>
          <span>{step.done ? '✓' : index + 1}</span>
          <div>
            <strong>{step.label}</strong>
            <p>{step.help}</p>
          </div>
        </div>
      ))}
    </div>
  );
}


function QaChecklist({ checks }: { checks?: ServerQaCheck[] }) {
  if (!checks?.length) return <p className="muted">Run diagnostics to see install readiness.</p>;
  return (
    <div className="qa-checks">
      {checks.slice(0, 6).map((check, index) => (
        <div key={`${check.id}-${index}`} className={`qa-check qa-${check.status}`}>
          <div className="row-between">
            <strong>{check.title}</strong>
            <span className={`pill ${check.status}`}>{check.status}</span>
          </div>
          <p>{check.message}</p>
          {check.action && <p className="muted">Next: {check.action}</p>}
        </div>
      ))}
    </div>
  );
}

function ModelInspector({ model, instance, job, registered, running }: { model?: CatalogModelRecord | null; instance?: InstanceRecord | null; job?: DownloadJobRecord | null; registered: boolean; running: boolean }) {
  const payload = {
    model: instance?.config.model ?? model?.model_id ?? null,
    display_name: model?.display_name ?? instance?.name ?? null,
    format: 'Hugging Face / vLLM',
    size: model?.size_label ?? null,
    parameter_count_b: model?.parameter_count_b ?? null,
    dtype: instance?.config.dtype ?? model?.default_dtype ?? 'auto',
    max_model_len: instance?.config.max_model_len ?? model?.suggested_max_model_len ?? null,
    gpu_memory_utilization: instance?.config.gpu_memory_utilization ?? model?.suggested_gpu_memory_utilization ?? null,
    trust_remote_code: instance?.config.trust_remote_code ?? model?.trust_remote_code ?? false,
    gated: model?.gated ?? false,
    registered,
    running,
    download_status: job?.status ?? null,
    tags: model?.tags ?? [],
    source: model?.source ?? 'builtin',
    hf_downloads: model?.downloads ?? null,
    hf_likes: model?.likes ?? null,
    hf_pipeline_tag: model?.pipeline_tag ?? null,
    instance: instance ? { id: instance.id, name: instance.name, status: instance.status, host: instance.host, port: instance.port, pid: instance.pid ?? null } : null,
  };
  return <pre className="inspector-json">{JSON.stringify(payload, null, 2)}</pre>;
}

export function ServerPage({ onOpenLogs, onOpenMetrics, onOpenPlayground }: { onOpenLogs: (id: string) => void; onOpenMetrics: (id: string) => void; onOpenPlayground: (id: string) => void }) {
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [catalogSource, setCatalogSource] = useState<'builtin' | 'huggingface' | 'local'>(() => (localStorage.getItem('vcc.server.catalogSource') as 'builtin' | 'huggingface' | 'local' | null) ?? 'local');
  const [hfTokenEnv, setHfTokenEnv] = useState(() => localStorage.getItem('vcc.server.hfTokenEnv') ?? 'HF_TOKEN');
  const [hfMode, setHfMode] = useState(() => localStorage.getItem('vcc.server.hfMode') ?? 'trending');
  const [hfTask, setHfTask] = useState(() => localStorage.getItem('vcc.server.hfTask') ?? 'llm');
  const [hfAuthor, setHfAuthor] = useState(() => localStorage.getItem('vcc.server.hfAuthor') ?? '');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(() => localStorage.getItem('vcc.server.selectedCatalogId') ?? '');
  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => localStorage.getItem('vcc.server.selectedVariantId') ?? '');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>(() => localStorage.getItem('vcc.server.selectedInstanceId') ?? '');
  const [host, setHost] = useState(() => localStorage.getItem('vcc.server.host') ?? '127.0.0.1');
  const [port, setPort] = useState(() => Number(localStorage.getItem('vcc.server.port') ?? 8000));
  const [dtype, setDtype] = useState(() => localStorage.getItem('vcc.server.dtype') ?? 'auto');
  const [gpuMemory, setGpuMemory] = useState(() => Number(localStorage.getItem('vcc.server.gpuMemory') ?? 0.92));
  const [maxModelLen, setMaxModelLen] = useState(() => localStorage.getItem('vcc.server.maxModelLen') ?? '');
  const [servedModelName, setServedModelName] = useState(() => localStorage.getItem('vcc.server.servedModelName') ?? '');
  const [serverApiKey, setServerApiKey] = useState(() => localStorage.getItem('vcc.server.apiKey') ?? '');
  const [tensorParallelSize, setTensorParallelSize] = useState(() => localStorage.getItem('vcc.server.tensorParallelSize') ?? '');
  const [pipelineParallelSize, setPipelineParallelSize] = useState(() => localStorage.getItem('vcc.server.pipelineParallelSize') ?? '');
  const [kvCacheMemoryBytes, setKvCacheMemoryBytes] = useState(() => localStorage.getItem('vcc.server.kvCacheMemoryBytes') ?? '');
  const [trustRemoteCode, setTrustRemoteCode] = useState(() => localStorage.getItem('vcc.server.trustRemoteCode') === 'true');
  const [enableAutoToolChoice, setEnableAutoToolChoice] = useState(() => localStorage.getItem('vcc.server.enableAutoToolChoice') === 'true');
  const [toolCallParser, setToolCallParser] = useState(() => localStorage.getItem('vcc.server.toolCallParser') ?? '');
  const [reasoningParser, setReasoningParser] = useState(() => localStorage.getItem('vcc.server.reasoningParser') ?? '');
  const [extraArgsText, setExtraArgsText] = useState(() => localStorage.getItem('vcc.server.extraArgsText') ?? '');
  const [selectedLoadPreset, setSelectedLoadPreset] = useState<VllmPresetId>(() => (localStorage.getItem('vcc.server.loadPreset') as VllmPresetId | null) ?? 'balanced');
  const [showAdvancedLoadSettings, setShowAdvancedLoadSettings] = useState(() => localStorage.getItem('vcc.server.showAdvancedLoadSettings') === 'true');
  const [temperature, setTemperature] = useState(0.7);
  const [testPrompt, setTestPrompt] = useState('Say hello from vLLM in one short sentence.');
  const starterTestPrompts = [
    'Say hello from vLLM in one short sentence.',
    'Write a tiny Python function that adds two numbers.',
    'Explain what model you are running in one friendly sentence.',
  ];
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testLatency, setTestLatency] = useState<number | null>(null);
  const [testErrorMessage, setTestErrorMessage] = useState<string | null>(null);
  const [testNextActions, setTestNextActions] = useState<string[]>([]);
  const [testLastRunAt, setTestLastRunAt] = useState<string | null>(null);
  const [endpointCopied, setEndpointCopied] = useState(false);
  const [testedHandoffKey, setTestedHandoffKey] = useState('');
  const [testedModelName, setTestedModelName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [manualCopyText, setManualCopyText] = useState<string | null>(null);
  const [manualCopyLabel, setManualCopyLabel] = useState('Text');
  const [copyConfirmation, setCopyConfirmation] = useState<CopyConfirmation | null>(null);
  const manualCopyRef = useRef<HTMLTextAreaElement | null>(null);
  const [showAdvancedCockpit, setShowAdvancedCockpit] = useState(() => localStorage.getItem('vcc.server.showAdvancedCockpit') === 'true');
  const [newScanPath, setNewScanPath] = useState(() => localStorage.getItem('vcc.server.newScanPath') ?? '');

  const allHub = useQuery({ queryKey: ['model-hub-all'], queryFn: () => api.modelHubCatalog('', ''), refetchInterval: 10000 });
  const hub = useQuery({
    queryKey: ['model-hub', catalogSource, query, tag, hfTokenEnv, hfMode, hfTask, hfAuthor],
    queryFn: () => catalogSource === 'huggingface'
      ? api.hfCatalogSearch(query.trim(), 75, hfTokenEnv, hfMode, hfTask, hfAuthor)
      : api.modelHubCatalog(query, tag),
    refetchInterval: catalogSource === 'huggingface' ? false : 4000,
  });
  const instances = useQuery({ queryKey: ['instances'], queryFn: api.instances, refetchInterval: 2500 });
  const downloads = useQuery({ queryKey: ['downloads'], queryFn: api.downloads, refetchInterval: 3000 });
  const doctor = useQuery({ queryKey: ['doctor'], queryFn: api.doctor, refetchInterval: 30000 });
  const serverQa = useQuery({ queryKey: ['server-qa'], queryFn: api.serverQa, refetchInterval: 15000 });
  const localModels = useQuery({ queryKey: ['local-models-summary'], queryFn: api.localModels, refetchInterval: 10000 });
  const scanRoots = useQuery({ queryKey: ['local-model-scan-roots'], queryFn: api.localModelScanRoots, refetchInterval: 20000 });

  const localGroups = useMemo(() => localModels.data?.groups ?? [], [localModels.data]);
  const localCatalog = useMemo<CatalogModelRecord[]>(() => {
    const q = query.trim().toLowerCase();
    const matches = (model: LocalModelRecord) => {
      if (!q) return true;
      return model.model_id.toLowerCase().includes(q)
        || model.display_name.toLowerCase().includes(q)
        || (model.group_name ?? '').toLowerCase().includes(q)
        || (model.variant_label ?? '').toLowerCase().includes(q)
        || (model.local_path ?? '').toLowerCase().includes(q)
        || model.tags.some((item) => item.toLowerCase().includes(q));
    };
    const groupedRecords = localGroups.length ? localGroups.flatMap((group) => group.variants) : (localModels.data?.models ?? []);
    return groupedRecords
      .filter(matches)
      .map((model) => ({
        id: `local:${model.id}`,
        source: 'local',
        model_id: model.model_id,
        display_name: model.group_name && model.variant_label ? `${model.group_name} — ${model.variant_label}` : model.display_name || model.model_id.split('/').pop() || model.model_id,
        description: model.active_last_error
          ? `Last load failed: ${model.active_last_error}. Open logs/details for the exact path and vLLM output.`
          : model.local_path ? `On-device variant at ${model.local_path}` : 'On-device model detected by local scan.',
        tags: Array.from(new Set([
          ...(model.tags ?? []),
          'local',
          'on-device',
          ...(model.sibling_variant_count && model.sibling_variant_count > 1 ? ['variant'] : []),
          ...(model.active_status === 'crashed' ? ['needs-retry'] : []),
        ])),
        size_label: model.size_label ?? null,
        parameter_count_b: model.parameter_count_b ?? null,
        default_dtype: 'auto',
        suggested_max_model_len: model.context_length ?? null,
        suggested_gpu_memory_utilization: 0.92,
        gated: false,
        trust_remote_code: false,
        notes: model.notes ?? null,
      }));
  }, [localModels.data, localGroups, query]);
  const visibleCatalog = catalogSource === 'local' ? localCatalog : (hub.data?.catalog ?? []);

  const selectedCatalog = useMemo(() => visibleCatalog.find((item) => item.id === selectedCatalogId) ?? visibleCatalog[0] ?? null, [visibleCatalog, selectedCatalogId]);
  const variants = useQuery({
    queryKey: ['hf-variants', selectedCatalog?.model_id, hfTokenEnv],
    queryFn: () => api.hfCatalogVariants(selectedCatalog!.model_id, 'main', hfTokenEnv),
    enabled: catalogSource === 'huggingface' && Boolean(selectedCatalog?.model_id),
    staleTime: 5 * 60 * 1000,
  });
  const selectedVariant = useMemo(() => variants.data?.variants.find((item) => item.id === selectedVariantId) ?? variants.data?.variants.find((item) => item.recommended) ?? variants.data?.variants[0] ?? null, [variants.data, selectedVariantId]);
  const selectedLocalModel = useMemo(() => {
    if (!selectedCatalog) return null;
    const localId = selectedCatalog.id.startsWith('local:') ? selectedCatalog.id.slice('local:'.length) : '';
    const direct = (localModels.data?.models ?? []).find((model) => model.id === localId);
    if (direct) return direct;
    const grouped = localGroups.flatMap((group) => group.variants).find((model) => model.id === localId);
    if (grouped) return grouped;
    return (localModels.data?.models ?? []).find((model) => model.model_id === selectedCatalog.model_id) ?? null;
  }, [localModels.data, localGroups, selectedCatalog]);
  const selectedLocalGroup = useMemo(() => {
    if (!selectedLocalModel?.group_id) return null;
    return localGroups.find((group) => group.id === selectedLocalModel.group_id) ?? null;
  }, [localGroups, selectedLocalModel?.group_id]);
  const matchingInstances = useMemo(() => (instances.data ?? [])
    .filter((item) => instanceMatchesModel(item, selectedCatalog?.model_id, selectedLocalModel?.local_path))
    .sort((a, b) => statusRank(a.status) - statusRank(b.status)
      || Date.parse(b.updated_at) - Date.parse(a.updated_at)), [instances.data, selectedCatalog?.model_id, selectedLocalModel?.local_path]);
  const exactSelectedInstance = useMemo(() => instances.data?.find((item) => item.id === selectedInstanceId) ?? null, [instances.data, selectedInstanceId]);
  const exactMatchesSelectedModel = Boolean(exactSelectedInstance && instanceMatchesModel(exactSelectedInstance, selectedCatalog?.model_id, selectedLocalModel?.local_path));
  const sameModelInstance = matchingInstances[0] ?? null;
  const selectedInstance = exactMatchesSelectedModel ? exactSelectedInstance : sameModelInstance;
  const selectedHandoffKey = selectedInstance
    ? [selectedInstance.id, selectedInstance.status, selectedInstance.pid ?? 'no-pid', selectedInstance.started_at ?? 'not-started', selectedInstance.host, selectedInstance.port, modelNameForApi(selectedInstance)].join('|')
    : '';
  const selectedJob = useMemo(() => {
    const jobs = downloads.data?.filter((job) => job.model_id === selectedCatalog?.model_id) ?? [];
    const variantPath = selectedVariant?.path;
    const matchingVariant = variantPath ? jobs.find((job) => job.allow_patterns?.includes(variantPath)) : null;
    const active = jobs.find((job) => job.status === 'running' || job.status === 'queued');
    return matchingVariant ?? active ?? jobs[0] ?? null;
  }, [downloads.data, selectedCatalog?.model_id, selectedVariant?.path]);
  const selectedRegistered = Boolean(selectedCatalog && hub.data?.registered_model_ids.includes(selectedCatalog.model_id));
  const selectedRunning = Boolean(selectedCatalog && hub.data?.running_model_ids.includes(selectedCatalog.model_id));
  const tagOptions = useMemo(() => Array.from(new Set(((catalogSource === 'local' ? localCatalog : catalogSource === 'huggingface' ? hub.data?.catalog : allHub.data?.catalog) ?? []).flatMap((model) => model.tags))).sort(), [allHub.data, hub.data, catalogSource, localCatalog]);
  const portInUse = Boolean(instances.data?.some((item) => item.port === port && item.host === host && item.id !== selectedInstance?.id));
  const portProbe = useQuery({ queryKey: ['port-available', port], queryFn: () => api.portAvailable(port), enabled: Number.isFinite(port) && port > 0, refetchInterval: 15000 });
  const command = useQuery({ queryKey: ['server-command', selectedInstance?.id], queryFn: () => api.command(selectedInstance!.id), enabled: Boolean(selectedInstance?.id) });
  const metrics = useQuery({ queryKey: ['server-metrics', selectedInstance?.id], queryFn: () => api.metrics(selectedInstance!.id), enabled: Boolean(selectedInstance?.id && selectedInstance.status === 'running'), refetchInterval: 3000 });
  const recovery = useQuery({ queryKey: ['instance-recovery', selectedInstance?.id, selectedInstance?.status, selectedInstance?.last_error], queryFn: () => api.instanceRecovery(selectedInstance!.id), enabled: Boolean(selectedInstance?.id && (selectedInstance.status === 'crashed' || selectedInstance.last_error)), refetchInterval: selectedInstance?.status === 'crashed' ? 5000 : false });

  useEffect(() => {
    setEndpointCopied(false);
    setCopyConfirmation(null);
    setTestedHandoffKey('');
    setTestedModelName('');
    setTestOutput(null);
    setTestLatency(null);
    setTestErrorMessage(null);
    setTestLastRunAt(null);
  }, [selectedHandoffKey, selectedCatalog?.model_id]);

  useEffect(() => {
    setCopyConfirmation(null);
  }, [selectedLoadPreset, dtype, gpuMemory, maxModelLen, servedModelName, tensorParallelSize, pipelineParallelSize, kvCacheMemoryBytes, extraArgsText]);

  useEffect(() => {
    if (!selectedCatalogId && visibleCatalog[0]) setSelectedCatalogId(visibleCatalog[0].id);
  }, [visibleCatalog, selectedCatalogId]);

  useEffect(() => {
    if (selectedCatalogId) localStorage.setItem('vcc.server.selectedCatalogId', selectedCatalogId);
  }, [selectedCatalogId]);
  useEffect(() => {
    if (!exactMatchesSelectedModel && sameModelInstance?.id) {
      setSelectedInstanceId(sameModelInstance.id);
      localStorage.setItem('vcc.server.selectedInstanceId', sameModelInstance.id);
    }
  }, [exactMatchesSelectedModel, sameModelInstance?.id]);


  useEffect(() => {
    if (selectedVariantId) localStorage.setItem('vcc.server.selectedVariantId', selectedVariantId);
  }, [selectedVariantId]);

  useEffect(() => {
    setSelectedVariantId('');
    localStorage.removeItem('vcc.server.selectedVariantId');
  }, [selectedCatalog?.model_id]);

  useEffect(() => {
    localStorage.setItem('vcc.server.catalogSource', catalogSource);
    localStorage.setItem('vcc.server.hfTokenEnv', hfTokenEnv);
    localStorage.setItem('vcc.server.hfMode', hfMode);
    localStorage.setItem('vcc.server.hfTask', hfTask);
    localStorage.setItem('vcc.server.hfAuthor', hfAuthor);
  }, [catalogSource, hfTokenEnv, hfMode, hfTask, hfAuthor]);

  useEffect(() => {
    localStorage.setItem('vcc.server.loadPreset', selectedLoadPreset);
  }, [selectedLoadPreset]);

  useEffect(() => {
    localStorage.setItem('vcc.server.newScanPath', newScanPath);
  }, [newScanPath]);

  useEffect(() => {
    localStorage.setItem('vcc.server.host', host);
    localStorage.setItem('vcc.server.port', String(port));
    localStorage.setItem('vcc.server.dtype', dtype);
    localStorage.setItem('vcc.server.gpuMemory', String(gpuMemory));
    localStorage.setItem('vcc.server.maxModelLen', maxModelLen);
    localStorage.setItem('vcc.server.servedModelName', servedModelName);
    localStorage.setItem('vcc.server.apiKey', serverApiKey);
    localStorage.setItem('vcc.server.tensorParallelSize', tensorParallelSize);
    localStorage.setItem('vcc.server.pipelineParallelSize', pipelineParallelSize);
    localStorage.setItem('vcc.server.kvCacheMemoryBytes', kvCacheMemoryBytes);
    localStorage.setItem('vcc.server.trustRemoteCode', String(trustRemoteCode));
    localStorage.setItem('vcc.server.enableAutoToolChoice', String(enableAutoToolChoice));
    localStorage.setItem('vcc.server.toolCallParser', toolCallParser);
    localStorage.setItem('vcc.server.reasoningParser', reasoningParser);
    localStorage.setItem('vcc.server.extraArgsText', extraArgsText);
    localStorage.setItem('vcc.server.showAdvancedLoadSettings', String(showAdvancedLoadSettings));
    localStorage.setItem('vcc.server.showAdvancedCockpit', String(showAdvancedCockpit));
  }, [host, port, dtype, gpuMemory, maxModelLen, servedModelName, serverApiKey, tensorParallelSize, pipelineParallelSize, kvCacheMemoryBytes, trustRemoteCode, enableAutoToolChoice, toolCallParser, reasoningParser, extraArgsText, showAdvancedLoadSettings, showAdvancedCockpit]);

  useEffect(() => {
    if (selectedInstanceId && !instances.isLoading && instances.data && !instances.data.some((item) => item.id === selectedInstanceId)) {
      setSelectedInstanceId('');
      localStorage.removeItem('vcc.server.selectedInstanceId');
    }
  }, [instances.data, instances.isLoading, selectedInstanceId]);

  useEffect(() => {
    if (selectedInstanceId) localStorage.setItem('vcc.server.selectedInstanceId', selectedInstanceId);
  }, [selectedInstanceId]);


  function optionalNumber(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function parseExtraArgs(): string[] {
    return extraArgsText.split(/\s+/).map((item) => item.trim()).filter(Boolean);
  }

  function loadSettingsFor(catalog?: CatalogModelRecord | null) {
    const preset = resolveLoadPreset(selectedLoadPreset, catalog, selectedLocalModel);
    const usePreset = selectedLoadPreset !== 'custom';
    const occupiedPorts = new Set((instances.data ?? [])
      .filter((item) => item.host === host && item.id !== selectedInstance?.id)
      .map((item) => item.port));
    let resolvedPort = port;
    while (occupiedPorts.has(resolvedPort) && resolvedPort < 65535) resolvedPort += 1;
    return {
      host,
      port: resolvedPort,
      api_key: serverApiKey.trim() || null,
      served_model_name: servedModelName.trim() || null,
      dtype: usePreset ? preset.dtype : (dtype || catalog?.default_dtype || 'auto'),
      gpu_memory_utilization: usePreset ? preset.gpuMemory : (Number.isFinite(gpuMemory) ? gpuMemory : catalog?.suggested_gpu_memory_utilization ?? 0.92),
      max_model_len: usePreset ? preset.maxModelLen : (optionalNumber(maxModelLen) ?? catalog?.suggested_max_model_len ?? null),
      kv_cache_memory_bytes: kvCacheMemoryBytes.trim() || null,
      tensor_parallel_size: usePreset ? preset.tensorParallelSize : optionalNumber(tensorParallelSize),
      pipeline_parallel_size: optionalNumber(pipelineParallelSize),
      trust_remote_code: trustRemoteCode || Boolean(catalog?.trust_remote_code),
      enable_auto_tool_choice: enableAutoToolChoice,
      tool_call_parser: toolCallParser.trim() || null,
      reasoning_parser: reasoningParser.trim() || null,
      extra_args: [...(selectedVariant?.extra_args ?? []), ...(usePreset ? preset.extraArgs : []), ...parseExtraArgs()],
    };
  }

  const addScanRoot = useMutation({
    mutationFn: api.addLocalModelScanRoot,
    onSuccess: () => {
      setNewScanPath('');
      qc.invalidateQueries({ queryKey: ['local-models-summary'] });
      qc.invalidateQueries({ queryKey: ['local-model-scan-roots'] });
      qc.invalidateQueries({ queryKey: ['server-qa'] });
      qc.invalidateQueries({ queryKey: ['instance-recovery'] });
      setNotice('Model scan path added. Refreshing on-device models.');
    },
  });
  const removeScanRoot = useMutation({
    mutationFn: api.removeLocalModelScanRoot,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['local-models-summary'] });
      qc.invalidateQueries({ queryKey: ['local-model-scan-roots'] });
      qc.invalidateQueries({ queryKey: ['server-qa'] });
      setNotice('Model scan path removed.');
    },
  });

  const start = useMutation({ mutationFn: api.start, onSuccess: () => { qc.invalidateQueries({ queryKey: ['instances'] }); qc.invalidateQueries({ queryKey: ['instance-recovery'] }); } });
  const stop = useMutation({ mutationFn: api.stop, onSuccess: () => { qc.invalidateQueries({ queryKey: ['instances'] }); qc.invalidateQueries({ queryKey: ['instance-recovery'] }); } });
  const eject = useMutation({
    mutationFn: api.deleteInstance,
    onSuccess: () => {
      setSelectedInstanceId('');
      localStorage.removeItem('vcc.server.selectedInstanceId');
      qc.invalidateQueries({ queryKey: ['instances'] });
      setNotice('Instance ejected. The model files were not deleted.');
    },
  });
  const quickLaunch = useMutation({
    mutationFn: (payload: { catalog: CatalogModelRecord; start: boolean; forceNew?: boolean }) => {
      const settings = loadSettingsFor(payload.catalog);
      const body = {
        model_id: payload.catalog.model_id,
        display_name: payload.catalog.display_name,
        tags: payload.catalog.tags,
        name: modelSlug(payload.catalog.model_id),
        ...settings,
        start: payload.start,
        force_new: Boolean(payload.forceNew),
        reuse_existing: !payload.forceNew,
        variant_path: selectedVariant?.path ?? null,
        variant_format: selectedVariant?.format ?? null,
        quantization: selectedVariant?.quantization ?? null,
        allow_patterns: selectedVariant?.allow_patterns ?? [],
      };
      return payload.catalog.source === 'huggingface'
        ? api.quickLaunchHfModel(body)
        : api.quickLaunchCatalogModel(payload.catalog.id, body);
    },
    onSuccess: (result) => {
      setSelectedInstanceId(result.instance_id);
      const reused = result.reused_existing ? 'Reused existing instance.' : 'Created new instance.';
      setNotice(result.message ?? (result.start_requested ? `${reused} Warming up until /v1/models responds.` : reused));
      setPort((current) => Math.max(current + 1, (result.config.port ?? current) + 1));
      qc.invalidateQueries({ queryKey: ['instances'] });
      qc.invalidateQueries({ queryKey: ['model-hub'] });
      qc.invalidateQueries({ queryKey: ['model-hub-all'] });
      qc.invalidateQueries({ queryKey: ['local-models-summary'] });
      qc.invalidateQueries({ queryKey: ['server-qa'] });
      if (result.start_error) setError(`Instance created, but start failed: ${formatApiError(result.start_error)}`);
    },
  });
  const loadLocal = useMutation({
    mutationFn: (payload: { start: boolean; forceNew?: boolean; model?: LocalModelRecord | null }) => {
      const localModel = payload.model ?? selectedLocalModel;
      if (!localModel && !selectedCatalog) throw new Error('Choose a local or catalog model first.');
      const sourceModel = selectedCatalog ?? ({ model_id: localModel!.model_id, suggested_gpu_memory_utilization: 0.92, default_dtype: 'auto', trust_remote_code: false } as CatalogModelRecord);
      const settings = loadSettingsFor(sourceModel);
      return api.loadLocalModel({
        model_id: localModel?.model_id ?? sourceModel.model_id,
        local_path: localModel?.local_path ?? null,
        name: modelSlug(localModel?.model_id ?? sourceModel.model_id),
        ...settings,
        start: payload.start,
        force_new: Boolean(payload.forceNew),
        reuse_existing: !payload.forceNew,
      });
    },
    onSuccess: (result) => {
      setSelectedInstanceId(result.instance_id);
      setNotice(result.message ?? (result.loaded ? 'Local model load requested.' : 'Local model instance prepared.'));
      setPort((current) => Math.max(current + 1, (result.config.port ?? current) + 1));
      qc.invalidateQueries({ queryKey: ['instances'] });
      qc.invalidateQueries({ queryKey: ['local-models-summary'] });
      qc.invalidateQueries({ queryKey: ['model-hub'] });
      qc.invalidateQueries({ queryKey: ['model-hub-all'] });
      qc.invalidateQueries({ queryKey: ['server-qa'] });
      if (result.start_error) setError(`Instance prepared, but start failed: ${formatApiError(result.start_error)}`);
    },
  });
  const download = useMutation({
    mutationFn: (catalog: CatalogModelRecord) => catalog.source === 'huggingface'
      ? api.downloadHfModel({ model_id: catalog.model_id, display_name: catalog.display_name, tags: catalog.tags, dry_run: false, register_model: true, hf_token_env: hfTokenEnv, variant_path: selectedVariant?.path ?? null, variant_format: selectedVariant?.format ?? null, quantization: selectedVariant?.quantization ?? null, allow_patterns: selectedVariant?.allow_patterns ?? [] })
      : api.downloadCatalogModel(catalog.id, { dry_run: false, register_model: true, hf_token_env: hfTokenEnv }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['downloads'] });
      qc.invalidateQueries({ queryKey: ['model-hub'] });
      qc.invalidateQueries({ queryKey: ['model-hub-all'] });
      qc.invalidateQueries({ queryKey: ['local-models-summary'] });
      qc.invalidateQueries({ queryKey: ['server-qa'] });
      setNotice('Download queued. Progress will appear next to the selected model.');
    },
  });
  const starterDownload = useMutation({
    mutationFn: () => api.createDownload({ model_id: 'Qwen/Qwen3-0.6B', register_model: true, dry_run: false, hf_token_env: hfTokenEnv }),
    onSuccess: () => {
      setCatalogSource('huggingface');
      setQuery('Qwen/Qwen3-0.6B');
      qc.invalidateQueries({ queryKey: ['downloads'] });
      qc.invalidateQueries({ queryKey: ['model-hub'] });
      qc.invalidateQueries({ queryKey: ['local-models-summary'] });
      qc.invalidateQueries({ queryKey: ['server-qa'] });
      setNotice('Starter model download queued: Qwen/Qwen3-0.6B.');
    },
  });

  const inlineTest = useMutation({
    mutationFn: async (args?: { modelOverride?: string | null; skipAutoRetry?: boolean }) => {
      if (!selectedInstance) throw new Error('Select or start an instance first.');
      const modelOverride = args?.modelOverride?.trim() || null;
      const targetKey = selectedHandoffKey;
      const testedName = modelOverride || apiModelName;
      const result = await api.chat({ instance_id: selectedInstance.id, messages: [{ role: 'user', content: testPrompt }], temperature, max_tokens: 160, model_override: modelOverride });
      const suggestedName = result.suggested_model_name?.trim();
      const canAutoRetryServedName = !result.ok && !modelOverride && !args?.skipAutoRetry && suggestedName;
      if (canAutoRetryServedName) {
        const retryResult = await api.chat({ instance_id: selectedInstance.id, messages: [{ role: 'user', content: testPrompt }], temperature, max_tokens: 160, model_override: suggestedName });
        if (retryResult.ok) return { result: retryResult, targetKey, testedName: suggestedName, autoRetriedModelName: suggestedName };
        return { result: retryResult, targetKey, testedName, autoRetriedModelName: suggestedName, firstResult: result };
      }
      return { result, targetKey, testedName, autoRetriedModelName: null, firstResult: null };
    },
    onMutate: () => {
      setTestedHandoffKey('');
      setTestedModelName('');
      setTestOutput(null);
      setTestErrorMessage(null);
      setTestNextActions([]);
      setTestLastRunAt(null);
    },
    onSuccess: ({ result, targetKey, testedName, autoRetriedModelName }) => {
      setTestLatency(result.latency_ms ?? null);
      setTestLastRunAt(new Date().toLocaleTimeString());
      if (!result.ok) {
        const message = result.user_message || formatApiError(result.error || JSON.stringify(result.response ?? {}));
        setTestedHandoffKey('');
        setTestedModelName('');
        setTestOutput(null);
        setTestErrorMessage(message);
        setTestNextActions(result.next_actions ?? []);
        setError(message);
        return;
      }
      setTestedHandoffKey(targetKey);
      setTestedModelName(testedName);
      setTestErrorMessage(null);
      setTestNextActions([]);
      setTestOutput(extractAssistantText(result.response) || JSON.stringify(result.response, null, 2));
      if (autoRetriedModelName) setNotice(`Quick test auto-retried with served model name: ${autoRetriedModelName}`);
    },
    onError: (err) => {
      setTestedHandoffKey('');
      setTestedModelName('');
      setTestOutput(null);
      setTestLatency(null);
      setTestLastRunAt(new Date().toLocaleTimeString());
      setTestErrorMessage(formatApiError(err));
      setTestNextActions(['Check that the selected model is still running', 'Open logs', 'Try again']);
    },
  });

  const busyDownloadModels = new Set(downloads.data?.filter((job) => job.status === 'queued' || job.status === 'running').map((job) => job.model_id) ?? []);
  const endpoint = endpointFor(selectedInstance);
  const supportedEndpoints = [
    ['GET', '/v1/models'],
    ['POST', '/v1/chat/completions'],
    ['POST', '/v1/completions'],
    ['POST', '/v1/embeddings'],
  ];
  const running = selectedInstance?.status === 'running';
  const starting = selectedInstance?.status === 'starting';
  const crashedMessage = selectedInstance?.status === 'crashed' ? (recovery.data?.title || selectedInstance.last_error || 'Load failed. Open recovery help for details.') : null;
  const apiModelName = modelNameForApi(selectedInstance);
  const handoffModelName = testedHandoffKey === selectedHandoffKey && testedModelName ? testedModelName : apiModelName;
  const curlSnippet = selectedInstance ? buildCurlSnippet(endpoint, handoffModelName) : '';
  const jsSnippet = selectedInstance ? buildOpenAiJsSnippet(endpoint, handoffModelName) : '';
  const pythonSnippet = selectedInstance ? buildOpenAiPythonSnippet(endpoint, handoffModelName) : '';
  const handoffBundle = selectedInstance ? buildHandoffBundle(endpoint, handoffModelName) : '';
  const envHandoff = selectedInstance ? buildEnvHandoff(endpoint, handoffModelName) : '';
  const noInstances = !instances.isLoading && !instances.data?.length;
  const testPassed = Boolean(selectedHandoffKey && testedHandoffKey === selectedHandoffKey && running);
  const quickTestState = inlineTest.isPending ? 'running' : testPassed ? 'passed' : testErrorMessage ? 'failed' : 'idle';
  const quickTestTitle = quickTestState === 'running' ? 'Testing model...' : quickTestState === 'passed' ? 'Test passed' : quickTestState === 'failed' ? 'Test needs attention' : 'Ready to test';
  const quickTestHint = quickTestState === 'running'
    ? 'Sending one chat request to the local /v1 endpoint.'
    : quickTestState === 'passed'
      ? 'The model answered. Copy the /v1 base URL when you are ready.'
      : quickTestState === 'failed'
        ? 'The model is loaded, but the test request failed. Check the message below or open logs.'
        : running ? 'Send one simple prompt to confirm this exact model works.' : 'Load a model first, then test it here.';
  const quickTestSuggestedModel = inlineTest.data?.targetKey === selectedHandoffKey ? inlineTest.data.result.suggested_model_name : null;
  const quickTestServedNames = inlineTest.data?.targetKey === selectedHandoffKey ? (inlineTest.data.result.served_model_names ?? []) : [];
  const canCopyEndpoint = Boolean(running && selectedInstance && testPassed);
  const testedNameDiffers = Boolean(testPassed && testedModelName && testedModelName !== apiModelName);
  const handoffSummary = canCopyEndpoint ? 'Use this endpoint in your app' : 'Test this model to unlock copy';
  const testedNameSummary = testedNameDiffers
    ? `Quick test passed using served model name ${testedModelName}. Use that name in SDK calls.`
    : testPassed
      ? `Quick test passed using model name ${handoffModelName}.`
      : 'Testing will confirm the exact model name to use with this endpoint.';
  const endpointStatusLabel = canCopyEndpoint ? 'tested' : running ? 'untested' : starting ? 'warming' : 'wait';
  const endpointStatusClass = canCopyEndpoint ? 'endpoint-tested' : running ? 'endpoint-untested' : 'endpoint-wait';

  async function safeAct(fn: () => Promise<unknown>) {
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  function refreshServerState() {
    qc.invalidateQueries({ queryKey: ['doctor'] });
    qc.invalidateQueries({ queryKey: ['port-available', port] });
    qc.invalidateQueries({ queryKey: ['model-hub'] });
    qc.invalidateQueries({ queryKey: ['model-hub-all'] });
    qc.invalidateQueries({ queryKey: ['downloads'] });
    qc.invalidateQueries({ queryKey: ['instances'] });
    qc.invalidateQueries({ queryKey: ['local-models-summary'] });
    qc.invalidateQueries({ queryKey: ['local-model-scan-roots'] });
    qc.invalidateQueries({ queryKey: ['server-qa'] });
    qc.invalidateQueries({ queryKey: ['instance-recovery'] });
    if (selectedCatalog?.model_id) qc.invalidateQueries({ queryKey: ['hf-variants', selectedCatalog.model_id, hfTokenEnv] });
    setNotice('Server page state refreshed.');
  }


  function addSetupModelFolder(path: string) {
    setCatalogSource('local');
    setNewScanPath(path);
    safeAct(() => addScanRoot.mutateAsync(path));
  }

  function downloadStarterModel() {
    safeAct(() => starterDownload.mutateAsync());
  }

  function copyInstallCommand() {
    safeAct(async () => {
      const installCommand = 'python -m pip install vllm';
      await copyText(installCommand);
      setCopyConfirmation(buildCopyConfirmation(installCommand, 'Command'));
      setNotice('Copied: python -m pip install vllm');
    });
  }

  function useLowVramPreset() {
    setSelectedLoadPreset('low-vram');
    setShowAdvancedCockpit(true);
    setNotice('Switched to Low VRAM preset. Try loading again when ready.');
  }

  function loadSelectedModel(startServer = true) {
    if (!selectedCatalog && !selectedLocalModel) throw new Error('Choose a model first.');
    if (selectedLocalModel) return loadLocal.mutateAsync({ start: startServer });
    if (!selectedCatalog) throw new Error('Choose a model first.');
    return quickLaunch.mutateAsync({ catalog: selectedCatalog, start: startServer });
  }

  function selectManualCopyText() {
    manualCopyRef.current?.focus();
    manualCopyRef.current?.select();
    setNotice('Manual copy text selected. Press Ctrl+C / Cmd+C to copy.');
  }

  async function copyWithNotice(text: string, label = 'Text') {
    setError(null);
    const ok = await copyText(text);
    setEndpointCopied(ok && /endpoint|base url/i.test(label));
    if (ok) {
      setManualCopyText(null);
      setCopyConfirmation(buildCopyConfirmation(text, label));
      setNotice(`${copyConfirmationLabel(label)}.`);
    } else {
      setManualCopyLabel(label);
      setManualCopyText(text);
      setCopyConfirmation(null);
      setNotice('Copy failed. The text is shown below so you can select and copy it manually.');
    }
  }

  function selectedModelDetail(): ModelDetail | null {
    if (!selectedCatalog && !selectedLocalModel && !selectedInstance) return null;
    const settings = loadSettingsFor(selectedCatalog ?? undefined);
    return {
      id: selectedLocalModel?.id ?? selectedCatalog?.id ?? selectedInstance?.id ?? 'selected-model',
      modelId: selectedCatalog?.model_id ?? selectedLocalModel?.model_id ?? selectedInstance?.config.model ?? 'Unknown model',
      displayName: selectedCatalog?.display_name ?? selectedLocalModel?.display_name ?? selectedInstance?.name ?? 'Selected model',
      modelPath: selectedLocalModel?.local_path ?? selectedInstance?.config.model ?? null,
      format: selectedLocalModel?.format ?? (selectedCatalog ? 'Hugging Face / vLLM' : null),
      quantization: selectedLocalModel?.quantization ?? selectedVariant?.quantization ?? null,
      sizeLabel: selectedLocalModel?.size_label ?? selectedCatalog?.size_label ?? null,
      architecture: selectedLocalModel?.architecture ?? null,
      contextLength: selectedLocalModel?.context_length ?? selectedCatalog?.suggested_max_model_len ?? null,
      parameterCountB: selectedLocalModel?.parameter_count_b ?? selectedCatalog?.parameter_count_b ?? null,
      fileCount: selectedLocalModel?.file_count ?? null,
      weightFileCount: selectedLocalModel?.weight_file_count ?? null,
      isMultiFile: selectedLocalModel?.is_multi_file ?? false,
      configPresent: selectedLocalModel?.config_present ?? false,
      tokenizerPresent: selectedLocalModel?.tokenizer_present ?? null,
      dtypeHint: selectedLocalModel?.dtype_hint ?? null,
      compatibilityStatus: selectedLocalModel?.compatibility_status ?? null,
      compatibilityLabel: selectedLocalModel?.compatibility_label ?? null,
      compatibilityReasons: selectedLocalModel?.compatibility_reasons ?? [],
      suggestedLoadFormat: selectedLocalModel?.suggested_load_format ?? null,
      source: selectedLocalModel ? 'This device' : selectedCatalog?.source ?? 'instance',
      loadedStatus: selectedInstance?.status ?? (running ? 'running' : 'not loaded'),
      downloadStatus: selectedJob?.status ?? null,
      download: selectedJob,
      instance: selectedInstance,
      tags: selectedLocalModel?.tags ?? selectedCatalog?.tags ?? [],
      notes: selectedLocalModel?.notes ?? selectedCatalog?.notes ?? null,
      metadataWarnings: [
        ...(selectedLocalModel?.metadata_warnings ?? []),
        ...(selectedLocalModel?.active_last_error ? [`Last load failed: ${selectedLocalModel.active_last_error}`] : []),
      ],
      recommended: {
        presetName: resolveLoadPreset(selectedLoadPreset, selectedCatalog, selectedLocalModel).name,
        presetDescription: resolveLoadPreset(selectedLoadPreset, selectedCatalog, selectedLocalModel).description,
        dtype: settings.dtype,
        gpuMemoryUtilization: settings.gpu_memory_utilization,
        maxModelLen: settings.max_model_len,
        tensorParallelSize: settings.tensor_parallel_size,
        trustRemoteCode: settings.trust_remote_code,
        extraArgs: settings.extra_args,
      },
    };
  }

  const allLocalModelRecords = useMemo(() => (localGroups.length ? localGroups.flatMap((group) => group.variants) : (localModels.data?.models ?? [])), [localGroups, localModels.data]);
  const recommendedLocalModel = useMemo(() => {
    const candidates = allLocalModelRecords.filter((model) => model.local_path || model.download_status === 'completed' || model.active_status === 'running');
    if (!candidates.length) return null;
    return [...candidates].sort((a, b) => {
      const score = (model: LocalModelRecord) => (model.active_status === 'running' ? 1000 : 0)
        + (model.local_path ? 120 : 0)
        + (model.compatibility_status === 'ready' ? 35 : model.compatibility_status === 'likely' ? 20 : 0)
        + (model.quantization ? 20 : 0)
        + (model.variant_rank != null ? Math.max(0, 40 - model.variant_rank) : 0)
        - (model.active_status === 'crashed' ? 120 : 0)
        - ((model.metadata_warnings?.length ?? 0) * 8);
      return score(b) - score(a);
    })[0];
  }, [allLocalModelRecords]);
  const runningInstance = useMemo(() => instances.data?.find((item) => item.status === 'running') ?? null, [instances.data]);
  const selectedReadiness = (() => {
    if (running) return { label: 'Running', className: 'running', help: 'Ready to test or copy the endpoint.' };
    if (starting) return { label: 'Warming up', className: 'running', help: 'vLLM started. Waiting for /v1/models before showing the endpoint as ready.' };
    if (crashedMessage) return { label: 'Load failed', className: 'failed', help: crashedMessage };
    if (selectedLocalModel?.active_status === 'crashed') return { label: 'Retryable failure', className: 'failed', help: selectedLocalModel.active_last_error || 'The last load failed. Use Low VRAM, retry, or open logs.' };
    if (selectedLocalModel) return { label: 'Ready', className: 'completed', help: 'This model is already on this device.' };
    if (selectedJob?.status === 'completed') return { label: 'Downloaded', className: 'completed', help: 'Downloaded and ready to load.' };
    if (selectedJob?.status === 'running' || selectedJob?.status === 'queued') return { label: 'Downloading', className: 'running', help: 'Wait for the download to complete, then load.' };
    if (selectedCatalog?.gated) return { label: 'Needs HF access', className: 'warning-pill', help: 'Set your HF token and accept model terms first.' };
    if (selectedCatalog) return { label: 'Needs download', className: '', help: 'Download to this device, or let vLLM pull by model ID.' };
    return { label: 'Choose model', className: '', help: 'Pick a local model or search Hugging Face.' };
  })();
  const modelPickerSize = catalogSource === 'huggingface'
    ? Math.min(14, Math.max(8, visibleCatalog.length))
    : catalogSource === 'local'
      ? Math.min(10, Math.max(6, visibleCatalog.length))
      : Math.min(8, Math.max(4, visibleCatalog.length));
  const hiddenCatalogCount = hub.data?.catalog?.length && visibleCatalog.length >= 75 ? 'Search more specifically to narrow Hugging Face results.' : '';


  function selectLocalModel(model: LocalModelRecord) {
    setCatalogSource('local');
    setSelectedCatalogId(`local:${model.id}`);
    setSelectedInstanceId(model.active_instance_id ?? '');
    setNotice(`Selected ${model.group_name ?? model.display_name}.`);
  }

  function chooseThisDevice() {
    setCatalogSource('local');
    setQuery('');
    setTag('');
    if (recommendedLocalModel) {
      selectLocalModel(recommendedLocalModel);
    } else {
      setSelectedCatalogId('');
      setNotice('Showing models on this device. Add a scan path if the list is empty.');
    }
  }

  function chooseHuggingFace() {
    setCatalogSource('huggingface');
    setSelectedCatalogId('');
    setTag('');
    setHfMode((current) => current || 'trending');
    setNotice('Showing fresh Hugging Face models. Pick one, choose a variant if available, then download.');
  }

  function continueRunningModel() {
    if (!runningInstance) return;
    setSelectedInstanceId(runningInstance.id);
    setNotice(`Selected running server: ${runningInstance.name}.`);
  }

  const activeLoadPreset = selectedLoadPreset === 'custom'
    ? {
      ...resolveLoadPreset('custom', selectedCatalog, selectedLocalModel),
      dtype: dtype || selectedCatalog?.default_dtype || 'auto',
      gpuMemory: Number.isFinite(gpuMemory) ? gpuMemory : selectedCatalog?.suggested_gpu_memory_utilization ?? 0.92,
      maxModelLen: optionalNumber(maxModelLen) ?? selectedCatalog?.suggested_max_model_len ?? selectedLocalModel?.context_length ?? null,
      tensorParallelSize: optionalNumber(tensorParallelSize),
      extraArgs: parseExtraArgs(),
    }
    : resolveLoadPreset(selectedLoadPreset, selectedCatalog, selectedLocalModel);
  const presetExtraArgLabel = activeLoadPreset.extraArgs.length ? activeLoadPreset.extraArgs.join(' ') : 'none';
  const usingCustomSettings = selectedLoadPreset === 'custom';

  const firstRunSteps = [
    { label: 'Model selected', done: Boolean(selectedCatalog), help: selectedCatalog ? selectedCatalog.display_name : 'Pick a model from This device, Built-in, or Hugging Face.' },
    { label: 'Available to load', done: Boolean(selectedLocalModel || selectedJob?.status === 'completed' || selectedCatalog?.source === 'builtin'), help: selectedLocalModel ? 'Local copy found on this device.' : selectedJob?.status === 'completed' ? 'Download completed.' : selectedCatalog?.source === 'builtin' ? 'vLLM can pull this by model ID if HF access is ready.' : 'Download the selected model or choose an existing local model.' },
    { label: 'Model started', done: running, help: running ? 'Ready for local API calls.' : starting ? 'vLLM is warming up. Logs stay available while /v1/models becomes ready.' : 'Click Start and wait for the model to become running.' },
    { label: 'Test passed', done: testPassed, help: testPassed ? 'This exact server run responded to the inline test.' : 'Test the selected server run after it is loaded.' },
    { label: 'Base URL copied', done: endpointCopied, help: endpointCopied ? 'Ready to paste into OpenAI-compatible clients.' : 'Copy the /v1 base URL for Open WebUI, agents, or SDKs.' },
  ];
  const betaDoneCount = firstRunSteps.filter((step) => step.done).length;
  const activeDownloadCount = (downloads.data ?? []).filter((job) => job.status === 'queued' || job.status === 'running').length;
  const localModelCount = localModels.data?.models.length ?? 0;
  const vllmReady = Boolean(doctor.data?.vllm?.ok);
  const gpuReady = Boolean(doctor.data?.nvidia?.ok);
  const hasModelSource = localModelCount > 0 || (serverQa.data?.completed_downloads ?? 0) > 0 || activeDownloadCount > 0;
  const endpointPortReady = Boolean(runningInstance) || (!portInUse && portProbe.data?.available !== false);
  const setupAttentionCount = [!vllmReady, !gpuReady, !hasModelSource, !endpointPortReady].filter(Boolean).length;
  const showFirstLaunchWelcome = noInstances && !selectedCatalog && !running;
  const firstLaunchPrimary = localModelCount > 0 ? 'Choose a detected model' : activeDownloadCount > 0 ? 'Wait for download' : 'Add a model';
  const primaryActionLabel = running ? 'Already running' : starting ? 'Warming up' : crashedMessage ? 'Retry start' : selectedLocalModel ? 'Start model' : selectedCatalog ? 'Start model' : 'Choose a model';

  return (
    <div className="server-page">
      <div className="server-topbar card">
        <div>
          <p className="label">Run Model</p>
          <h2>Load one model</h2>
          <p className="muted">Choose a model, start it, test it, then copy the OpenAI base URL.</p>
        </div>
        <div className="server-top-actions">
          {selectedInstance && (
            <div className="server-current-instance" title={selectedInstance.config.model}>
              <strong>{selectedInstance.name}</strong>
              <span>{shortModelId(selectedInstance.config.model, 54)}</span>
              <small>
                {selectedInstance.host}:{selectedInstance.port}
                {' · '}{selectedInstance.pid ? `PID ${selectedInstance.pid}` : 'no live PID'}
              </small>
            </div>
          )}
          <button className="btn secondary" onClick={refreshServerState}><RefreshCw size={15} /> Refresh</button>
          <span className={statusClass(selectedInstance?.status)}>{selectedInstance?.status ?? 'no instance'}</span>
          {crashedMessage && <span className="crash-reason-inline" title={crashedMessage}>Failed: {shortModelId(crashedMessage, 72)}</span>}
          {selectedInstance?.status === 'running' || selectedInstance?.status === 'starting' ? (
            <button className="btn danger" disabled={stop.isPending} onClick={() => safeAct(() => stop.mutateAsync(selectedInstance.id))}><Square size={15} /> {stop.isPending ? 'Stopping...' : selectedInstance.status === 'starting' ? 'Cancel Load' : 'Unload Model'}</button>
          ) : selectedInstance?.status === 'stopping' ? (
            <button className="btn danger" disabled><Square size={15} /> Stopping...</button>
          ) : selectedInstance ? (
            <button className="btn" disabled={start.isPending} onClick={() => safeAct(() => start.mutateAsync(selectedInstance.id))}><Play size={15} /> {start.isPending ? 'Starting...' : 'Start'}</button>
          ) : selectedCatalog ? (
            <button className="btn" disabled={quickLaunch.isPending || loadLocal.isPending} onClick={() => safeAct(() => loadSelectedModel(true))}><Play size={15} /> {quickLaunch.isPending || loadLocal.isPending ? 'Starting...' : 'Start'}</button>
          ) : null}
          {selectedInstance && (selectedInstance.status === 'crashed' || selectedInstance.status === 'stopped') && (
            <button className="btn secondary" disabled={eject.isPending} onClick={() => safeAct(() => eject.mutateAsync(selectedInstance.id))}>
              <Trash2 size={15} /> {eject.isPending ? 'Clearing...' : selectedInstance.status === 'crashed' ? 'Clear failed attempt' : 'Eject instance'}
            </button>
          )}
        </div>
      </div>

      {showFirstLaunchWelcome && (
        <div className="first-launch-card">
          <div className="first-launch-icon"><Zap size={20} /></div>
          <div className="first-launch-copy">
            <p className="label">First launch</p>
            <h3>{firstLaunchPrimary}</h3>
            <p className="muted">Start with one model. After it loads, this page becomes your endpoint control panel.</p>
            <div className="first-launch-actions">
              <button className="btn" type="button" onClick={localModelCount > 0 ? chooseThisDevice : downloadStarterModel}>
                {localModelCount > 0 ? <HardDrive size={15} /> : <Download size={15} />}
                {localModelCount > 0 ? 'Use a local model' : 'Download starter model'}
              </button>
              <button className="btn secondary" type="button" onClick={chooseHuggingFace}><Download size={15} /> Browse Hugging Face</button>
              <button className="btn secondary" type="button" onClick={refreshServerState}><RefreshCw size={15} /> Recheck</button>
            </div>
          </div>
          <div className="first-launch-status">
            <span className={localModelCount ? 'pill good' : 'pill'}>{localModelCount ? `${localModelCount} local model${localModelCount === 1 ? '' : 's'}` : 'No local models yet'}</span>
            <span className={vllmReady ? 'pill good' : 'pill warning'}>{vllmReady ? 'vLLM ready' : 'vLLM needs setup'}</span>
            <span className={gpuReady ? 'pill good' : 'pill warning'}>{gpuReady ? 'GPU visible' : 'GPU not confirmed'}</span>
          </div>
        </div>
      )}
      {doctor.data?.vllm && !doctor.data.vllm.ok && !showFirstLaunchWelcome && <div className="inline-warning"><AlertTriangle size={16} /> {doctor.data.vllm.message} Start will fail until the controller environment has vLLM installed.</div>}
      {error && <pre className="error">{error}</pre>}
      {notice && <div className="notice">{notice}</div>}
      {copyConfirmation && (
        <div className="copy-confirmation-card" role="status" aria-live="polite">
          <CheckCircle2 size={17} />
          <div className="copy-confirmation-copy">
            <strong>{copyConfirmation.label}</strong>
            <code title={copyConfirmation.preview}>{copyConfirmation.preview}</code>
            <p className="muted tiny">{copyConfirmation.charCount.toLocaleString()} characters copied for this selected run.</p>
          </div>
          <button className="tag-chip mini" type="button" onClick={() => setCopyConfirmation(null)}>Hide</button>
        </div>
      )}
      {manualCopyText && (
        <div className="manual-copy-card">
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
      <ErrorRecoveryCard
        advice={recovery.data}
        loading={recovery.isFetching && !recovery.data}
        title="Recovery helper"
        onOpenLogs={selectedInstance ? () => onOpenLogs(selectedInstance.id) : undefined}
        onRefresh={refreshServerState}
        onRetry={selectedInstance ? () => safeAct(() => start.mutateAsync(selectedInstance.id)) : undefined}
        onOpenSettings={() => setShowAdvancedCockpit(true)}
        onUseLowVram={useLowVramPreset}
        onCopy={copyWithNotice}
      />

      {!showFirstLaunchWelcome && setupAttentionCount > 0 && (
        <details className="run-helper-details needs-attention" open={!running}>
          <summary>
            <span>{`${setupAttentionCount} setup item${setupAttentionCount === 1 ? '' : 's'} need attention`}</span>
            <small>Open checks and fixes</small>
          </summary>
          <SetupDoctorCard
            doctor={doctor.data}
            serverQa={serverQa.data}
            localCount={localModelCount}
            activeDownloads={activeDownloadCount}
            runningName={runningInstance?.name ?? null}
            port={port}
            portInUse={portInUse}
            portAvailable={portProbe.data?.available}
            onUseDevice={chooseThisDevice}
            onDownload={chooseHuggingFace}
            onDownloadStarter={downloadStarterModel}
            onRefresh={refreshServerState}
            onAddModelFolder={addSetupModelFolder}
            onCopyInstall={copyInstallCommand}
          />
        </details>
      )}

      <div className="card simple-run-card">
        <section className="simple-run-main">
          <div className="simple-run-head">
            <div>
              <p className="label">Run flow</p>
              <h2>{running ? 'Model is running' : 'Run one model'}</h2>
              <p className="muted">Pick model → Start → Test → Copy base URL.</p>
            </div>
            <span className={`pill ${selectedReadiness.className}`}>{selectedReadiness.label}</span>
          </div>

          <div className="simple-status-grid">
            <div><span>Selected model</span><strong title={selectedLocalModel?.group_name ?? selectedCatalog?.display_name ?? selectedInstance?.name ?? 'None selected'}>{simpleModelName(selectedLocalModel?.group_name ?? selectedCatalog?.display_name ?? selectedInstance?.name)}</strong></div>
            <div><span>Source</span><strong>{selectedLocalModel ? 'This device' : selectedCatalog?.source === 'huggingface' ? 'Hugging Face' : selectedCatalog?.source ?? '—'}</strong></div>
              <div><span>{crashedMessage ? 'Last failure' : starting ? 'Endpoint check' : 'Endpoint'}</span>{crashedMessage ? <strong className="failure-summary-text" title={crashedMessage}>{shortModelId(crashedMessage, 64)}</strong> : <code>{running ? endpoint : starting ? 'Waiting for /v1/models' : 'Load a model first'}</code>}</div>
          </div>

          {running && selectedInstance ? (
            <div className="simple-live-panel">
              <div>
                <strong>{selectedInstance.name}</strong>
                <code className="endpoint-code compact">{endpoint}</code>
                <p className="muted tiny">Paste this as the OpenAI base URL after the test passes.</p>
                <div className={testPassed ? 'tested-model-strip ready' : 'tested-model-strip'}>
                  <span>{testPassed ? 'Tested model name' : 'Model name will be confirmed by test'}</span>
                  <code title={handoffModelName}>{handoffModelName}</code>
                  <button className="tag-chip mini" type="button" onClick={() => copyWithNotice(handoffModelName, 'Model name')} disabled={!testPassed}>Copy model</button>
                  <button className="tag-chip mini" type="button" onClick={() => copyWithNotice(handoffBundle, 'Endpoint handoff')} disabled={!canCopyEndpoint}>Copy handoff</button>
                  <button className="tag-chip mini" type="button" onClick={() => copyWithNotice(envHandoff, 'safe .env handoff')} disabled={!canCopyEndpoint}>Copy safe .env</button>
                </div>
              </div>
              <div className="easy-test-panel">
                <div className="easy-test-head">
                  <div>
                    <span className="label">Test this model</span>
                    <strong>Ask one quick question</strong>
                    <p className="muted tiny">No Playground hunting. This sends one chat request to the loaded model above.</p>
                  </div>
                  <span className={`pill ${quickTestState === 'passed' ? 'completed' : quickTestState === 'failed' ? 'warning-pill' : ''}`}>{quickTestState === 'passed' ? 'works' : quickTestState === 'failed' ? 'needs fix' : 'ready'}</span>
                </div>
                <textarea
                  className="input area easy-test-area"
                  value={testPrompt}
                  onChange={(event) => setTestPrompt(event.target.value)}
                  placeholder="Ask the loaded model something simple..."
                />
                <div className="easy-prompt-chips">
                  {starterTestPrompts.map((item) => (
                    <button className={testPrompt === item ? 'tag-chip mini active' : 'tag-chip mini'} type="button" key={item} onClick={() => setTestPrompt(item)}>{item}</button>
                  ))}
                </div>
                <div className="simple-action-row">
                  <button className="btn" onClick={() => safeAct(() => inlineTest.mutateAsync({}))} disabled={inlineTest.isPending || !testPrompt.trim()}><TerminalSquare size={15} /> {inlineTest.isPending ? 'Testing...' : 'Test this model'}</button>
                  <button className="btn secondary" onClick={() => copyWithNotice(endpoint, 'Base URL')} disabled={!canCopyEndpoint}><Copy size={15} /> {canCopyEndpoint ? 'Copy /v1 base URL' : 'Test first to copy'}</button>
                  <button className="btn secondary" onClick={() => onOpenLogs(selectedInstance.id)}><Clipboard size={15} /> Logs</button>
                  <button className="btn danger" onClick={() => safeAct(() => stop.mutateAsync(selectedInstance.id))} disabled={stop.isPending}><Square size={15} /> {stop.isPending ? 'Unloading...' : 'Unload'}</button>
                </div>
              </div>
              <div className={`quick-test-result easy-test-result ${quickTestState}`}>
                <div className="quick-test-result-head">
                  <span className="quick-test-icon">{quickTestState === 'passed' ? <CheckCircle2 size={16} /> : quickTestState === 'failed' ? <XCircle size={16} /> : <Zap size={16} />}</span>
                  <div>
                    <strong>{quickTestTitle}</strong>
                    <p>{quickTestHint}</p>
                  </div>
                  {testLatency != null && <span className="pill soft">{testLatency} ms</span>}
                </div>
                {testOutput && <div className="chat-like-response"><span>Model replied</span><p>{testOutput}</p></div>}
                {testErrorMessage && <div className="inline-warning">{testErrorMessage}</div>}
                {quickTestSuggestedModel && (
                  <div className="served-model-hint">
                    <span>vLLM reports served model</span>
                    <button className="tag-chip mini active" type="button" title={quickTestSuggestedModel} onClick={() => copyWithNotice(quickTestSuggestedModel, 'Served model name')}>{quickTestSuggestedModel}</button>
                    <button className="tag-chip mini" type="button" onClick={() => safeAct(() => inlineTest.mutateAsync({ modelOverride: quickTestSuggestedModel }))}>Test with this name</button>
                    {quickTestServedNames.length > 1 && <small>{quickTestServedNames.length} served names found.</small>}
                  </div>
                )}
                {testNextActions.length > 0 && (
                  <div className="quick-test-next-actions">
                    <span>Try next:</span>
                    {testNextActions.slice(0, 3).map((action) => <em key={action}>{action}</em>)}
                  </div>
                )}
                {testLastRunAt && <p className="muted tiny">Last test: {testLastRunAt}{testPassed && testedNameDiffers ? ` · auto-tested served name ${testedModelName}` : ''}</p>}
                {testPassed && <p className="muted tiny">{testedNameSummary}</p>}
              </div>
              <details className="developer-handoff compact">
                <summary>{handoffSummary}</summary>
                <div className="handoff-grid">
                  <button className="handoff-copy-card" type="button" onClick={() => copyWithNotice(endpoint, 'Base URL')} disabled={!canCopyEndpoint}>
                    <span>{canCopyEndpoint ? 'OpenAI base URL' : 'Test required'}</span><code title={endpoint}>{endpoint}</code>
                  </button>
                  <button className="handoff-copy-card" type="button" onClick={() => copyWithNotice(handoffModelName, 'Model name')} disabled={!canCopyEndpoint}>
                    <span>{canCopyEndpoint ? 'Model name' : 'Test required'}</span><code title={handoffModelName}>{handoffModelName}</code>
                  </button>
                </div>
                <div className="snippet-tabs">
                  <button className="btn secondary" type="button" onClick={() => copyWithNotice(curlSnippet, 'curl example')} disabled={!canCopyEndpoint}><Copy size={14} /> Copy curl</button>
                  <button className="btn secondary" type="button" onClick={() => copyWithNotice(jsSnippet, 'JavaScript SDK example')} disabled={!canCopyEndpoint}><Copy size={14} /> Copy JS</button>
                  <button className="btn secondary" type="button" onClick={() => copyWithNotice(pythonSnippet, 'Python SDK example')} disabled={!canCopyEndpoint}><Copy size={14} /> Copy Python</button>
                  <button className="btn secondary" type="button" onClick={() => copyWithNotice(handoffBundle, 'Endpoint handoff')} disabled={!canCopyEndpoint}><Copy size={14} /> Copy handoff</button>
                  <button className="btn secondary" type="button" onClick={() => copyWithNotice(envHandoff, 'safe .env handoff')} disabled={!canCopyEndpoint}><Copy size={14} /> Copy safe .env</button>
                </div>
                <pre className="handoff-snippet">{curlSnippet}</pre>
              </details>
            </div>
          ) : (
            <div className="simple-action-row primary-actions">
              <button className="btn" disabled={starting || (!selectedCatalog && !(crashedMessage && selectedInstance)) || quickLaunch.isPending || loadLocal.isPending || start.isPending} onClick={() => safeAct(() => crashedMessage && selectedInstance ? start.mutateAsync(selectedInstance.id) : loadSelectedModel(true))}><Play size={15} /> {quickLaunch.isPending || loadLocal.isPending || start.isPending ? 'Starting...' : primaryActionLabel}</button>
              {starting && selectedInstance && <button className="btn secondary" type="button" onClick={() => onOpenLogs(selectedInstance.id)}><Clipboard size={15} /> Logs</button>}
              {!selectedLocalModel && selectedCatalog && <button className="btn secondary" disabled={download.isPending || Boolean(selectedCatalog && busyDownloadModels.has(selectedCatalog.model_id))} onClick={() => safeAct(() => download.mutateAsync(selectedCatalog))}><Download size={15} /> {selectedJob?.status === 'completed' ? 'Download again' : 'Download'}</button>}
              {crashedMessage && selectedInstance && <button className="btn secondary" type="button" onClick={() => onOpenLogs(selectedInstance.id)}><Clipboard size={15} /> Logs</button>}
              {crashedMessage && <button className="btn secondary" type="button" onClick={useLowVramPreset}><Gauge size={15} /> Low VRAM</button>}
              <button className="btn secondary" type="button" onClick={chooseThisDevice}><HardDrive size={15} /> This device</button>
              <button className="btn secondary" type="button" onClick={chooseHuggingFace}><Download size={15} /> Hugging Face</button>
            </div>
          )}

          <div className="simple-model-picker">
            <div className="guided-toggle">
              <button className={catalogSource === 'local' ? 'tag-chip active' : 'tag-chip'} onClick={chooseThisDevice}>This device</button>
              <button className={catalogSource === 'huggingface' ? 'tag-chip active' : 'tag-chip'} onClick={chooseHuggingFace}>Hugging Face</button>
              <button className={catalogSource === 'builtin' ? 'tag-chip active' : 'tag-chip'} onClick={() => { setCatalogSource('builtin'); setSelectedCatalogId(''); }}>Built-in</button>
            </div>
            <div className="simple-picker-row">
              <select className="input guided-model-select model-pick-list" size={modelPickerSize} value={selectedCatalog?.id ?? ''} onChange={(event) => { setSelectedCatalogId(event.target.value); setSelectedInstanceId(''); }} disabled={!visibleCatalog.length}>
                {catalogSource === 'local' && localGroups.length ? localGroups.map((group) => (
                  <optgroup key={group.id} label={`${group.display_name} · ${group.variants.length} variant${group.variants.length === 1 ? '' : 's'}${group.loaded_instance_count ? ' · loaded' : ''}`}>
                    {group.variants
                      .filter((variant) => visibleCatalog.some((model) => model.id === `local:${variant.id}`))
                      .map((variant) => <option key={variant.id} value={`local:${variant.id}`}>{localOptionLabel(variant)}</option>)}
                  </optgroup>
                )) : visibleCatalog.map((model) => <option key={model.id} value={model.id}>{simpleModelName(model.display_name)} — {shortModelId(model.model_id, 42)}</option>)}
              </select>
              {catalogSource === 'huggingface' && <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Hugging Face, e.g. Qwen/Qwen3" />}
            </div>
            <div className="picker-result-help">
              <span>{visibleCatalog.length ? `${visibleCatalog.length} models shown. Scroll the list, or type to filter.` : 'No models shown yet.'}</span>
              {hiddenCatalogCount && <span>{hiddenCatalogCount}</span>}
            </div>

            {selectedLocalGroup && selectedLocalGroup.variants.length > 1 && (
              <div className="variant-strip compact-variants">
                {selectedLocalGroup.variants.map((variant) => (
                  <button key={variant.id} className={selectedLocalModel?.id === variant.id ? 'tag-chip active' : 'tag-chip'} onClick={() => setSelectedCatalogId(`local:${variant.id}`)}>
                    {variant.quantization ?? variant.format ?? variant.variant_label ?? variant.display_name}{variant.active_status === 'running' ? ' · running' : ''}
                  </button>
                ))}
              </div>
            )}
            {catalogSource === 'huggingface' && variants.data?.variants.length ? (
              <details className="mini-options">
                <summary>Choose download variant</summary>
                <select className="input guided-model-select" value={selectedVariant?.id ?? ''} onChange={(event) => setSelectedVariantId(event.target.value)}>
                  {variants.data.variants.map((variant: HfModelVariant) => (
                    <option key={variant.id} value={variant.id}>{variant.quantization ? `${variant.quantization} · ` : ''}{variant.format} · {variant.filename}{variant.size_label ? ` · ${variant.size_label}` : ''}{variant.recommended ? ' · recommended' : ''}</option>
                  ))}
                </select>
              </details>
            ) : null}
          </div>

          {recommendedLocalModel && (!selectedLocalModel || selectedLocalModel.id !== recommendedLocalModel.id) && (
            <button className="recommended-inline" type="button" onClick={() => selectLocalModel(recommendedLocalModel)}>
              <span>Best local pick</span>
              <strong>{recommendedLocalModel.group_name ?? recommendedLocalModel.display_name}</strong>
              <small>{recommendedLocalModel.variant_label ?? recommendedLocalModel.quantization ?? recommendedLocalModel.format ?? 'local'}{recommendedLocalModel.size_label ? ` · ${recommendedLocalModel.size_label}` : ''}</small>
            </button>
          )}

          <details className="step-by-step-details">
            <summary>Show setup checklist</summary>
            <FirstRunChecklist steps={firstRunSteps} />
          </details>
        </section>

        <aside className="simple-run-detail">
          <ModelDetailDrawer
            detail={selectedModelDetail()}
            loading={quickLaunch.isPending || loadLocal.isPending || start.isPending || stop.isPending}
            endpoint={selectedInstance ? endpoint : null}
            onLoad={selectedCatalog || selectedLocalModel ? () => safeAct(() => loadSelectedModel(true)) : undefined}
            onUnload={selectedInstance?.status === 'running' ? () => safeAct(() => stop.mutateAsync(selectedInstance.id)) : undefined}
            onOpenLogs={selectedInstance ? () => onOpenLogs(selectedInstance.id) : undefined}
            onTest={selectedInstance ? () => onOpenPlayground(selectedInstance.id) : undefined}
            onCopyEndpoint={canCopyEndpoint ? () => copyWithNotice(endpoint, 'Base URL') : undefined}
            endpointCopyReady={canCopyEndpoint}
            endpointCopyHint={selectedInstance?.status === 'running' ? (testPassed ? testedNameSummary : 'Test this model in the main panel before copying this endpoint.') : selectedInstance ? 'Start the selected model and wait for it to be ready before copying.' : null}
          />
        </aside>
      </div>

      <details className="advanced-cockpit" open={showAdvancedCockpit} onToggle={(event) => setShowAdvancedCockpit(event.currentTarget.open)}>
        <summary>Advanced: diagnostics, full settings, logs, metrics, command preview</summary>

      <div className="server-qa-strip card">
        <div className="row-between">
          <div>
            <p className="label">Setup check</p>
            <strong>{serverQa.data?.ready_to_load ? 'Ready to load' : 'Check setup before loading'}</strong>
          </div>
          <div className="row">
            <span className="pill">{serverQa.data?.local_model_count ?? 0} local</span>
            <span className="pill">{serverQa.data?.active_downloads ?? 0} downloading</span>
            <span className="pill">{serverQa.data?.running_instances ?? 0} running</span>
          </div>
        </div>
        <QaChecklist checks={serverQa.data?.checks} />
      </div>

      <div className="server-layout">
        <section className="server-main stack">
          <div className="card server-picker-card">
            <div className="row-between">
              <h3><Box size={18} /> Models</h3>
              <div className="server-filter-row">
                <select className="input server-tag-select" value={catalogSource} onChange={(event) => { setCatalogSource(event.target.value as 'builtin' | 'huggingface' | 'local'); setSelectedCatalogId(''); }}>
                  <option value="local">This device</option>
                  <option value="builtin">Built-in</option>
                  <option value="huggingface">Hugging Face</option>
                </select>
                <div className="search-wrap"><Search size={15} /><input className="input server-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={catalogSource === 'huggingface' ? 'Optional HF search: model, org, task...' : catalogSource === 'local' ? 'Search models on this device...' : 'Search built-in catalog...'} /></div>
                {catalogSource === 'huggingface' && <select className="input server-tag-select" value={hfMode} onChange={(event) => { setHfMode(event.target.value); setSelectedCatalogId(''); }} title="Fresh Hugging Face discovery mode">
                  <option value="trending">Trending now</option>
                  <option value="most_downloaded">Most downloaded</option>
                  <option value="most_liked">Most liked</option>
                  <option value="recently_updated">Recently updated</option>
                  <option value="search">Search relevance</option>
                </select>}
                {catalogSource === 'huggingface' && <select className="input server-tag-select" value={hfTask} onChange={(event) => { setHfTask(event.target.value); setSelectedCatalogId(''); }} title="HF task/filter preset">
                  <option value="llm">LLM / text generation</option>
                  <option value="coding">Coding</option>
                  <option value="embedding">Embeddings</option>
                  <option value="vision">Vision-language</option>
                  <option value="all">All tasks</option>
                </select>}
                {catalogSource === 'huggingface' && <input className="input server-tag-select" value={hfAuthor} onChange={(event) => { setHfAuthor(event.target.value); setSelectedCatalogId(''); }} placeholder="optional author/org" title="Optional HF author/org filter" />}
                {catalogSource === 'huggingface' && <input className="input server-tag-select" value={hfTokenEnv} onChange={(event) => setHfTokenEnv(event.target.value)} placeholder="HF_TOKEN" title="Environment variable containing your Hugging Face token" />}
                <select className="input server-tag-select" value={tag} onChange={(event) => { setTag(event.target.value); setSelectedCatalogId(''); }} disabled={catalogSource === 'huggingface'}>
                  <option value="">All tags</option>
                  {tagOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>
            <div className="tag-strip">
              {catalogSource === 'builtin' ? <button className={tag === '' ? 'tag-chip active' : 'tag-chip'} onClick={() => { setTag(''); setSelectedCatalogId(''); }}>All</button> : catalogSource === 'huggingface' ? <span className="pill accent-pill">fresh HF discovery: {hfMode.replace('_', ' ')}</span> : <span className="pill accent-pill">on-device model list</span>}
              {tagOptions.slice(0, 14).map((item) => <button key={item} className={tag === item ? 'tag-chip active' : 'tag-chip'} onClick={() => { if (catalogSource === 'builtin') { setTag(item); setSelectedCatalogId(''); } else { setQuery(item); setSelectedCatalogId(''); } }}>{item}</button>)}
            </div>
            {catalogSource === 'huggingface' && hub.data && 'online' in hub.data && !(hub.data as any).online && <div className="inline-warning"><AlertTriangle size={16} /> {(hub.data as any).error || 'Hugging Face search is unavailable. Check network access or your HF token env var.'}</div>}
            {catalogSource === 'huggingface' && <p className="muted">Discovers current models from huggingface.co at runtime. Use Trending/Downloads/Updated instead of relying on stale example names. Set {hfTokenEnv || 'HF_TOKEN'} in the controller environment for private/gated models; the token value is never sent to the browser.</p>}
            {catalogSource === 'local' && <p className="muted">Shows models detected from Hugging Face cache, LM Studio, vLLM/Unsloth caches, Downloads, ./models, and app scan paths. Add a folder only if your models live somewhere custom.</p>}
            {catalogSource === 'local' && (scanRoots.data?.warnings ?? []).length > 0 && <div className="inline-warning"><AlertTriangle size={16} /> {(scanRoots.data?.warnings ?? []).slice(0, 2).join(' · ')}</div>}
            {visibleCatalog.length === 0 && <div className="empty-state">No models match this view. Try another source, add a model folder, or clear the search.</div>}
            <select className="server-model-select" value={selectedCatalog?.id ?? ''} onChange={(event) => { setSelectedCatalogId(event.target.value); setSelectedInstanceId(''); }} disabled={!visibleCatalog.length}>
              {catalogSource === 'local' && localGroups.length ? localGroups.map((group) => (
                <optgroup key={group.id} label={`${group.display_name} · ${group.variants.length} variant${group.variants.length === 1 ? '' : 's'}${group.loaded_instance_count ? ' · loaded' : ''}`}>
                  {group.variants
                    .filter((variant) => visibleCatalog.some((model) => model.id === `local:${variant.id}`))
                    .map((variant) => <option key={variant.id} value={`local:${variant.id}`}>{variant.variant_label ?? variant.display_name} — {shortModelId(variant.model_id, 42)}</option>)}
                </optgroup>
              )) : visibleCatalog.map((model) => (
                <option key={model.id} value={model.id}>{simpleModelName(model.display_name)} — {shortModelId(model.model_id, 42)}</option>
              ))}
            </select>
            {selectedCatalog && (
              <div className="selected-model-card">
                <div>
                  <div className="row">
                    <strong>{selectedCatalog.display_name}</strong>
                    <span className="pill accent-pill">{compactBytesLabel(selectedCatalog)}</span>
                    {selectedRegistered && <span className="pill completed">registered</span>}
                    {selectedRunning && <span className="pill running">running</span>}
                    {selectedCatalog.gated && <span className="pill warning-pill">HF gated</span>}
                    {selectedCatalog.source === 'huggingface' && <span className="pill accent-pill">HF</span>}
                    {selectedCatalog.downloads != null && <span className="pill">{selectedCatalog.downloads.toLocaleString()} downloads</span>}
                    {selectedCatalog.likes != null && <span className="pill">{selectedCatalog.likes.toLocaleString()} likes</span>}
                    {selectedCatalog.last_modified && <span className="pill">updated {selectedCatalog.last_modified.slice(0, 10)}</span>}
                    {busyDownloadModels.has(selectedCatalog.model_id) && <span className="pill running">downloading</span>}
                    {selectedLocalModel && <span className="pill completed">local</span>}
                    {selectedLocalModel?.format && <span className="pill">{selectedLocalModel.format}</span>}
                    {selectedLocalModel?.quantization && <span className="pill">{selectedLocalModel.quantization}</span>}
                  </div>
                  <code title={selectedCatalog.model_id}>{shortModelId(selectedCatalog.model_id, 72)}</code>
                  {selectedLocalModel?.local_path && <p className="muted">On device. Full path is in model details.</p>}
                  {catalogSource === 'local' && selectedLocalGroup && selectedLocalGroup.variants.length > 1 && (
                    <div className="variant-strip">
                      {selectedLocalGroup.variants.map((variant) => (
                        <button key={variant.id} className={selectedLocalModel?.id === variant.id ? 'tag-chip active' : 'tag-chip'} title={`${variant.variant_label ?? variant.display_name} · ${variant.model_id}`} onClick={() => setSelectedCatalogId(`local:${variant.id}`)}>
                          {variant.quantization ?? variant.format ?? variant.variant_label ?? variant.display_name}{variant.size_label ? ` · ${variant.size_label}` : ''}{variant.active_status === 'running' ? ' · loaded' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="muted">{selectedCatalog.description}</p>
                  <div className="row tags-row">{selectedCatalog.tags.map((item) => <button key={item} className="tag-chip mini" onClick={() => setTag(item)}>{item}</button>)}</div>
                  {catalogSource === 'huggingface' && (
                    <div className="variant-picker">
                      <div className="row-between">
                        <strong>Download variant / quantization</strong>
                        <div className="row">
                          {variants.isFetching && <span className="muted">checking files…</span>}
                          <button className="btn secondary compact-btn" onClick={() => variants.refetch()} type="button"><RefreshCw size={13} /> Refresh</button>
                        </div>
                      </div>
                      {variants.data && !variants.data.online && <div className="inline-warning"><AlertTriangle size={16} /> {variants.data.error || 'Could not read HF file variants.'}</div>}
                      {variants.data?.variants.length ? (
                        <select className="input" value={selectedVariant?.id ?? ''} onChange={(event) => setSelectedVariantId(event.target.value)}>
                          {variants.data.variants.map((variant: HfModelVariant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.quantization ? `${variant.quantization} · ` : ''}{variant.format} · {variant.filename}{variant.size_label ? ` · ${variant.size_label}` : ''}{variant.recommended ? ' · recommended' : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="muted">No explicit quantized files detected yet. Download will use the repo snapshot unless you pick another HF result.</p>
                      )}
                      {selectedVariant && <p className="muted">Selected: <code title={selectedVariant.path}>{selectedVariant.path}</code>. {selectedVariant.notes}</p>}
                    </div>
                  )}
                  <DownloadStatus job={selectedJob} />
                </div>
                <div className="server-model-actions">
                  <button className="btn secondary" disabled={quickLaunch.isPending || download.isPending || selectedRegistered} onClick={() => safeAct(() => selectedCatalog.source === 'huggingface' ? api.registerHfModel({ model_id: selectedCatalog.model_id, display_name: selectedCatalog.display_name, tags: selectedCatalog.tags }) : api.registerCatalogModel(selectedCatalog.id))}>{selectedRegistered ? 'Registered' : 'Register'}</button>
                  <button className="btn secondary" disabled={download.isPending || busyDownloadModels.has(selectedCatalog.model_id)} onClick={() => safeAct(() => download.mutateAsync(selectedCatalog))}><Download size={15} /> {download.isPending ? 'Queueing...' : selectedJob?.status === 'completed' ? 'Download again' : 'Download'}</button>
                  <button className="btn secondary" disabled={quickLaunch.isPending || loadLocal.isPending} onClick={() => safeAct(() => selectedLocalModel ? loadLocal.mutateAsync({ start: false, forceNew: matchingInstances.length > 0 }) : quickLaunch.mutateAsync({ catalog: selectedCatalog, start: false, forceNew: matchingInstances.length > 0 }))}>{quickLaunch.isPending || loadLocal.isPending ? 'Preparing...' : matchingInstances.length ? 'Create duplicate instance' : 'Create Instance'}</button>
                  <button className="btn" disabled={quickLaunch.isPending || loadLocal.isPending} onClick={() => safeAct(() => loadSelectedModel(true))}>{quickLaunch.isPending || loadLocal.isPending ? 'Preparing...' : selectedInstance?.status === 'running' ? 'Already Loaded' : selectedLocalModel ? 'Load local model' : matchingInstances.length ? 'Load existing / create if needed' : 'Create + Load'}</button>
                </div>
              </div>
            )}
          </div>

          <div className="card load-settings-card">
            <div className="row-between">
              <h3>Load Settings</h3>
              <button className="btn secondary" onClick={() => instances.refetch()}><RefreshCw size={15} /> Refresh</button>
            </div>
            <div className="preset-chooser">
              <div className="row-between preset-head">
                <div>
                  <strong>Choose how to run it</strong>
                  <p className="muted">Pick the goal first. Exact vLLM args stay hidden unless you open Advanced.</p>
                </div>
                <span className="pill accent-pill">{activeLoadPreset.badge}</span>
              </div>
              <div className="preset-grid">
                {VLLM_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={selectedLoadPreset === preset.id ? 'preset-card active' : 'preset-card'}
                    onClick={() => { setSelectedLoadPreset(preset.id); setNotice(`${preset.name} preset selected.`); }}
                  >
                    <span>{preset.badge}</span>
                    <strong>{preset.name}</strong>
                    <small>{preset.description}</small>
                  </button>
                ))}
              </div>
              <div className="preset-summary">
                <div><span>DType</span><strong>{activeLoadPreset.dtype}</strong></div>
                <div><span>GPU memory</span><strong>{Math.round(activeLoadPreset.gpuMemory * 100)}%</strong></div>
                <div><span>Max context</span><strong>{activeLoadPreset.maxModelLen ? activeLoadPreset.maxModelLen.toLocaleString() : 'auto'}</strong></div>
                <div><span>Tensor parallel</span><strong>{activeLoadPreset.tensorParallelSize ?? 'auto'}</strong></div>
                <div><span>Preset args</span><strong>{presetExtraArgLabel}</strong></div>
              </div>
              <p className="muted preset-best-for">Best for: {activeLoadPreset.bestFor}</p>
            </div>
            <div className="grid compact-run-settings">
              <label>Loaded instance
                <select className="input" value={selectedInstance?.id ?? ''} onChange={(event) => setSelectedInstanceId(event.target.value)}>
                  {!instances.data?.length && <option value="">No instances yet</option>}
                  {matchingInstances.map((item) => <option key={item.id} value={item.id}>{item.status === 'running' ? 'Loaded: ' : 'Configured: '}{item.name} — {item.status} — :{item.port}</option>)}
                  {instances.data?.filter((item) => !matchingInstances.some((match) => match.id === item.id)).map((item) => <option key={item.id} value={item.id}>Other: {item.name} — {item.status} — :{item.port}</option>)}
                </select>
              </label>
              <label>Host<input className="input" value={host} onChange={(event) => setHost(event.target.value)} /></label>
              <label>Port<input className="input" type="number" value={port} onChange={(event) => setPort(Number(event.target.value))} /></label>
            </div>
            <details className="advanced-load-settings" open={showAdvancedLoadSettings} onToggle={(event) => setShowAdvancedLoadSettings(event.currentTarget.open)}>
              <summary>Advanced load settings</summary>
              {!usingCustomSettings && <div className="inline-warning preset-custom-warning">Preset mode is active. Choose Custom above to use exact dtype, GPU memory, max context, or tensor parallel values.</div>}
              <div className="grid">
                <label>DType
                  <select className="input" value={dtype} disabled={!usingCustomSettings} onChange={(event) => setDtype(event.target.value)}>
                    <option value="auto">auto</option>
                    <option value="bfloat16">bfloat16</option>
                    <option value="float16">float16</option>
                    <option value="float32">float32</option>
                  </select>
                </label>
                <label>GPU memory<input className="input" type="number" step="0.01" min="0.1" max="1" value={gpuMemory} disabled={!usingCustomSettings} onChange={(event) => setGpuMemory(Number(event.target.value))} /></label>
                <label>Max model length<input className="input" inputMode="numeric" value={maxModelLen} disabled={!usingCustomSettings} onChange={(event) => setMaxModelLen(event.target.value)} placeholder={selectedCatalog?.suggested_max_model_len ? String(selectedCatalog.suggested_max_model_len) : 'auto'} /></label>
                <label>Served model name<input className="input" value={servedModelName} onChange={(event) => setServedModelName(event.target.value)} placeholder="OpenAI API model alias" /></label>
                <label>Server API key<input className="input" type="password" value={serverApiKey} onChange={(event) => setServerApiKey(event.target.value)} placeholder="optional vLLM --api-key" /></label>
                <label>Tensor parallel<input className="input" inputMode="numeric" value={tensorParallelSize} disabled={!usingCustomSettings} onChange={(event) => setTensorParallelSize(event.target.value)} placeholder="auto" /></label>
                <label>Pipeline parallel<input className="input" inputMode="numeric" value={pipelineParallelSize} onChange={(event) => setPipelineParallelSize(event.target.value)} placeholder="auto" /></label>
                <label>KV cache memory<input className="input" value={kvCacheMemoryBytes} onChange={(event) => setKvCacheMemoryBytes(event.target.value)} placeholder="e.g. 20G or 21474836480" /></label>
                <label>Reasoning parser<input className="input" value={reasoningParser} onChange={(event) => setReasoningParser(event.target.value)} placeholder="deepseek_r1, etc." /></label>
                <label>Tool parser<input className="input" value={toolCallParser} onChange={(event) => setToolCallParser(event.target.value)} placeholder="hermes, llama3_json, etc." /></label>
                <label>Test temperature<input className="input" type="number" step="0.1" min="0" max="2" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} /></label>
              </div>
              <div className="checkbox-grid">
                <label className="checkbox-row"><input type="checkbox" checked={trustRemoteCode} onChange={(event) => setTrustRemoteCode(event.target.checked)} /> Trust remote code</label>
                <label className="checkbox-row"><input type="checkbox" checked={enableAutoToolChoice} onChange={(event) => setEnableAutoToolChoice(event.target.checked)} /> Enable auto tool choice</label>
              </div>
              <label>Extra vLLM args<input className="input" value={extraArgsText} onChange={(event) => setExtraArgsText(event.target.value)} placeholder="--enable-prefix-caching --max-num-seqs 64" /></label>
            </details>
            {portInUse && <div className="inline-warning">Port {port} on {host} is already used by an existing instance. Choose another port before creating a new one.</div>}
            {matchingInstances.length > 1 && <div className="inline-warning">This model has {matchingInstances.length} configured instances. vLLM Control Center will prefer the running one; unload/eject old stopped instances to avoid confusion.</div>}
            {selectedInstance && <div className="row" style={{ marginTop: 12 }}>
              <button className="btn secondary" disabled={selectedInstance.status === 'running' || selectedInstance.status === 'starting' || eject.isPending} onClick={() => safeAct(() => eject.mutateAsync(selectedInstance.id))}><Trash2 size={15} /> {eject.isPending ? 'Ejecting...' : 'Eject instance'}</button>
              {(selectedInstance.status === 'running' || selectedInstance.status === 'starting') && <span className="muted">Unload the model before ejecting this instance.</span>}
            </div>}
          </div>

          <div className="card endpoint-card">
            <div className="row-between">
              <h3><Activity size={18} /> OpenAI-compatible base URL</h3>
              <button className="btn secondary" disabled={!canCopyEndpoint} onClick={() => copyWithNotice(endpoint, 'Base URL')}><Copy size={15} /> {canCopyEndpoint ? 'Copy /v1 base URL' : 'Test first to copy'}</button>
            </div>
            <code className="endpoint-code">{endpoint}</code>
            <p className="muted tiny">Use this as the OpenAI base URL after Quick test passes. Do not paste /chat/completions into SDK baseURL fields.</p>
            {selectedInstance && (
              <div className="handoff-mini-actions">
                <button className="btn secondary" type="button" onClick={() => copyWithNotice(curlSnippet, 'curl example')} disabled={!canCopyEndpoint}><Copy size={14} /> Copy curl</button>
                <button className="btn secondary" type="button" onClick={() => copyWithNotice(jsSnippet, 'JavaScript SDK example')} disabled={!canCopyEndpoint}><Copy size={14} /> Copy JS</button>
                <button className="btn secondary" type="button" onClick={() => copyWithNotice(pythonSnippet, 'Python SDK example')} disabled={!canCopyEndpoint}><Copy size={14} /> Copy Python</button>
                <button className="btn secondary" type="button" onClick={() => copyWithNotice(handoffBundle, 'Endpoint handoff')} disabled={!canCopyEndpoint}><Copy size={14} /> Copy handoff</button>
                <button className="btn secondary" type="button" onClick={() => copyWithNotice(envHandoff, 'safe .env handoff')} disabled={!canCopyEndpoint}><Copy size={14} /> Copy safe .env</button>
              </div>
            )}
            <div className="endpoint-grid">
              {supportedEndpoints.map(([method, path]) => (
                <div key={`${method}-${path}`} className="endpoint-row">
                  <span>{method}</span>
                  <code>{path}</code>
                  <span className={endpointStatusClass}>{endpointStatusLabel}</span>
                </div>
              ))}
            </div>
            {selectedInstance && <div className="row" style={{ marginTop: 12 }}>
              <button className="btn secondary" onClick={() => onOpenPlayground(selectedInstance.id)}><TerminalSquare size={15} /> Open Playground</button>
              <button className="btn secondary" onClick={() => onOpenMetrics(selectedInstance.id)}><Gauge size={15} /> Open Metrics</button>
              <button className="btn secondary" onClick={() => onOpenLogs(selectedInstance.id)}><Clipboard size={15} /> Open Logs</button>
            </div>}
          </div>

          <div className="card server-test-card">
            <div className="row-between">
              <h3><TerminalSquare size={18} /> Test</h3>
              <button className="btn" disabled={!running || inlineTest.isPending} onClick={() => safeAct(() => inlineTest.mutateAsync({}))}>{inlineTest.isPending ? 'Testing...' : 'Send test'}</button>
            </div>
            <textarea className="input area" value={testPrompt} onChange={(event) => setTestPrompt(event.target.value)} />
            {!running && <p className="muted">Load a model first, then run a one-message test through /v1/chat/completions.</p>}
            {running && <div className={`quick-test-result compact ${quickTestState}`}>
              <div className="quick-test-result-head">
                <span className="quick-test-icon">{quickTestState === 'passed' ? <CheckCircle2 size={16} /> : quickTestState === 'failed' ? <XCircle size={16} /> : <Zap size={16} />}</span>
                <div><strong>{quickTestTitle}</strong><p>{quickTestHint}</p></div>
                {testLatency != null && <span className="pill soft">{testLatency} ms</span>}
              </div>
              {testErrorMessage && <div className="inline-warning">{testErrorMessage}</div>}
              {testNextActions.length > 0 && (
                <div className="quick-test-next-actions">
                  <span>Try next:</span>
                  {testNextActions.slice(0, 3).map((action) => <em key={action}>{action}</em>)}
                </div>
              )}
            </div>}
            {testOutput && <pre className="test-output">{testOutput}</pre>}
          </div>

          <div className="card">
            <h3><Clipboard size={18} /> Logs</h3>
            <ServerLogs instanceId={selectedInstance?.id} />
          </div>
        </section>

        <aside className="server-side stack">
          <div className="card">
            <h3>Live Metrics</h3>
            {running && metrics.data?.available ? (
              <div className="stack">
                <div className="metric-mini"><span>KV cache</span><strong>{metrics.data.kv_cache_usage_perc?.toFixed(1) ?? '—'}%</strong></div>
                <div className="metric-mini"><span>Running requests</span><strong>{metrics.data.requests_running ?? '—'}</strong></div>
                <div className="metric-mini"><span>Waiting requests</span><strong>{metrics.data.requests_waiting ?? '—'}</strong></div>
                <div className="metric-mini"><span>Gen tok/s</span><strong>{metrics.data.generation_tokens_per_sec?.toFixed(1) ?? '—'}</strong></div>
              </div>
            ) : (
              <div>
                <p className="muted">Metrics appear after the server is running and /metrics is reachable.</p>
                {running && metrics.data?.error && <div className="inline-warning">{metrics.data.error}</div>}
              </div>
            )}
          </div>

          <div className="card">
            <div className="row-between">
              <h3>Command Preview</h3>
              <button className="btn secondary" disabled={!command.data?.redacted_command} onClick={() => copyWithNotice(command.data?.redacted_command ?? '', 'Command')}><Copy size={15} /> Copy</button>
            </div>
            <pre className="command-preview-small">{command.data?.redacted_command ?? 'Create or select an instance to preview the exact vLLM command.'}</pre>
          </div>
        </aside>
      </div>
      </details>
    </div>
  );
}
