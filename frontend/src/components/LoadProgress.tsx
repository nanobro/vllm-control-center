import { useEffect, useState } from 'react';

const PHASES = ['Queued', 'Loading weights', 'Compiling kernels', 'Warm-up', 'Ready'];
const BUDGET_SECONDS = 600; // 10 minutes

function useElapsed(startIso: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startIso) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startIso]);
  if (!startIso) return null;
  const s = Math.max(0, Math.floor((now - new Date(startIso).getTime()) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function LoadProgress({ startedAt, currentPhase }: { startedAt: string | null; currentPhase: number }) {
  const elapsed = useElapsed(startedAt);
  const phaseIndex = Math.min(currentPhase, PHASES.length - 1);
  const budgetPct = startedAt ? Math.min(100, (elapsed ? parseInt(elapsed.split(':')[0]) * 60 + parseInt(elapsed.split(':')[1]) : 0) / BUDGET_SECONDS * 100) : 0;

  return (
    <div className="load-progress">
      {startedAt && elapsed && (
        <>
          <div className="load-progress-header">
            <span className="mono load-elapsed">{elapsed}</span>
            <span className="muted" style={{ fontSize: '12px' }}>of 10:00 budget</span>
          </div>
          <div className="progress-track">
            <div className="progress-bar" style={{ width: `${budgetPct}%`, color: budgetPct > 85 ? 'var(--danger)' : undefined }} />
          </div>
        </>
      )}
      <ol className="phase-list">
        {PHASES.map((phase, i) => (
          <li key={phase} className={`phase-item ${i < phaseIndex ? 'done' : ''} ${i === phaseIndex ? 'current' : ''}`}>
            <span className="phase-icon">{i < phaseIndex ? '✓' : i === phaseIndex ? '●' : '○'}</span>
            <span>{phase}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
