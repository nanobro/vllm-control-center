import { useEffect, useState } from 'react';
import { Activity, BookOpen, Boxes, Cpu, Database, Download, Globe2, HardDrive, LayoutDashboard, Megaphone, Network, PlaySquare, Server, Settings, Sparkles, TerminalSquare, Wrench, SlidersHorizontal } from 'lucide-react';
import { DashboardPage } from './DashboardPage';
import { SetupPage } from './SetupPage';
import { InstancesPage } from './InstancesPage';
import { LogsPage } from './LogsPage';
import { MetricsPage } from './MetricsPage';
import { PlaygroundPage } from './PlaygroundPage';
import { ExportsPage } from './ExportsPage';
import { ModelsPage } from './ModelsPage';
import { ModelHubPage } from './ModelHubPage';
import { RecipesPage } from './RecipesPage';
import { ChatHistoryPage } from './ChatHistoryPage';
import { RemoteControllersPage } from './RemoteControllersPage';
import { RemoteInstancesPage } from './RemoteInstancesPage';
import { RemotePlaygroundPage } from './RemotePlaygroundPage';
import { DownloadsPage } from './DownloadsPage';
import { ModelsLibraryPage } from './ModelsLibraryPage';
import { CompatibilityPage } from './CompatibilityPage';
import { SettingsPage } from './SettingsPage';
import { ServerPage } from './ServerPage';
import { LocalModelsPage } from './LocalModelsPage';
import { ReleasePage } from './ReleasePage';
import { AdvancedToolsPage } from './AdvancedToolsPage';
import { APP_VERSION_LABEL } from '../version';

const primaryPages = [
  { id: 'server', label: 'Run Model', icon: Server },
  { id: 'models-library', label: 'Models', icon: HardDrive },
  { id: 'remote', label: 'Remote', icon: Globe2 },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

const advancedPages = [
  { id: 'setup', label: 'Setup check', icon: Cpu },
  { id: 'logs', label: 'Logs', icon: Activity },
  { id: 'release', label: 'Release kit', icon: Megaphone },
  { id: 'advanced-tools', label: 'More tools', icon: Wrench },
] as const;

const hiddenPages = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'model-hub', label: 'Hugging Face Catalog', icon: Boxes },
  { id: 'instances', label: 'Instances', icon: PlaySquare },
  { id: 'models', label: 'Registry', icon: Database },
  { id: 'compatibility', label: 'Compatibility', icon: Sparkles },
  { id: 'recipes', label: 'Recipes', icon: BookOpen },
  { id: 'history', label: 'Chat History', icon: BookOpen },
  { id: 'remote-instances', label: 'Remote Instances', icon: Network },
  { id: 'remote-playground', label: 'Remote Playground', icon: TerminalSquare },
  { id: 'metrics', label: 'Metrics', icon: Activity },
  { id: 'playground', label: 'Playground', icon: TerminalSquare },
  { id: 'exports', label: 'Exports', icon: Download },
  { id: 'local-models', label: 'Local Models', icon: HardDrive },
  { id: 'downloads', label: 'Downloads', icon: Download },
] as const;

const pages = [...primaryPages, ...advancedPages, ...hiddenPages] as const;
type Page = typeof pages[number]['id'];

const isPage = (value: string | null): value is Page =>
  Boolean(value && pages.some((item) => item.id === value));

const isPrimaryPage = (value: Page) => primaryPages.some((item) => item.id === value);

function initialPage(): Page {
  if (typeof window === 'undefined') return 'server';
  const requestedPage = new URLSearchParams(window.location.search).get('page');
  return isPage(requestedPage) ? requestedPage : 'server';
}

function initialAdvancedMode(page: Page) {
  if (typeof window === 'undefined') return false;
  const requestedMode = new URLSearchParams(window.location.search).get('mode');
  if (requestedMode === 'advanced') return true;
  if (requestedMode === 'daily') return false;
  if (!isPrimaryPage(page)) return true;
  return window.localStorage.getItem('vllmcc.advancedMode') === 'true';
}

type NavItem = typeof pages[number];

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button className={active ? 'active' : ''} onClick={onClick}>
      <span className="row"><Icon size={16} /> {item.label}</span>
    </button>
  );
}

export function App() {
  const [page, setPage] = useState<Page>(() => initialPage());
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState(() => initialAdvancedMode(initialPage()));

  useEffect(() => {
    window.localStorage.setItem('vllmcc.advancedMode', advancedMode ? 'true' : 'false');
  }, [advancedMode]);

  const navigate = (nextPage: Page) => {
    setPage(nextPage);
    if (!isPrimaryPage(nextPage)) {
      setAdvancedMode(true);
    }
  };

  const supportIsActive = !isPrimaryPage(page);
  const showSupportTools = advancedMode || supportIsActive;

  const returnToDailyMode = () => {
    setAdvancedMode(false);
    setPage('server');
  };

  return (
    <div className="shell compact-shell">
      <aside className="sidebar">
        <h1>vLLM Control Center</h1>
        <p className="sidebar-caption">Local and remote vLLM server</p>
        <span className="sidebar-version-pill quiet" title="Current public beta version">{APP_VERSION_LABEL}</span>
        <div className={advancedMode ? 'mode-card advanced' : 'mode-card'}>
          <div>
            <strong>{advancedMode ? 'Advanced mode' : 'Daily mode'}</strong>
            <small>{advancedMode ? 'Debug tools are available.' : 'Everyday model actions only.'}</small>
          </div>
          <button className="mode-toggle" onClick={() => setAdvancedMode((value) => !value)}>
            <SlidersHorizontal size={14} /> {advancedMode ? 'Daily' : 'Advanced'}
          </button>
        </div>
        <nav className="nav">
          {primaryPages.map((item) => <NavButton key={item.id} item={item} active={page === item.id} onClick={() => navigate(item.id)} />)}
          {showSupportTools && (
            <details className="nav-group" open={supportIsActive || advancedMode}>
              <summary>Help & support</summary>
              {advancedPages.map((item) => <NavButton key={item.id} item={item} active={page === item.id} onClick={() => navigate(item.id)} />)}
              {advancedMode && (
                <button className="sidebar-soft-action" onClick={returnToDailyMode}>
                  Back to Daily mode
                </button>
              )}
            </details>
          )}
        </nav>
      </aside>
      <main className="main">
        {page === 'server' && <ServerPage onOpenLogs={(id) => { setSelectedInstanceId(id); navigate('logs'); }} onOpenMetrics={(id) => { setSelectedInstanceId(id); navigate('metrics'); }} onOpenPlayground={(id) => { setSelectedInstanceId(id); navigate('playground'); }} />}
        {page === 'models-library' && <ModelsLibraryPage onOpenRunModel={() => navigate('server')} onOpenLogs={(id) => { setSelectedInstanceId(id); navigate('logs'); }} onOpenPlayground={(id) => { setSelectedInstanceId(id); navigate('playground'); }} />}
        {page === 'dashboard' && <DashboardPage />}
        {page === 'model-hub' && <ModelHubPage />}
        {page === 'local-models' && <LocalModelsPage onOpenLogs={(id) => { setSelectedInstanceId(id); navigate('logs'); }} onOpenPlayground={(id) => { setSelectedInstanceId(id); navigate('playground'); }} />}
        {page === 'setup' && <SetupPage />}
        {page === 'instances' && <InstancesPage onSelectLogs={(id) => { setSelectedInstanceId(id); navigate('logs'); }} />}
        {page === 'models' && <ModelsPage />}
        {page === 'downloads' && <DownloadsPage onOpenLocalModels={() => navigate('local-models')} onOpenLogs={(id) => { setSelectedInstanceId(id); navigate('logs'); }} onOpenPlayground={(id) => { setSelectedInstanceId(id); navigate('playground'); }} />}
        {page === 'compatibility' && <CompatibilityPage />}
        {page === 'recipes' && <RecipesPage />}
        {page === 'history' && <ChatHistoryPage />}
        {page === 'remote' && <RemoteControllersPage />}
        {page === 'remote-instances' && <RemoteInstancesPage />}
        {page === 'remote-playground' && <RemotePlaygroundPage />}
        {page === 'logs' && <LogsPage instanceId={selectedInstanceId} />}
        {page === 'metrics' && <MetricsPage initialInstanceId={selectedInstanceId} />}
        {page === 'playground' && <PlaygroundPage initialInstanceId={selectedInstanceId} />}
        {page === 'exports' && <ExportsPage />}
        {page === 'settings' && <SettingsPage />}
        {page === 'release' && <ReleasePage />}
        {page === 'advanced-tools' && <AdvancedToolsPage onNavigate={(target) => navigate(target as Page)} />}
      </main>
    </div>
  );
}
