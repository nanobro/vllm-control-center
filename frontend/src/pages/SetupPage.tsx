import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Copy, Download, HardDrive, RefreshCw, Wrench, XCircle } from 'lucide-react';
import { api } from '../api/client';

type SetupStatus = 'ok' | 'attention' | 'optional' | 'working';

type SetupItem = {
  label: string;
  status: SetupStatus;
  message: string;
  action?: { label: string; onClick: () => void; disabled?: boolean };
};

function iconFor(status: SetupStatus) {
  if (status === 'ok') return <CheckCircle2 size={18} />;
  if (status === 'working') return <RefreshCw size={18} />;
  if (status === 'optional') return <Wrench size={18} />;
  return <XCircle size={18} />;
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

export function SetupPage() {
  const qc = useQueryClient();
  const doctor = useQuery({ queryKey: ['doctor'], queryFn: api.doctor, retry: false, refetchInterval: 30000 });
  const qa = useQuery({ queryKey: ['server-qa'], queryFn: api.serverQa, retry: false, refetchInterval: 15000 });
  const local = useQuery({ queryKey: ['local-models'], queryFn: api.localModels, retry: false, refetchInterval: 10000 });
  const downloads = useQuery({ queryKey: ['downloads'], queryFn: api.downloads, retry: false, refetchInterval: 5000 });
  const instances = useQuery({ queryKey: ['instances'], queryFn: api.instances, retry: false, refetchInterval: 5000 });

  const addRoot = useMutation({
    mutationFn: api.addLocalModelScanRoot,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['local-models'] });
      qc.invalidateQueries({ queryKey: ['server-qa'] });
    },
  });

  const downloadStarter = useMutation({
    mutationFn: (modelId: string) => api.createDownload({ model_id: modelId, register_model: true, dry_run: false, hf_token_env: 'HF_TOKEN' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['downloads'] });
      qc.invalidateQueries({ queryKey: ['server-qa'] });
    },
  });

  if (doctor.isLoading) return <div className="card">Checking environment...</div>;
  if (doctor.isError) return <div className="card">Controller is unavailable: {(doctor.error as Error).message}</div>;

  const report = doctor.data!;
  const localCount = local.data?.models.length ?? qa.data?.local_model_count ?? 0;
  const activeDownloads = downloads.data?.filter((job) => job.status === 'queued' || job.status === 'running').length ?? qa.data?.active_downloads ?? 0;
  const runningCount = instances.data?.filter((instance) => instance.status === 'running').length ?? qa.data?.running_instances ?? 0;
  const hasModelSource = localCount > 0 || activeDownloads > 0 || (qa.data?.completed_downloads ?? 0) > 0;

  const items: SetupItem[] = [
    { label: 'Python/backend reachable', status: 'ok', message: `Controller is running on Python ${report.python.version ?? report.python.message}.` },
    {
      label: 'vLLM installed',
      status: report.vllm.ok ? 'ok' : 'attention',
      message: report.vllm.message,
      action: report.vllm.ok ? undefined : { label: 'Copy install command', onClick: () => copyText('python -m pip install vllm') },
    },
    {
      label: 'GPU detected',
      status: report.nvidia.ok ? 'ok' : 'attention',
      message: report.nvidia.message,
      action: report.nvidia.ok ? undefined : { label: 'Recheck', onClick: () => doctor.refetch() },
    },
    {
      label: 'Model folder/source',
      status: hasModelSource ? (activeDownloads ? 'working' : 'ok') : 'attention',
      message: hasModelSource ? `${localCount} local model(s), ${activeDownloads} active download(s).` : 'No model found yet. Add a folder or download a starter model.',
      action: hasModelSource ? undefined : { label: 'Add ./models', onClick: () => addRoot.mutate('./models'), disabled: addRoot.isPending },
    },
    {
      label: 'Hugging Face token',
      status: report.hf_token?.ok ? 'ok' : 'optional',
      message: report.hf_token?.message ?? 'Optional. Public models work without a token; gated/private downloads need HF_TOKEN.',
    },
    {
      label: 'OpenAI endpoint',
      status: runningCount ? 'ok' : 'optional',
      message: runningCount ? `${runningCount} model server(s) running.` : 'Load a model to create a /v1 endpoint.',
    },
  ];

  const attention = items.filter((item) => item.status === 'attention').length;
  const ready = items.filter((item) => item.status === 'ok').length;

  return (
    <>
      <div className={attention ? 'card setup-page-hero needs-attention' : 'card setup-page-hero ready'}>
        <div>
          <p className="label">Setup check</p>
          <h2>{attention ? `${attention} thing${attention === 1 ? '' : 's'} need attention` : 'Your machine is ready to run models'}</h2>
          <p className="muted">Plain-English checks for the first successful model run.</p>
        </div>
        <div className="setup-doctor-score"><strong>{ready}/{items.length}</strong><span>ready</span></div>
      </div>

      <div className="setup-doctor-grid full-width">
        {items.map((item) => (
          <div className={`setup-doctor-step ${item.status}`} key={item.label}>
            <div className="setup-step-icon">{iconFor(item.status)}</div>
            <div>
              <strong>{item.label}</strong>
              <p>{item.message}</p>
              {item.action && <button className="btn secondary compact-btn" disabled={item.action.disabled} onClick={item.action.onClick}>{item.action.label}</button>}
            </div>
          </div>
        ))}
      </div>

      <div className="card starter-recommendations">
        <div className="row-between">
          <div>
            <p className="label">Starter model recommendations</p>
            <h3>Pick a safe first download</h3>
            <p className="muted">Start tiny, prove the endpoint works, then move up to coding or larger GPU models.</p>
          </div>
          <button className="btn secondary" onClick={() => Promise.all([doctor.refetch(), qa.refetch(), local.refetch(), downloads.refetch(), instances.refetch()])}><RefreshCw size={15} /> Recheck</button>
        </div>
        <div className="starter-grid">
          <button className="starter-card" onClick={() => downloadStarter.mutate('Qwen/Qwen3-0.6B')} disabled={downloadStarter.isPending}>
            <Download size={16} />
            <strong>Fast smoke test</strong>
            <span>Qwen/Qwen3-0.6B</span>
            <small>Small enough to validate install and endpoint quickly.</small>
          </button>
          <button className="starter-card" onClick={() => downloadStarter.mutate('Qwen/Qwen2.5-Coder-7B-Instruct')} disabled={downloadStarter.isPending}>
            <Download size={16} />
            <strong>Coding starter</strong>
            <span>Qwen/Qwen2.5-Coder-7B-Instruct</span>
            <small>Good next step after the smoke test succeeds.</small>
          </button>
          <button className="starter-card" onClick={() => downloadStarter.mutate('Qwen/Qwen3-14B')} disabled={downloadStarter.isPending}>
            <Download size={16} />
            <strong>Bigger GPU</strong>
            <span>Qwen/Qwen3-14B</span>
            <small>For stronger local or remote GPU boxes.</small>
          </button>
        </div>
      </div>

      <div className="card">
        <h3>GPUs</h3>
        {report.gpus.length === 0 ? <p>No NVIDIA GPU detected.</p> : report.gpus.map((gpu) => (
          <p key={gpu.index}>{gpu.index}: {gpu.name} - {gpu.memory_used_mb ?? '?'} / {gpu.memory_total_mb ?? '?'} MB</p>
        ))}
      </div>

      <div className="card">
        <h3><HardDrive size={17} /> Scanned model paths</h3>
        {(local.data?.scanned_paths ?? []).length ? (local.data?.scanned_paths ?? []).map((path) => <p key={path}><code>{path}</code></p>) : <p className="muted">No model folder has produced models yet.</p>}
        <div className="row">
          <button className="btn secondary" disabled={addRoot.isPending} onClick={() => addRoot.mutate('~/.cache/huggingface/hub')}>Scan HF cache</button>
          <button className="btn secondary" disabled={addRoot.isPending} onClick={() => addRoot.mutate('./models')}>Scan ./models</button>
        </div>
      </div>

      {report.warnings.length > 0 && <div className="card"><h3>Warnings</h3>{report.warnings.map((w) => <p key={w}>{w}</p>)}</div>}
    </>
  );
}
