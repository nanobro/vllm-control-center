import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import { api, getControllerApiKey, SecretBackendInfo, setControllerApiKey } from '../api/client';

export function SettingsPage() {
  const [apiKey, setApiKey] = useState(getControllerApiKey());
  const [saved, setSaved] = useState(false);
  const [secretBackend, setSecretBackend] = useState<SecretBackendInfo | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    api.secretBackend()
      .then(setSecretBackend)
      .catch((err) => setBackendError(String(err)));
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    setControllerApiKey(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  const authEnabled = secretBackend?.controller_auth_enabled;
  const storageLabel = secretBackend ? `${secretBackend.name} (${secretBackend.status})` : 'checking...';

  return (
    <div className="stack settings-simple-page">
      <section className="card settings-hero-card">
        <p className="label">Settings</p>
        <h2>Keep the local controller connection simple.</h2>
        <p className="muted">
          Most users should not need to change anything here. Add a controller API key only when you started the backend
          with local auth enabled.
        </p>
      </section>

      <section className="card settings-workbench-card">
        <div className="row-between">
          <div>
            <p className="label">Connection</p>
            <h3><KeyRound size={18} /> Local controller API key</h3>
            <p className="muted">Optional for local development. Required only when <code>VCC_CONTROLLER_API_KEY</code> is set.</p>
          </div>
          <span className={authEnabled ? 'status warning' : 'status running'}>{authEnabled ? 'auth required' : 'local dev ready'}</span>
        </div>
        <form className="settings-key-form" onSubmit={submit}>
          <label>
            API key
            <input className="input" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="optional for local dev" />
          </label>
          <div className="row">
            <button className="btn">Save key</button>
            <button className="btn secondary" type="button" onClick={() => { setApiKey(''); setControllerApiKey(''); setSaved(true); }}>Clear</button>
            {saved && <span className="status"><CheckCircle2 size={13} /> saved</span>}
          </div>
        </form>
      </section>

      <section className="card settings-status-card">
        <div className="row-between">
          <div>
            <p className="label">Security status</p>
            <h3><ShieldCheck size={18} /> Safe local defaults</h3>
            <p className="muted">The default setup is local-first. Public exposure still requires auth, HTTPS, and firewall rules.</p>
          </div>
        </div>
        <div className="settings-summary-grid">
          <div><span>Secret storage</span><strong>{storageLabel}</strong></div>
          <div><span>Controller auth</span><strong>{authEnabled ? 'enabled' : 'off for localhost'}</strong></div>
          <div><span>Localhost bypass</span><strong>{secretBackend?.localhost_auth_bypass_enabled ? 'enabled' : 'disabled'}</strong></div>
        </div>
        {backendError && <p className="error">{backendError}</p>}
      </section>

      <details className="card settings-advanced-details">
        <summary>Advanced security details</summary>
        {!secretBackend && !backendError && <p>Loading secret backend status...</p>}
        {secretBackend && (
          <div className="stack">
            <p><strong>Active backend:</strong> {secretBackend.name} ({secretBackend.status})</p>
            <p>{secretBackend.message}</p>
            {secretBackend.install_hint && <p><strong>Install hint:</strong> <code>{secretBackend.install_hint}</code></p>}
            <ul>
              <li>Service name: <code>{secretBackend.service_name}</code></li>
              <li>OS keychain migration required: {secretBackend.migration_required ? 'yes' : 'no'}</li>
              <li>Controller auth enabled: {secretBackend.controller_auth_enabled ? 'yes' : 'no'}</li>
              <li>Localhost auth bypass enabled: {secretBackend.localhost_auth_bypass_enabled ? 'yes' : 'no'}</li>
            </ul>
            <ul>
              <li>Protected API calls use <code>Authorization: Bearer ...</code>.</li>
              <li>SSE endpoints use a query token because EventSource cannot send custom headers.</li>
              <li>Do not expose the controller publicly without HTTPS, auth, and firewall rules.</li>
            </ul>
          </div>
        )}
      </details>
    </div>
  );
}
