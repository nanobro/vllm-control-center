export const STATE_META: Record<string, { color: string; label: string; pulse?: boolean }> = {
  running:  { color: 'var(--ok)',     label: 'Running' },
  starting: { color: 'var(--warn)',   label: 'Starting', pulse: true },
  stopping: { color: 'var(--warn)',   label: 'Stopping', pulse: true },
  crashed:  { color: 'var(--danger)', label: 'Crashed' },
  blocked:  { color: 'var(--danger)', label: 'Blocked' },
  stopped:  { color: 'var(--idle)',   label: 'Stopped' },
};

export function StatusLamp({ state, detail }: { state: string; detail?: string }) {
  const meta = STATE_META[state] ?? STATE_META.stopped;
  return (
    <span className="status-lamp" style={{ '--lamp': meta.color } as React.CSSProperties}>
      <i className={meta.pulse ? 'dot pulse' : 'dot'} />
      <strong>{meta.label}</strong>
      {detail && <span className="lamp-detail">{detail}</span>}
    </span>
  );
}
