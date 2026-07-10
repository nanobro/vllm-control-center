import { AlertTriangle, CheckCircle2, Clipboard, FileText, RefreshCw, Settings, Sparkles, XCircle } from 'lucide-react';
import { ErrorRecoveryAdvice, RecoveryAction } from '../api/client';

export type ErrorRecoveryCardProps = {
  advice?: ErrorRecoveryAdvice | null;
  loading?: boolean;
  title?: string;
  onOpenLogs?: () => void;
  onRetry?: () => void;
  onRefresh?: () => void;
  onOpenSettings?: () => void;
  onUseLowVram?: () => void;
  onCopy?: (text: string, label?: string) => void;
};

function severityIcon(severity?: string) {
  if (severity === 'critical') return <XCircle size={18} />;
  if (severity === 'warning') return <AlertTriangle size={18} />;
  if (severity === 'info') return <CheckCircle2 size={18} />;
  return <Sparkles size={18} />;
}

function buttonForAction(action: RecoveryAction, props: ErrorRecoveryCardProps) {
  const handle = () => {
    if (action.kind === 'copy' && action.copy_text) props.onCopy?.(action.copy_text, action.label);
    else if (action.kind === 'open_logs') props.onOpenLogs?.();
    else if (action.kind === 'retry') props.onRetry?.();
    else if (action.kind === 'refresh') props.onRefresh?.();
    else if (action.kind === 'open_settings') props.onOpenSettings?.();
    else if (action.kind === 'change_preset') props.onUseLowVram?.();
  };
  const disabled = (action.kind === 'copy' && !action.copy_text) ||
    (action.kind === 'open_logs' && !props.onOpenLogs) ||
    (action.kind === 'retry' && !props.onRetry) ||
    (action.kind === 'refresh' && !props.onRefresh) ||
    (action.kind === 'open_settings' && !props.onOpenSettings) ||
    (action.kind === 'change_preset' && !props.onUseLowVram);
  const Icon = action.kind === 'copy' ? Clipboard : action.kind === 'open_logs' ? FileText : action.kind === 'open_settings' || action.kind === 'change_preset' ? Settings : RefreshCw;
  return <button key={`${action.kind}-${action.label}`} className="btn secondary compact-btn" disabled={disabled} onClick={handle}><Icon size={13} /> {action.label}</button>;
}

export function ErrorRecoveryCard(props: ErrorRecoveryCardProps) {
  const { advice, loading, title } = props;
  if (loading) return <div className="error-recovery-card loading"><RefreshCw size={16} /> Checking the latest failure...</div>;
  if (!advice || advice.category === 'no_error') return null;

  return (
    <div className={`error-recovery-card ${advice.severity}`}>
      <div className="error-recovery-head">
        <div className="error-recovery-icon">{severityIcon(advice.severity)}</div>
        <div>
          <p className="label">{title ?? 'Recovery help'}</p>
          <h3>{advice.title}</h3>
          <p>{advice.summary}</p>
        </div>
      </div>
      <div className="error-recovery-body">
        <p><strong>Likely cause:</strong> {advice.likely_cause}</p>
        {advice.immediate_fixes.length > 0 && (
          <ul className="compact-list">
            {advice.immediate_fixes.slice(0, 5).map((fix) => <li key={fix}>{fix}</li>)}
          </ul>
        )}
        {advice.actions.length > 0 && (
          <div className="error-recovery-actions">
            {advice.actions.slice(0, 4).map((action) => buttonForAction(action, props))}
          </div>
        )}
        {advice.raw_excerpt && (
          <details className="error-recovery-details">
            <summary>Show matched log excerpt</summary>
            <pre>{advice.raw_excerpt}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
