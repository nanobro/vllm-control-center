import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Copy, HardDrive, Image, PlayCircle, RefreshCw, Rocket, ShieldCheck, TerminalSquare, Wrench } from 'lucide-react';
import { api } from '../api/client';

type ReleaseGate = {
  id: string;
  title: string;
  status: 'ready' | 'needs-work' | 'attention';
  summary: string;
  nextStep: string;
};

type ScreenshotState = {
  id: string;
  title: string;
  filename: string;
  ready: boolean;
  hint: string;
};

const betaSummary = `vLLM Control Center public beta

Positioning: LM Studio-style UX for vLLM, with local model management and remote GPU ops.

Core flow:
1. Detect or download a model
2. Load it with safe defaults
3. Run a quick test
4. Copy the OpenAI-compatible /v1 endpoint

Beta ask: test first-run setup, local model scanning, downloads, load/unload, error recovery, and one remote GPU profile.`;

const smokePath = `Public beta smoke path

1. Fresh clone: run ./scripts/bootstrap.sh
2. Start the app with ./scripts/dev.sh
3. If the app does not open, run ./scripts/launch-check.sh
4. Open Run Model
5. Recheck setup if needed
6. Scan ./models or Hugging Face cache
7. Load one small model
8. Run Quick Test
9. Copy the /v1 endpoint
10. Open Models and confirm status is clear
11. Open Remote and confirm the empty or connected state is understandable
12. Run ./scripts/smoke.sh and ./scripts/check.sh before packaging`;

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

function StatusPill({ status }: { status: ReleaseGate['status'] }) {
  if (status === 'ready') return <span className="release-pill ready">Ready</span>;
  if (status === 'attention') return <span className="release-pill warn">Check</span>;
  return <span className="release-pill block">Fix first</span>;
}

function ReadyPill({ ready }: { ready: boolean }) {
  return ready ? <span className="release-pill ready">Ready</span> : <span className="release-pill todo">Missing</span>;
}

function GateIcon({ status }: { status: ReleaseGate['status'] }) {
  if (status === 'ready') return <CheckCircle2 size={17} />;
  if (status === 'attention') return <AlertTriangle size={17} />;
  return <Wrench size={17} />;
}

function GateCard({ gate }: { gate: ReleaseGate }) {
  return (
    <div className={`rc-gate ${gate.status === 'ready' ? 'pass' : gate.status === 'attention' ? 'warn' : 'block'}`}>
      <div className="row-between">
        <span className="rc-gate-icon"><GateIcon status={gate.status} /></span>
        <StatusPill status={gate.status} />
      </div>
      <strong>{gate.title}</strong>
      <p>{gate.summary}</p>
      {gate.status !== 'ready' && <small>{gate.nextStep}</small>}
    </div>
  );
}

export function ReleasePage() {
  const [copied, setCopied] = useState<'summary' | 'smoke' | 'commands' | null>(null);
  const qa = useQuery({ queryKey: ['server-qa'], queryFn: api.serverQa, retry: false, refetchInterval: 15000 });
  const local = useQuery({ queryKey: ['local-models'], queryFn: api.localModels, retry: false, refetchInterval: 15000 });
  const downloads = useQuery({ queryKey: ['downloads'], queryFn: api.downloads, retry: false, refetchInterval: 7000 });
  const instances = useQuery({ queryKey: ['instances'], queryFn: api.instances, retry: false, refetchInterval: 7000 });
  const remotes = useQuery({ queryKey: ['remote-profiles'], queryFn: api.remoteProfiles, retry: false, refetchInterval: 30000 });

  const localCount = local.data?.models.length ?? qa.data?.local_model_count ?? 0;
  const runningInstances = instances.data?.filter((item) => item.status === 'running') ?? [];
  const crashedInstances = instances.data?.filter((item) => item.status === 'crashed') ?? [];
  const running = runningInstances[0] ?? null;
  const completedDownloads = downloads.data?.filter((job) => job.status === 'completed') ?? [];
  const failedDownloads = downloads.data?.filter((job) => job.status === 'failed') ?? [];
  const remoteCount = remotes.data?.length ?? 0;
  const controllerReady = Boolean(qa.data);
  const hasModelSource = localCount > 0 || completedDownloads.length > 0;
  const hasFailures = failedDownloads.length > 0 || crashedInstances.length > 0;

  const gates: ReleaseGate[] = useMemo(() => [
    {
      id: 'first-run',
      title: 'First-run state is readable',
      status: controllerReady ? 'ready' : 'needs-work',
      summary: controllerReady ? 'The app can read setup readiness and show first-run help.' : 'The app cannot read setup readiness yet.',
      nextStep: 'Start the controller, then refresh this page.',
    },
    {
      id: 'model-source',
      title: 'A model can be selected',
      status: hasModelSource ? 'ready' : 'needs-work',
      summary: hasModelSource ? `${localCount} local model(s), ${completedDownloads.length} completed download(s).` : 'No local or downloaded model is available for the beta path.',
      nextStep: 'Scan ./models, scan the Hugging Face cache, or download a starter model.',
    },
    {
      id: 'endpoint',
      title: 'Endpoint success can be shown',
      status: running ? 'ready' : 'attention',
      summary: running ? `A model is running on port ${running.port}.` : 'No running endpoint is visible right now.',
      nextStep: 'Load one small model and run Quick Test before taking screenshots.',
    },
    {
      id: 'failures',
      title: 'No broken demo leftovers',
      status: hasFailures ? 'needs-work' : 'ready',
      summary: hasFailures ? `${failedDownloads.length} failed download(s), ${crashedInstances.length} crashed instance(s).` : 'No failed downloads or crashed instances are blocking the beta story.',
      nextStep: 'Use recovery help, retry/cancel failed downloads, or clear intentionally broken demo data.',
    },
    {
      id: 'remote',
      title: 'Remote story is intentional',
      status: remoteCount > 0 ? 'ready' : 'attention',
      summary: remoteCount > 0 ? `${remoteCount} remote profile(s) configured.` : 'Remote can be shown as a clean empty state or with one safe demo profile.',
      nextStep: 'Add one safe demo profile or capture the empty state deliberately.',
    },
  ], [controllerReady, hasModelSource, localCount, completedDownloads.length, running, hasFailures, failedDownloads.length, crashedInstances.length, remoteCount]);

  const screenshots: ScreenshotState[] = [
    { id: 'run', title: 'Run Model', filename: '01-run-model.png', ready: controllerReady, hint: 'Hero screen: selected model, load/test/copy endpoint.' },
    { id: 'models', title: 'Models library', filename: '02-models.png', ready: hasModelSource, hint: 'Local models/downloads with clear status chips.' },
    { id: 'endpoint', title: 'Endpoint success', filename: '03-endpoint-success.png', ready: Boolean(running), hint: 'Loaded model, Quick Test, and copy /v1 endpoint.' },
    { id: 'remote', title: 'Remote GPU', filename: '04-remote.png', ready: true, hint: 'Either connected profile or clean empty state.' },
    { id: 'setup', title: 'Setup check', filename: '05-setup-check.png', ready: controllerReady, hint: 'Plain-English readiness checks and fixes.' },
  ];

  const blockers = gates.filter((gate) => gate.status === 'needs-work').length;
  const checks = gates.filter((gate) => gate.status === 'attention').length;
  const ready = blockers === 0;
  const readyScreenshots = screenshots.filter((item) => item.ready).length;
  const commands = `./scripts/launch-check.sh
./scripts/smoke.sh
./scripts/check.sh
zip -r vllm-control-center-starter-v0.25.zip . -x '*/node_modules/*' '*/dist/*' '*/__pycache__/*' '*/.pytest_cache/*' '*/.ruff_cache/*' '*.db' '*.sqlite'`;

  return (
    <>
      <div className="card release-hero rc-hero">
        <div>
          <p className="label">Beta checklist</p>
          <h2>{ready ? 'Public beta is ready to package' : 'Fix blockers before publishing'}</h2>
          <p className="muted">A compact publish checklist for the public beta. It verifies the core story: choose a model, run it, test it, then copy the OpenAI-compatible endpoint.</p>
          <div className="release-actions">
            <button
              className="btn"
              onClick={async () => setCopied(await copyText(betaSummary) ? 'summary' : null)}
            >
              <Copy size={15} /> {copied === 'summary' ? 'Copied summary' : 'Copy beta summary'}
            </button>
            <button
              className="btn secondary"
              onClick={async () => setCopied(await copyText(smokePath) ? 'smoke' : null)}
            >
              <ClipboardCheck size={15} /> {copied === 'smoke' ? 'Copied smoke path' : 'Copy smoke path'}
            </button>
            <button className="btn secondary" onClick={() => Promise.all([qa.refetch(), local.refetch(), downloads.refetch(), instances.refetch(), remotes.refetch()])}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>
        <div className={ready ? 'release-score-card rc-pass' : 'release-score-card rc-block'}>
          {ready ? <ShieldCheck size={25} /> : <AlertTriangle size={25} />}
          <strong>{blockers}</strong>
          <span>{blockers === 1 ? 'blocker' : 'blockers'}</span>
          <small>{checks} item(s) to check</small>
        </div>
      </div>

      <div className="release-grid three">
        <div className="card release-stat"><HardDrive size={18} /><span>Model sources</span><strong>{localCount} local / {completedDownloads.length} downloaded</strong></div>
        <div className="card release-stat"><PlayCircle size={18} /><span>Endpoint</span><strong>{running ? `:${running.port}/v1` : 'not running'}</strong></div>
        <div className="card release-stat"><AlertTriangle size={18} /><span>Failures</span><strong>{failedDownloads.length} downloads / {crashedInstances.length} crashed</strong></div>
      </div>

      <div className="card">
        <div className="row-between">
          <div>
            <p className="label">Readiness</p>
            <h3>Publish when blockers are gone</h3>
            <p className="muted">Warnings are okay when intentional. Blockers mean the public beta story is not reproducible enough yet.</p>
          </div>
          <StatusPill status={ready ? 'ready' : 'needs-work'} />
        </div>
        <div className="rc-gate-grid compact-rc-grid">
          {gates.map((gate) => <GateCard key={gate.id} gate={gate} />)}
        </div>
      </div>

      <div className="release-grid two">
        <div className="card">
          <div className="row-between">
            <div>
              <p className="label">Screenshots</p>
              <h3>Five images explain the product</h3>
              <p className="muted">Use real app states. Avoid private paths, API keys, internal endpoints, or secret tokens.</p>
            </div>
            <ReadyPill ready={readyScreenshots >= 4} />
          </div>
          <div className="release-demo-list">
            {screenshots.map((item) => (
              <div className={item.ready ? 'release-check done' : 'release-check'} key={item.id}>
                <span>{item.ready ? <CheckCircle2 size={17} /> : <Image size={17} />}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.hint}</p>
                  <code>{item.filename}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <p className="label">Publish pack</p>
          <h3>Copy only what maintainers need</h3>
          <div className="release-story-box compact-story-box">
            <p><strong>Positioning:</strong> LM Studio UX + vLLM power + remote GPU ops.</p>
            <p><strong>Core flow:</strong> detect/download → load → test → copy /v1 endpoint.</p>
            <p><strong>Beta ask:</strong> test first-run setup, model scanning, downloads, error recovery, and remote GPU setup.</p>
          </div>
          <div className="release-actions stacked-actions">
            <button className="btn secondary" onClick={async () => setCopied(await copyText(commands) ? 'commands' : null)}>
              <TerminalSquare size={15} /> {copied === 'commands' ? 'Copied commands' : 'Copy check/package commands'}
            </button>
            <button className="btn secondary" onClick={async () => setCopied(await copyText(`${betaSummary}\n\n${smokePath}`) ? 'summary' : null)}>
              <Rocket size={15} /> Copy full beta note
            </button>
          </div>
          <pre className="release-note-preview">{betaSummary}\n\n{smokePath}\n\nCommands:\n{commands}</pre>
        </div>
      </div>
    </>
  );
}
