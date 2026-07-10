const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8787';
const API_KEY_STORAGE_KEY = 'vcc.controllerApiKey';

export function getControllerApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE_KEY) ?? import.meta.env.VITE_VCC_API_KEY ?? '';
}

export function setControllerApiKey(value: string): void {
  if (value.trim()) localStorage.setItem(API_KEY_STORAGE_KEY, value.trim());
  else localStorage.removeItem(API_KEY_STORAGE_KEY);
}

function authHeaders(): Record<string, string> {
  const apiKey = getControllerApiKey();
  return apiKey ? { authorization: `Bearer ${apiKey}` } : {};
}

function withAuthQuery(url: string): string {
  const apiKey = getControllerApiKey();
  if (!apiKey) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}api_key=${encodeURIComponent(apiKey)}`;
}

export type DoctorReport = {
  python: CheckResult;
  vllm: CheckResult;
  nvidia: CheckResult;
  docker: CheckResult;
  hf_token?: CheckResult;
  gpus: GpuInfo[];
  warnings: string[];
};

export type CheckResult = { ok: boolean; message: string; version?: string | null; details?: Record<string, unknown> };
export type GpuInfo = { index: number; name: string; memory_total_mb?: number; memory_used_mb?: number; utilization_percent?: number; temperature_c?: number; memory_used_percent?: number | null };

export type VllmServeConfig = {
  model: string;
  host?: string;
  port?: number;
  api_key?: string | null;
  served_model_name?: string | null;
  dtype?: string;
  gpu_memory_utilization?: number;
  max_model_len?: number | null;
  kv_cache_memory_bytes?: string | null;
  tensor_parallel_size?: number | null;
  pipeline_parallel_size?: number | null;
  data_parallel_size?: number | null;
  device_ids?: number[] | null;
  trust_remote_code?: boolean;
  enable_auto_tool_choice?: boolean;
  tool_call_parser?: string | null;
  reasoning_parser?: string | null;
  extra_args?: string[];
};

export type InstanceRecord = {
  id: string;
  name: string;
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'crashed';
  host: string;
  port: number;
  config: VllmServeConfig;
  pid?: number | null;
  started_at?: string | null;
  stopped_at?: string | null;
  last_error?: string | null;
  created_at: string;
  updated_at: string;
};

export type CommandPreview = {
  argv: string[];
  redacted_command: string;
  yaml_config: string;
  docker_command: string;
  docker_compose: string;
};

export type LogLine = { id: number; instance_id: string; stream: string; line: string; created_at: string };

export type MetricsAlert = { severity: 'info' | 'warning' | 'critical' | string; title: string; message: string };

export type MetricsSummary = {
  instance_id: string;
  available: boolean;
  error?: string | null;
  kv_cache_usage_perc?: number | null;
  requests_running?: number | null;
  requests_waiting?: number | null;
  prompt_tokens_total?: number | null;
  generation_tokens_total?: number | null;
  request_success_total?: number | null;
  e2e_latency_avg_ms?: number | null;
  inter_token_latency_avg_ms?: number | null;
  prompt_tokens_per_sec?: number | null;
  generation_tokens_per_sec?: number | null;
  raw_metrics_count: number;
  gpus: GpuInfo[];
  alerts: MetricsAlert[];
};

export type MetricsHistoryPoint = {
  created_at: string;
  available: boolean;
  kv_cache_usage_perc?: number | null;
  requests_running?: number | null;
  requests_waiting?: number | null;
  prompt_tokens_total?: number | null;
  generation_tokens_total?: number | null;
  prompt_tokens_per_sec?: number | null;
  generation_tokens_per_sec?: number | null;
  e2e_latency_avg_ms?: number | null;
  inter_token_latency_avg_ms?: number | null;
};
export type MetricsHistoryResponse = { instance_id: string; points: MetricsHistoryPoint[] };

export type PlaygroundResponse = { ok: boolean; status_code: number; latency_ms: number; response?: any; error?: string | null; error_type?: string | null; user_message?: string | null; next_actions?: string[]; served_model_names?: string[]; suggested_model_name?: string | null };
export type StreamErrorPayload = { error?: string; status_code?: number; error_type?: string; user_message?: string; next_actions?: string[]; served_model_names?: string[]; suggested_model_name?: string | null };


export type ExportBundle = {
  yaml_config: string;
  docker_command: string;
  docker_compose: string;
  curl_chat: string;
  python_openai: string;
  typescript_openai: string;
  openwebui: string;
};


export type LocalModelRecord = {
  id: string;
  model_id: string;
  display_name: string;
  source: string;
  local_path?: string | null;
  size_bytes?: number | null;
  size_label?: string | null;
  tags: string[];
  format?: string | null;
  quantization?: string | null;
  architecture?: string | null;
  context_length?: number | null;
  parameter_count_b?: number | null;
  variant_count?: number | null;
  file_count?: number | null;
  weight_file_count?: number | null;
  is_multi_file?: boolean;
  config_present?: boolean;
  tokenizer_present?: boolean | null;
  dtype_hint?: string | null;
  compatibility_status?: 'ready' | 'likely' | 'limited' | 'attention' | 'unknown' | string;
  compatibility_label?: string | null;
  compatibility_reasons?: string[];
  suggested_load_format?: string | null;
  metadata_warnings?: string[];
  registered_model_id?: string | null;
  download_job_id?: string | null;
  download_status?: string | null;
  active_instance_id?: string | null;
  active_status?: string | null;
  active_last_error?: string | null;
  matching_instance_ids?: string[];
  running_instance_ids?: string[];
  stopped_instance_ids?: string[];
  loaded_instance_count?: number;
  configured_instance_count?: number;
  last_modified?: string | null;
  group_id?: string | null;
  group_name?: string | null;
  variant_label?: string | null;
  variant_rank?: number;
  sibling_variant_count?: number;
  notes?: string | null;
};
export type LocalModelScanRoot = { path: string; source: string; exists: boolean; model_count: number; warnings: string[] };
export type LocalModelScanRootsSummary = { roots: LocalModelScanRoot[]; user_paths: string[]; warnings: string[] };
export type LocalModelVariantGroup = { id: string; name: string; model_id: string; display_name: string; variants: LocalModelRecord[]; preferred_variant_id?: string | null; loaded_variant_id?: string | null; loaded_instance_count: number; configured_instance_count: number; total_size_bytes?: number | null; total_size_label?: string | null; sources: string[]; formats: string[]; quantizations: string[]; local_paths: string[] };
export type LocalModelsSummary = { models: LocalModelRecord[]; groups?: LocalModelVariantGroup[]; loaded_instance_ids: string[]; scanned_paths: string[]; warnings: string[]; scan_roots?: LocalModelScanRoot[] };
export type LoadLocalModelResponse = { instance_id: string; instance_name: string; loaded: boolean; start_requested?: boolean; start_error?: string | null; config: VllmServeConfig; instance: InstanceRecord; reused_existing?: boolean; action?: string; message?: string | null; applied_preset?: string | null };

export type ModelRecord = { id: string; source: string; model_id: string; local_path?: string | null; display_name: string; context_length?: number | null; dtype_hint?: string | null; tags: string[]; notes?: string | null; created_at: string; updated_at: string };
export type RecipeRecord = { id: string; name: string; description?: string | null; preset_type: string; config: VllmServeConfig; created_by: string; created_at: string; updated_at: string };
export type ChatSessionRecord = { id: string; title: string; instance_id?: string | null; model?: string | null; sampling: Record<string, unknown>; created_at: string; updated_at: string };
export type ChatMessageRecord = { id: string; session_id: string; role: string; content: string; raw?: Record<string, unknown> | null; created_at: string };

export type RemoteControllerProfile = {
  id: string;
  name: string;
  base_url: string;
  api_key_configured: boolean;
  notes?: string | null;
  is_default: boolean;
  last_status?: string | null;
  last_latency_ms?: number | null;
  last_error?: string | null;
  created_at: string;
  updated_at: string;
};
export type RemoteProbeResult = { ok: boolean; status_code?: number | null; latency_ms?: number | null; health?: Record<string, unknown> | null; doctor?: DoctorReport | null; error?: string | null };


export type RecoveryAction = {
  label: string;
  description: string;
  kind: 'copy' | 'open_logs' | 'open_settings' | 'retry' | 'change_preset' | 'refresh' | 'none' | string;
  copy_text?: string | null;
};

export type ErrorRecoveryAdvice = {
  category: string;
  severity: 'info' | 'warning' | 'critical' | string;
  title: string;
  summary: string;
  likely_cause: string;
  immediate_fixes: string[];
  actions: RecoveryAction[];
  raw_excerpt?: string | null;
};

export type DownloadJobRecord = {
  id: string;
  model_id: string;
  revision?: string | null;
  local_dir?: string | null;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  register_model: boolean;
  dry_run: boolean;
  allow_patterns?: string[];
  downloaded_bytes?: number | null;
  total_bytes?: number | null;
  current_file?: string | null;
  message?: string | null;
  error?: string | null;
  registered_model_id?: string | null;
  created_at: string;
  updated_at: string;
  started_at?: string | null;
  completed_at?: string | null;
};


export type CompatibilityResponse = {
  verdict: 'likely_fits' | 'borderline' | 'unlikely' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  estimate: {
    model_weights_mb?: number | null;
    kv_cache_mb?: number | null;
    overhead_mb?: number | null;
    safety_margin_mb?: number | null;
    estimated_required_mb?: number | null;
    usable_gpu_memory_mb?: number | null;
    memory_gap_mb?: number | null;
  };
  assumptions: string[];
  warnings: string[];
  recommendations: { title: string; description: string; config_patch: Record<string, unknown>; vllm_args?: string[] }[];
  suggested_vllm_settings: Record<string, unknown>;
  copyable_vllm_args: string[];
  architecture_used: Record<string, unknown>;
};

export type CompatibilityRequest = {
  model_id: string;
  parameter_count_b?: number | null;
  architecture?: string;
  dtype?: string;
  quantization_bits?: number | null;
  cache_dtype?: string;
  max_model_len?: number;
  expected_concurrency?: number;
  gpu_memory_total_mb?: number | null;
  gpu_memory_free_mb?: number | null;
  gpu_memory_utilization?: number;
  tensor_parallel_size?: number;
  hidden_size?: number | null;
  num_layers?: number | null;
  num_attention_heads?: number | null;
  num_kv_heads?: number | null;
  head_dim?: number | null;
};


export type HfModelVariant = {
  id: string;
  model_id: string;
  filename: string;
  path: string;
  format: string;
  quantization?: string | null;
  size_bytes?: number | null;
  size_label?: string | null;
  recommended: boolean;
  notes?: string | null;
  allow_patterns: string[];
  extra_args: string[];
};

export type HfModelVariantsResponse = {
  model_id: string;
  revision?: string | null;
  hf_token_env?: string | null;
  online: boolean;
  error?: string | null;
  variants: HfModelVariant[];
};

export type CatalogModelRecord = {
  id: string;
  source?: 'builtin' | 'huggingface' | string;
  model_id: string;
  display_name: string;
  description: string;
  tags: string[];
  size_label?: string | null;
  parameter_count_b?: number | null;
  default_dtype: string;
  suggested_max_model_len?: number | null;
  suggested_gpu_memory_utilization: number;
  gated: boolean;
  trust_remote_code: boolean;
  notes?: string | null;
  downloads?: number | null;
  likes?: number | null;
  pipeline_tag?: string | null;
  last_modified?: string | null;
  trending_score?: number | null;
};

export type ModelHubSummary = {
  catalog: CatalogModelRecord[];
  registered_model_ids: string[];
  running_model_ids: string[];
  active_download_model_ids: string[];
};

export type HfCatalogSearchResponse = ModelHubSummary & {
  query: string;
  hf_token_env?: string | null;
  online: boolean;
  error?: string | null;
  mode?: string;
  task?: string | null;
  author?: string | null;
  filters?: string[];
};

export type QuickLaunchResponse = {
  instance_id: string;
  instance_name: string;
  started: boolean;
  start_requested?: boolean;
  start_error?: string | null;
  message?: string | null;
  config: VllmServeConfig;
  reused_existing?: boolean;
  action?: string;
};

export type RemotePlaygroundBody = { messages: { role: string; content: string }[]; temperature?: number; top_p?: number; max_tokens?: number; model_override?: string | null; extra_body?: Record<string, unknown>; session_id?: string | null };


export type ServerQaCheck = { id: string; title: string; status: 'ok' | 'info' | 'warning' | 'critical' | string; message: string; action?: string | null };
export type ServerQaSummary = {
  ready_to_load: boolean;
  checks: ServerQaCheck[];
  active_downloads: number;
  completed_downloads: number;
  local_model_count: number;
  running_instances: number;
  stopped_instances: number;
  scanned_paths: string[];
};

export type SecretBackendInfo = {
  name: string;
  status: string;
  active: boolean;
  available: boolean;
  service_name: string;
  message: string;
  install_hint?: string | null;
  migration_required: boolean;
  controller_auth_enabled: boolean;
  localhost_auth_bypass_enabled: boolean;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...authHeaders(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}


export async function streamChat(
  body: { instance_id: string; messages: { role: string; content: string }[]; temperature?: number; top_p?: number; max_tokens?: number; model_override?: string | null; session_id?: string | null },
  handlers: { onToken?: (text: string, raw: unknown) => void; onDone?: (latencyMs?: number) => void; onError?: (message: string, payload?: StreamErrorPayload) => void | Promise<void> },
  options?: { signal?: AbortSignal; totalTimeoutMs?: number; firstTokenTimeoutMs?: number; inactivityTimeoutMs?: number },
): Promise<void> {
  const controller = new AbortController();
  const totalTimeoutMs = options?.totalTimeoutMs ?? 180000;
  const firstTokenTimeoutMs = options?.firstTokenTimeoutMs ?? 45000;
  const inactivityTimeoutMs = options?.inactivityTimeoutMs ?? 60000;
  type StreamAbortReason = 'total_timeout' | 'first_token_timeout' | 'inactivity_timeout' | 'cancelled';
  const abortState: { reason: StreamAbortReason } = { reason: 'total_timeout' };
  let firstTokenSeen = false;
  let firstTokenTimeoutId: number | undefined;
  let inactivityTimeoutId: number | undefined;

  const abortWithReason = (reason: StreamAbortReason) => {
    abortState.reason = reason;
    controller.abort();
  };
  const clearInactivityTimer = () => {
    if (inactivityTimeoutId !== undefined) window.clearTimeout(inactivityTimeoutId);
    inactivityTimeoutId = undefined;
  };
  const refreshInactivityTimer = () => {
    clearInactivityTimer();
    inactivityTimeoutId = window.setTimeout(() => abortWithReason('inactivity_timeout'), inactivityTimeoutMs);
  };

  const totalTimeoutId = window.setTimeout(() => abortWithReason('total_timeout'), totalTimeoutMs);
  firstTokenTimeoutId = window.setTimeout(() => abortWithReason('first_token_timeout'), firstTokenTimeoutMs);
  options?.signal?.addEventListener('abort', () => abortWithReason('cancelled'), { once: true });

  try {
    const res = await fetch(`${API_BASE}/api/playground/chat/stream`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) throw new Error(await res.text());
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const eventText of events) {
        const lines = eventText.split('\n');
        const event = lines.find((line) => line.startsWith('event:'))?.slice(6).trim() ?? 'message';
        const dataLine = lines.find((line) => line.startsWith('data:'));
        if (!dataLine) continue;
        const data = JSON.parse(dataLine.slice(5).trim());
        if (event === 'token') {
          firstTokenSeen = true;
          if (firstTokenTimeoutId !== undefined) window.clearTimeout(firstTokenTimeoutId);
          refreshInactivityTimer();
          handlers.onToken?.(data.delta ?? '', data.raw);
        }
        if (event === 'done') {
          handlers.onDone?.(data.latency_ms);
        }
        if (event === 'error') {
          await handlers.onError?.(data.user_message ?? data.error ?? JSON.stringify(data), data);
        }
      }
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      if (abortState.reason === 'cancelled') {
        await handlers.onError?.('Streaming test stopped.', {
          error_type: 'stream_cancelled',
          user_message: 'Streaming test stopped.',
          next_actions: ['Try again when ready', 'Use non-streaming test if streaming keeps hanging'],
        });
        return;
      }
      const firstTokenMessage = 'The streaming test did not receive any tokens in time. The model may still be loading, stuck on the first generation, or serving a name mismatch.';
      const inactivityMessage = 'The streaming test started but stopped receiving tokens. The model may be overloaded or the connection may be stalled.';
      const totalMessage = 'The streaming test waited too long without finishing. The model may still be warming up or the endpoint may be stuck.';
      const message = abortState.reason === 'first_token_timeout' && !firstTokenSeen ? firstTokenMessage : abortState.reason === 'inactivity_timeout' ? inactivityMessage : totalMessage;
      await handlers.onError?.(message, {
        error_type: abortState.reason === 'first_token_timeout' && !firstTokenSeen ? 'stream_first_token_timeout' : abortState.reason === 'inactivity_timeout' ? 'stream_inactivity_timeout' : 'stream_timeout',
        user_message: message,
        next_actions: ['Try non-streaming test', 'Open logs', 'Restart this model if it stays stuck'],
      });
      return;
    }
    throw error;
  } finally {
    window.clearTimeout(totalTimeoutId);
    if (firstTokenTimeoutId !== undefined) window.clearTimeout(firstTokenTimeoutId);
    clearInactivityTimer();
  }
}


export async function streamRemoteChat(
  profileId: string,
  instanceId: string,
  body: RemotePlaygroundBody,
  handlers: { onToken?: (text: string, raw: unknown) => void; onDone?: (latencyMs?: number) => void; onError?: (message: string, payload?: StreamErrorPayload) => void },
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/remote-profiles/${profileId}/instances/${instanceId}/playground/chat/stream`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error(await res.text());
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';
    for (const eventText of events) {
      const lines = eventText.split('\n');
      const event = lines.find((line) => line.startsWith('event:'))?.slice(6).trim() ?? 'message';
      const dataLine = lines.find((line) => line.startsWith('data:'));
      if (!dataLine) continue;
      const data = JSON.parse(dataLine.slice(5).trim());
      if (event === 'token') handlers.onToken?.(data.delta ?? '', data.raw);
      if (event === 'done') handlers.onDone?.(data.latency_ms);
      if (event === 'error') handlers.onError?.(data.user_message ?? data.error ?? JSON.stringify(data), data);
    }
  }
}

export function openLogStream(instanceId: string, onLog: (line: LogLine) => void): EventSource {
  const source = new EventSource(withAuthQuery(`${API_BASE}/api/instances/${instanceId}/logs/stream`));
  source.addEventListener('log', (event) => onLog(JSON.parse((event as MessageEvent).data)));
  return source;
}



export function openRemoteLogStream(profileId: string, instanceId: string, onLog: (line: LogLine) => void): EventSource {
  const source = new EventSource(withAuthQuery(`${API_BASE}/api/remote-profiles/${profileId}/instances/${instanceId}/logs/stream`));
  source.addEventListener('log', (event) => onLog(JSON.parse((event as MessageEvent).data)));
  return source;
}


export function openDownloadsStream(onJobs: (jobs: DownloadJobRecord[]) => void): EventSource {
  const source = new EventSource(withAuthQuery(`${API_BASE}/api/downloads/stream`));
  source.addEventListener('downloads', (event) => {
    const payload = JSON.parse((event as MessageEvent).data);
    if (Array.isArray(payload.jobs)) onJobs(payload.jobs);
  });
  return source;
}

export const api = {
  health: () => request<{ ok: boolean; service: string }>('/api/health'),
  secretBackend: () => request<SecretBackendInfo>('/api/security/secret-backend'),

  estimateCompatibility: (body: CompatibilityRequest) => request<CompatibilityResponse>('/api/compatibility/estimate', { method: 'POST', body: JSON.stringify(body) }),
  createCompatibilityRecipe: (body: { name: string; model_id: string; dtype?: string; max_model_len?: number | null; gpu_memory_utilization?: number; tensor_parallel_size?: number | null; quantization_bits?: number | null; cache_dtype?: string; extra_args?: string[] }) => request<RecipeRecord>('/api/compatibility/recipe', { method: 'POST', body: JSON.stringify(body) }),
  doctor: () => request<DoctorReport>('/api/system/doctor'),
  portAvailable: (port: number) => request<{ port: number; available: boolean }>(`/api/system/ports/${port}`),
  serverQa: () => request<ServerQaSummary>('/api/server/qa'),

  localModels: () => request<LocalModelsSummary>('/api/local-models'),
  localModelScanRoots: () => request<LocalModelScanRootsSummary>('/api/local-models/scan-roots'),
  addLocalModelScanRoot: (path: string) => request<LocalModelScanRootsSummary>('/api/local-models/scan-roots', { method: 'POST', body: JSON.stringify({ path }) }),
  removeLocalModelScanRoot: (path: string) => request<LocalModelScanRootsSummary>(`/api/local-models/scan-roots?path=${encodeURIComponent(path)}`, { method: 'DELETE' }),
  loadLocalModel: (body: { model_id: string; local_path?: string | null; name?: string | null; host?: string; port?: number; api_key?: string | null; served_model_name?: string | null; dtype?: string; gpu_memory_utilization?: number; max_model_len?: number | null; kv_cache_memory_bytes?: string | null; tensor_parallel_size?: number | null; pipeline_parallel_size?: number | null; trust_remote_code?: boolean; enable_auto_tool_choice?: boolean; tool_call_parser?: string | null; reasoning_parser?: string | null; extra_args?: string[]; start?: boolean; reuse_existing?: boolean; force_new?: boolean; load_preset?: 'balanced' | 'low_vram' }) => request<LoadLocalModelResponse>('/api/local-models/load', { method: 'POST', body: JSON.stringify(body) }),
  unloadLocalModel: (instanceId: string) => request<{ ok: boolean; unloaded: boolean }>(`/api/local-models/${instanceId}/unload`, { method: 'POST' }),
  instances: () => request<InstanceRecord[]>('/api/instances'),
  createInstance: (body: { name: string; config: VllmServeConfig }) => request<InstanceRecord>('/api/instances', { method: 'POST', body: JSON.stringify(body) }),
  command: (id: string) => request<CommandPreview>(`/api/instances/${id}/command`),
  start: (id: string) => request<{ ok: boolean }>(`/api/instances/${id}/start`, { method: 'POST' }),
  stop: (id: string) => request<{ ok: boolean }>(`/api/instances/${id}/stop`, { method: 'POST' }),
  deleteInstance: (id: string) => request<{ ok: boolean; deleted: boolean }>(`/api/instances/${id}`, { method: 'DELETE' }),
  logs: (id: string, tail = 200) => request<LogLine[]>(`/api/instances/${id}/logs?tail=${tail}`),
  instanceRecovery: (id: string) => request<ErrorRecoveryAdvice>(`/api/instances/${id}/recovery`),
  metrics: (id: string) => request<MetricsSummary>(`/api/instances/${id}/metrics`),
  metricsHistory: (id: string, limit = 60) => request<MetricsHistoryResponse>(`/api/instances/${id}/metrics/history?limit=${limit}`),
  chat: (body: { instance_id: string; messages: { role: string; content: string }[]; temperature?: number; top_p?: number; max_tokens?: number; model_override?: string | null }) =>
    request<PlaygroundResponse>('/api/playground/chat', { method: 'POST', body: JSON.stringify(body) }),
  exportBundle: (id: string) => request<ExportBundle>(`/api/exports/${id}`),
  downloads: () => request<DownloadJobRecord[]>('/api/downloads'),
  createDownload: (body: { model_id: string; revision?: string | null; local_dir?: string | null; register_model?: boolean; dry_run?: boolean; hf_token?: string | null; hf_token_env?: string | null; allow_patterns?: string[] }) => request<DownloadJobRecord>('/api/downloads', { method: 'POST', body: JSON.stringify(body) }),
  download: (id: string) => request<DownloadJobRecord>(`/api/downloads/${id}`),
  cancelDownload: (id: string) => request<{ ok: boolean; status: string; message: string }>(`/api/downloads/${id}/cancel`, { method: 'POST' }),
  retryDownload: (id: string, body?: { dry_run?: boolean | null; hf_token?: string | null; hf_token_env?: string | null }) => request<{ ok: boolean; job: DownloadJobRecord }>(`/api/downloads/${id}/retry`, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  deleteDownload: (id: string) => request<{ ok: boolean; deleted: boolean; message: string }>(`/api/downloads/${id}`, { method: 'DELETE' }),
  downloadRecovery: (id: string) => request<ErrorRecoveryAdvice>(`/api/downloads/${id}/recovery`),
  reconcileDownloads: () => request<{ ok: boolean; reconciled: number; message: string }>('/api/downloads/reconcile', { method: 'POST' }),

  modelHubCatalog: (query = '', tag = '') => request<ModelHubSummary>(`/api/model-hub/catalog?query=${encodeURIComponent(query)}&tag=${encodeURIComponent(tag)}`),
  hfCatalogSearch: (query = '', limit = 20, hfTokenEnv = 'HF_TOKEN', mode = 'trending', task = 'llm', author = '') => request<HfCatalogSearchResponse>(`/api/model-hub/hf/search?query=${encodeURIComponent(query)}&limit=${limit}&hf_token_env=${encodeURIComponent(hfTokenEnv)}&mode=${encodeURIComponent(mode)}&task=${encodeURIComponent(task)}&author=${encodeURIComponent(author)}`),
  hfCatalogVariants: (modelId: string, revision = 'main', hfTokenEnv = 'HF_TOKEN') => request<HfModelVariantsResponse>(`/api/model-hub/hf/variants?model_id=${encodeURIComponent(modelId)}&revision=${encodeURIComponent(revision)}&hf_token_env=${encodeURIComponent(hfTokenEnv)}`),
  registerCatalogModel: (catalogId: string, body?: { local_path?: string | null }) => request<ModelRecord>(`/api/model-hub/catalog/${catalogId}/register`, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  registerHfModel: (body: { model_id: string; display_name?: string | null; tags?: string[]; local_path?: string | null }) => request<ModelRecord>('/api/model-hub/hf/register', { method: 'POST', body: JSON.stringify(body) }),
  downloadCatalogModel: (catalogId: string, body: { dry_run?: boolean; register_model?: boolean; local_dir?: string | null; revision?: string | null; hf_token_env?: string | null; variant_path?: string | null; variant_format?: string | null; quantization?: string | null; allow_patterns?: string[] }) => request<DownloadJobRecord>(`/api/model-hub/catalog/${catalogId}/download`, { method: 'POST', body: JSON.stringify(body) }),
  downloadHfModel: (body: { model_id: string; display_name?: string | null; tags?: string[]; dry_run?: boolean; register_model?: boolean; local_dir?: string | null; revision?: string | null; hf_token_env?: string | null; variant_path?: string | null; variant_format?: string | null; quantization?: string | null; allow_patterns?: string[] }) => request<DownloadJobRecord>('/api/model-hub/hf/download', { method: 'POST', body: JSON.stringify(body) }),
  quickLaunchCatalogModel: (catalogId: string, body: { name?: string | null; host?: string; port?: number; api_key?: string | null; served_model_name?: string | null; dtype?: string; gpu_memory_utilization?: number | null; max_model_len?: number | null; kv_cache_memory_bytes?: string | null; tensor_parallel_size?: number | null; pipeline_parallel_size?: number | null; trust_remote_code?: boolean | null; enable_auto_tool_choice?: boolean | null; tool_call_parser?: string | null; reasoning_parser?: string | null; extra_args?: string[]; start?: boolean; reuse_existing?: boolean; force_new?: boolean }) => request<QuickLaunchResponse>(`/api/model-hub/catalog/${catalogId}/quick-launch`, { method: 'POST', body: JSON.stringify(body) }),
  quickLaunchHfModel: (body: { model_id: string; display_name?: string | null; tags?: string[]; name?: string | null; host?: string; port?: number; api_key?: string | null; served_model_name?: string | null; dtype?: string; gpu_memory_utilization?: number | null; max_model_len?: number | null; kv_cache_memory_bytes?: string | null; tensor_parallel_size?: number | null; pipeline_parallel_size?: number | null; trust_remote_code?: boolean | null; enable_auto_tool_choice?: boolean | null; tool_call_parser?: string | null; reasoning_parser?: string | null; extra_args?: string[]; start?: boolean; reuse_existing?: boolean; force_new?: boolean; variant_path?: string | null; variant_format?: string | null; quantization?: string | null; allow_patterns?: string[] }) => request<QuickLaunchResponse>('/api/model-hub/hf/quick-launch', { method: 'POST', body: JSON.stringify(body) }),
  models: () => request<ModelRecord[]>('/api/models'),
  createModel: (body: { model_id: string; display_name?: string; tags?: string[]; notes?: string }) => request<ModelRecord>('/api/models', { method: 'POST', body: JSON.stringify(body) }),
  recipes: () => request<RecipeRecord[]>('/api/recipes'),
  createRecipe: (body: { name: string; description?: string; preset_type?: string; config: VllmServeConfig }) => request<RecipeRecord>('/api/recipes', { method: 'POST', body: JSON.stringify(body) }),
  createInstanceFromRecipe: (id: string) => request<InstanceRecord>(`/api/recipes/${id}/create-instance`, { method: 'POST' }),
  chatSessions: () => request<ChatSessionRecord[]>('/api/chat/sessions'),
  createChatSession: (body: { title: string; instance_id?: string | null; model?: string | null; sampling?: Record<string, unknown> }) => request<ChatSessionRecord>('/api/chat/sessions', { method: 'POST', body: JSON.stringify(body) }),
  chatMessages: (sessionId: string) => request<ChatMessageRecord[]>(`/api/chat/sessions/${sessionId}/messages`),
  remoteProfiles: () => request<RemoteControllerProfile[]>('/api/remote-profiles'),
  createRemoteProfile: (body: { name: string; base_url: string; api_key?: string | null; notes?: string | null; is_default?: boolean }) => request<RemoteControllerProfile>('/api/remote-profiles', { method: 'POST', body: JSON.stringify(body) }),
  updateRemoteProfile: (id: string, body: { name?: string; base_url?: string; api_key?: string | null; clear_api_key?: boolean; notes?: string | null; is_default?: boolean }) => request<RemoteControllerProfile>(`/api/remote-profiles/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteRemoteProfile: (id: string) => request<{ ok: boolean }>(`/api/remote-profiles/${id}`, { method: 'DELETE' }),
  setDefaultRemoteProfile: (id: string) => request<RemoteControllerProfile>(`/api/remote-profiles/${id}/set-default`, { method: 'POST' }),
  probeRemoteProfile: (id: string) => request<RemoteProbeResult>(`/api/remote-profiles/${id}/probe`, { method: 'POST' }),
  forwardRemote: (id: string, body: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; path: string; body?: Record<string, unknown> | null }) => request<unknown>(`/api/remote-profiles/${id}/forward`, { method: 'POST', body: JSON.stringify(body) }),

  remoteInstances: (profileId: string) => request<InstanceRecord[]>(`/api/remote-profiles/${profileId}/instances`),
  remoteInstance: (profileId: string, instanceId: string) => request<InstanceRecord>(`/api/remote-profiles/${profileId}/instances/${instanceId}`),
  remoteInstanceCommand: (profileId: string, instanceId: string) => request<CommandPreview>(`/api/remote-profiles/${profileId}/instances/${instanceId}/command`),
  startRemoteInstance: (profileId: string, instanceId: string) => request<{ ok: boolean }>(`/api/remote-profiles/${profileId}/instances/${instanceId}/start`, { method: 'POST' }),
  stopRemoteInstance: (profileId: string, instanceId: string) => request<{ ok: boolean }>(`/api/remote-profiles/${profileId}/instances/${instanceId}/stop`, { method: 'POST' }),
  restartRemoteInstance: (profileId: string, instanceId: string) => request<{ ok: boolean }>(`/api/remote-profiles/${profileId}/instances/${instanceId}/restart`, { method: 'POST' }),
  remoteInstanceLogs: (profileId: string, instanceId: string, tail = 200) => request<LogLine[]>(`/api/remote-profiles/${profileId}/instances/${instanceId}/logs?tail=${tail}`),
  remoteInstanceMetrics: (profileId: string, instanceId: string) => request<MetricsSummary>(`/api/remote-profiles/${profileId}/instances/${instanceId}/metrics`),
  remoteChat: (profileId: string, instanceId: string, body: RemotePlaygroundBody) => request<PlaygroundResponse>(`/api/remote-profiles/${profileId}/instances/${instanceId}/playground/chat`, { method: 'POST', body: JSON.stringify(body) }),

};
