import { Activity, BookOpen, Boxes, Database, Download, LayoutDashboard, Network, PlaySquare, Sparkles, TerminalSquare } from 'lucide-react';

type ToolTarget =
  | 'dashboard'
  | 'model-hub'
  | 'instances'
  | 'models'
  | 'compatibility'
  | 'recipes'
  | 'history'
  | 'remote-instances'
  | 'remote-playground'
  | 'metrics'
  | 'playground'
  | 'exports';

type ToolItem = {
  id: ToolTarget;
  title: string;
  text: string;
  icon: typeof Activity;
};

const dailySupport: ToolItem[] = [
  { id: 'playground', title: 'Local playground', text: 'Open a lightweight test chat for the loaded local endpoint.', icon: TerminalSquare },
  { id: 'metrics', title: 'Runtime metrics', text: 'Inspect tokens/sec, requests, and KV cache only when debugging.', icon: Activity },
  { id: 'instances', title: 'Local instances', text: 'View raw instance records and lifecycle state.', icon: PlaySquare },
];

const modelTools: ToolItem[] = [
  { id: 'model-hub', title: 'Hugging Face catalog', text: 'Search the broader HF catalog when the main Models page is not enough.', icon: Boxes },
  { id: 'compatibility', title: 'Compatibility lab', text: 'Check model fit, format, and vLLM readiness in more detail.', icon: Sparkles },
  { id: 'models', title: 'Registry', text: 'Raw model registry view retained for maintainers and QA.', icon: Database },
];

const opsTools: ToolItem[] = [
  { id: 'dashboard', title: 'Dashboard', text: 'Original system dashboard for deeper controller inspection.', icon: LayoutDashboard },
  { id: 'remote-instances', title: 'Remote instances', text: 'Raw remote instance bridge for advanced remote troubleshooting.', icon: Network },
  { id: 'remote-playground', title: 'Remote playground', text: 'Streaming remote test surface kept separate from the simple Remote page.', icon: TerminalSquare },
  { id: 'exports', title: 'Exports', text: 'Download support bundles and config snapshots for debugging.', icon: Download },
  { id: 'recipes', title: 'Recipes', text: 'Integration recipes for Open WebUI, local launch, and remote boxes.', icon: BookOpen },
  { id: 'history', title: 'Chat history', text: 'Review saved playground conversations.', icon: BookOpen },
];

function ToolCard({ item, onNavigate }: { item: ToolItem; onNavigate: (target: ToolTarget) => void }) {
  const Icon = item.icon;
  return (
    <button className="advanced-tool-card" onClick={() => onNavigate(item.id)}>
      <span className="advanced-tool-icon"><Icon size={18} /></span>
      <span>
        <strong>{item.title}</strong>
        <small>{item.text}</small>
      </span>
    </button>
  );
}

function ToolSection({ title, text, items, onNavigate }: { title: string; text: string; items: ToolItem[]; onNavigate: (target: ToolTarget) => void }) {
  return (
    <section className="card advanced-tools-section">
      <div className="row-between">
        <div>
          <p className="label">{title}</p>
          <h3>{title}</h3>
          <p className="muted">{text}</p>
        </div>
      </div>
      <div className="advanced-tools-grid">
        {items.map((item) => <ToolCard key={item.id} item={item} onNavigate={onNavigate} />)}
      </div>
    </section>
  );
}

export function AdvancedToolsPage({ onNavigate }: { onNavigate: (target: ToolTarget) => void }) {
  return (
    <div className="stack advanced-tools-page">
      <section className="card advanced-tools-hero">
        <p className="label">Advanced mode</p>
        <h2>Extra tools for debugging, QA, and operator work.</h2>
        <p className="muted">
          Daily mode keeps the app focused on Run Model, Models, Remote, and Settings. Use these tools only when
          something needs deeper inspection or a support bundle.
        </p>
        <div className="advanced-mode-note">Daily path: choose model → load → quick test → copy the /v1 endpoint.</div>
      </section>
      <ToolSection title="Daily support" text="Open these when a running model needs testing or inspection." items={dailySupport} onNavigate={onNavigate} />
      <ToolSection title="Model troubleshooting" text="Use these when detection, compatibility, or catalog search needs more detail." items={modelTools} onNavigate={onNavigate} />
      <ToolSection title="Operator tools" text="Kept for advanced remote, support bundle, and maintainer workflows." items={opsTools} onNavigate={onNavigate} />
    </div>
  );
}
