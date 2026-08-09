import { useEffect, useState } from 'react';
import { Cpu, Globe2, HardDrive, Megaphone, Settings, TerminalSquare, Wrench } from 'lucide-react';
import { SetupPage } from './SetupPage';
import { LogsPage } from './LogsPage';
import { MetricsPage } from './MetricsPage';
import { PlaygroundPage } from './PlaygroundPage';
import { RemoteControllersPage } from './RemoteControllersPage';
import { SettingsPage } from './SettingsPage';
import { ServerPage } from './ServerPage';
import { RecipeRunPage } from './RecipeRunPage';
import { ModelsLibraryPage } from './ModelsLibraryPage';
import { ReleasePage } from './ReleasePage';
import { AdvancedToolsPage } from './AdvancedToolsPage';
import { APP_VERSION_LABEL } from '../version';

const primaryPages = [
  { id: 'server', label: 'Run', icon: HardDrive },
  { id: 'models-library', label: 'Models', icon: HardDrive },
  { id: 'remote', label: 'Remote', icon: Globe2 },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

const advancedPages = [
  { id: 'setup', label: 'Setup check', icon: Cpu },
  { id: 'logs', label: 'Logs', icon: Cpu },
  { id: 'metrics', label: 'Metrics', icon: Cpu },
  { id: 'playground', label: 'Playground', icon: TerminalSquare },
  { id: 'release', label: 'Release kit', icon: Megaphone },
  { id: 'advanced-tools', label: 'More tools', icon: Wrench },
] as const;

const hiddenPages = [] as const;

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
    if (!isPrimaryPage(nextPage)) setAdvancedMode(true);
  };

  const supportIsActive = !isPrimaryPage(page);
  const showSupportTools = advancedMode || supportIsActive;

  const returnToDailyMode = () => {
    setAdvancedMode(false);
    setPage('server');
  };

  const openLogs = (id: string) => {
    setSelectedInstanceId(id);
    navigate('logs');
  };

  return (
    <div className="shell compact-shell">
      <aside className="sidebar">
        <div className="wordmark"><i className="wordmark-dot" /><span>vLLM Control Center</span></div>
        <p className="sidebar-caption">Local and remote vLLM server</p>
        <span className="sidebar-version-pill quiet" title="Current public beta version">{APP_VERSION_LABEL}</span>
        <div className={advancedMode ? 'mode-card advanced' : 'mode-card'}>
          <div>
            <strong>{advancedMode ? 'Advanced mode' : 'Daily mode'}</strong>
            <small>{advancedMode ? 'Debug tools are available.' : 'Everyday model actions only.'}</small>
          </div>
          <button className="mode-toggle" onClick={() => setAdvancedMode((value) => !value)}>
            <span className="mode-segment active">{advancedMode ? 'Daily' : 'Advanced'}</span>
          </button>
        </div>
        <nav className="nav">
          {primaryPages.map((item) => <NavButton key={item.id} item={item} active={page === item.id} onClick={() => navigate(item.id)} />)}
          {showSupportTools && (
            <details className="nav-group" open={supportIsActive || advancedMode}>
              <summary>Help & support</summary>
              {advancedPages.map((item) => <NavButton key={item.id} item={item} active={page === item.id} onClick={() => navigate(item.id)} />)}
              {advancedMode && <button className="sidebar-soft-action" onClick={returnToDailyMode}>Back to Daily mode</button>}
            </details>
          )}
        </nav>
      </aside>
      <main className="main">
        {page === 'server' && (advancedMode
          ? <ServerPage onOpenLogs={openLogs} onOpenMetrics={(id) => { setSelectedInstanceId(id); navigate('metrics'); }} onOpenPlayground={(id) => { setSelectedInstanceId(id); navigate('playground'); }} />
          : <RecipeRunPage onOpenAdvanced={() => setAdvancedMode(true)} onOpenLogs={openLogs} />)}
        {page === 'models-library' && <ModelsLibraryPage onOpenRunModel={() => navigate('server')} onOpenLogs={openLogs} />}
        {page === 'remote' && <RemoteControllersPage />}
        {page === 'settings' && <SettingsPage />}
        {page === 'setup' && <SetupPage />}
        {page === 'logs' && <LogsPage instanceId={selectedInstanceId} />}
        {page === 'metrics' && <MetricsPage initialInstanceId={selectedInstanceId} />}
        {page === 'playground' && <PlaygroundPage initialInstanceId={selectedInstanceId} />}
        {page === 'release' && <ReleasePage />}
        {page === 'advanced-tools' && <AdvancedToolsPage onNavigate={(target) => navigate(target as Page)} />}
      </main>
    </div>
  );
}
