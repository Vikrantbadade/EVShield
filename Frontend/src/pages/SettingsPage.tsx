import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { StatusChip } from '../components/ui/StatusChip';
import { ApiConnectionBanner } from '../components/ui/ApiConnectionBanner';
import { mlService, MLModelStatus } from '../services/mlService';
import { healthService, HealthCheckStatus } from '../services/healthService';
import { useSecurity } from '../context/SecurityContext';
import {
  Brain, Shield, Server, Play, Square,
  Monitor, RefreshCw, Info, CheckCircle2, XCircle,
  Gauge, FlaskConical, Globe, Key, Database,
} from 'lucide-react';
import { incidentService, ThreatIntelConfig } from '../services/incidentService';
import { ThreatIntelResult } from '../types/incident';

/* ─── Small toggle component ─────────────────────────────── */
const Toggle: React.FC<{
  on: boolean;
  onChange: (v: boolean) => void;
  id: string;
  label: string;
  description?: string;
}> = ({ on, onChange, id, label, description }) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <div className="flex-1 min-w-0">
      <label htmlFor={id} className="text-sm font-semibold text-[#F5F3FF] cursor-pointer">{label}</label>
      {description && <p className="text-xs text-[#9896B0] mt-0.5 leading-relaxed">{description}</p>}
    </div>
    <button
      id={id}
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="settings-toggle"
      data-on={String(on)}
    >
      <span className="settings-toggle-thumb" />
    </button>
  </div>
);

/* ─── Section wrapper ─────────────────────────────────────── */
const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
  icon, title, children,
}) => (
  <div className="glass-settings-section space-y-1">
    <div className="flex items-center gap-3 pb-4 mb-2 border-b border-[#C4B5FD]/16">
      <div className="w-9 h-9 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 flex items-center justify-center text-[#9B7BFF] shrink-0">
        {icon}
      </div>
      <h3 className="text-base font-bold text-[#F5F3FF]">{title}</h3>
    </div>
    <div className="divide-y divide-[#C4B5FD]/10">{children}</div>
  </div>
);

/* ─── Read-only info row ──────────────────────────────────── */
const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <span className="text-xs font-mono font-semibold text-[#9896B0] uppercase tracking-wide">{label}</span>
    <span className="text-sm font-semibold text-[#F5F3FF] font-mono text-right">{value}</span>
  </div>
);

/* ─── Select row ─────────────────────────────────────────── */
const SelectRow: React.FC<{
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}> = ({ label, description, value, onChange, options }) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-[#F5F3FF]">{label}</p>
      {description && <p className="text-xs text-[#9896B0] mt-0.5">{description}</p>}
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-xl bg-[#252542] border border-[#C4B5FD]/25 text-xs font-mono text-[#F5F3FF] focus:outline-none focus:border-[#9B7BFF] shadow-sm cursor-pointer shrink-0"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

/* ─── Status indicator ───────────────────────────────────── */
const StatusDot: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <div className="flex items-center gap-2">
    {ok
      ? <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
      : <XCircle className="w-4 h-4 text-[#FB7185]" />
    }
    <span className={`text-sm font-semibold ${ok ? 'text-[#34D399]' : 'text-[#FB7185]'}`}>{label}</span>
  </div>
);

/* ─── Settings Page ──────────────────────────────────────── */
export const SettingsPage: React.FC = () => {
  const { isAttackMode, toggleDDoSAttack } = useSecurity();
  const [activeTab, setActiveTab] = useState<'preferences' | 'system' | 'threat-intel'>('preferences');

  /* Live system status */
  const [mlStatus, setMlStatus] = useState<MLModelStatus | null>(null);
  const [health, setHealth] = useState<HealthCheckStatus | null>(null);
  const [isLoadingSystem, setIsLoadingSystem] = useState(true);
  const [systemError, setSystemError] = useState<string | null>(null);

  /* Threat Intelligence Configuration */
  const [tiConfig, setTiConfig] = useState<ThreatIntelConfig | null>(null);
  const [abuseIpDbKeyInput, setAbuseIpDbKeyInput] = useState('');
  const [virusTotalKeyInput, setVirusTotalKeyInput] = useState('');
  const [tiEnabled, setTiEnabled] = useState(true);
  const [isSavingTI, setIsSavingTI] = useState(false);
  const [tiMessage, setTiMessage] = useState<string | null>(null);
  const [testIndicator, setTestIndicator] = useState('185.220.101.5');
  const [isTestingTI, setIsTestingTI] = useState(false);
  const [testResult, setTestResult] = useState<ThreatIntelResult | null>(null);

  const fetchThreatIntelConfig = useCallback(async () => {
    try {
      const cfg = await incidentService.getThreatIntelConfig();
      setTiConfig(cfg);
      setTiEnabled(cfg.enabled);
    } catch (err) {
      console.warn('Unable to load threat intelligence config:', err);
    }
  }, []);

  /* localStorage-persisted frontend settings */
  const [reducedMotion, setReducedMotion] = useState(
    () => localStorage.getItem('evs_reduced_motion') === 'true',
  );
  const [notifications, setNotifications] = useState(
    () => localStorage.getItem('evs_notifications') !== 'false',
  );
  const [alertThreshold, setAlertThreshold] = useState(
    () => localStorage.getItem('evs_alert_threshold') ?? 'MEDIUM',
  );
  const [refreshInterval, setRefreshInterval] = useState(
    () => localStorage.getItem('evs_refresh_interval') ?? '30',
  );
  const [autoBlock, setAutoBlock] = useState(
    () => localStorage.getItem('evs_auto_block') === 'true',
  );

  /* Persist settings to localStorage */
  const persist = (key: string, value: string) => localStorage.setItem(key, value);

  const handleReducedMotion = (v: boolean) => {
    setReducedMotion(v);
    persist('evs_reduced_motion', String(v));
    document.documentElement.classList.toggle('reduce-motion', v);
  };
  const handleNotifications = (v: boolean) => {
    setNotifications(v);
    persist('evs_notifications', String(v));
  };
  const handleAutoBlock = (v: boolean) => {
    setAutoBlock(v);
    persist('evs_auto_block', String(v));
  };
  const handleAlertThreshold = (v: string) => {
    setAlertThreshold(v);
    persist('evs_alert_threshold', v);
  };
  const handleRefreshInterval = (v: string) => {
    setRefreshInterval(v);
    persist('evs_refresh_interval', v);
  };

  /* Fetch live system status */
  const fetchSystemStatus = useCallback(async () => {
    setIsLoadingSystem(true);
    setSystemError(null);
    try {
      const [mlRes, healthRes] = await Promise.all([
        mlService.getStatus(),
        healthService.getHealth(),
      ]);
      setMlStatus(mlRes);
      setHealth(healthRes);
    } catch (err) {
      setSystemError(err instanceof Error ? err.message : 'Could not fetch system status.');
    } finally {
      setIsLoadingSystem(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemStatus();
    fetchThreatIntelConfig();
  }, [fetchSystemStatus, fetchThreatIntelConfig]);

  const handleSaveThreatIntel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingTI(true);
      setTiMessage(null);
      await incidentService.updateThreatIntelConfig({
        abuseIpDbKey: abuseIpDbKeyInput.trim() || undefined,
        virusTotalKey: virusTotalKeyInput.trim() || undefined,
        enableThreatIntel: tiEnabled,
      });
      setTiMessage('Threat Intelligence configuration updated successfully.');
      setAbuseIpDbKeyInput('');
      setVirusTotalKeyInput('');
      await fetchThreatIntelConfig();
    } catch (err: any) {
      setTiMessage(`Failed to update config: ${err.message}`);
    } finally {
      setIsSavingTI(false);
    }
  };

  const handleTestIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testIndicator.trim()) return;
    try {
      setIsTestingTI(true);
      const res = await incidentService.lookupThreatIntel(testIndicator.trim());
      setTestResult(res);
    } catch (err: any) {
      console.error('Test indicator lookup failed:', err);
    } finally {
      setIsTestingTI(false);
    }
  };

  return (
    <AppLayout pageTitle="SOC Settings">
      <div className="space-y-5 max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C4B5FD]/16">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FF] tracking-tight">
                SOC Settings
              </h2>
              <StatusChip label="CONFIG" variant="demo" />
            </div>
            <p className="text-xs sm:text-sm text-[#C4C2D6]">
              Platform preferences, ML engine status, and environment information.
            </p>
          </div>
          <button
            onClick={fetchSystemStatus}
            disabled={isLoadingSystem}
            className="p-3 rounded-2xl bg-[#252542] hover:bg-[#303052] border border-[#C4B5FD]/18 text-[#C4C2D6] hover:text-[#F5F3FF] transition-colors shadow-sm self-start sm:self-auto"
            title="Refresh system status"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingSystem ? 'animate-spin text-[#9B7BFF]' : ''}`} />
          </button>
        </div>

        {systemError && (
          <ApiConnectionBanner
            message={systemError}
            onRetry={fetchSystemStatus}
            isRetrying={isLoadingSystem}
          />
        )}

        {/* ── Subview Tabs ── */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#17172B]/90 border border-[#C4B5FD]/16 backdrop-blur-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'preferences'
                ? 'bg-[#8055F6] text-white shadow-md shadow-[#8055F6]/30 font-bold'
                : 'text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252542]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Preferences &amp; Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'system'
                ? 'bg-[#8055F6] text-white shadow-md shadow-[#8055F6]/30 font-bold'
                : 'text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252542]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Engine &amp; System Status</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('threat-intel')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'threat-intel'
                ? 'bg-[#8055F6] text-white shadow-md shadow-[#8055F6]/30 font-bold'
                : 'text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252542]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Threat Intelligence</span>
          </button>
        </div>

        {/* Tab 1: Preferences & Security */}
        {activeTab === 'preferences' && (
          <div className="space-y-4 animate-fade-in">
            {/* 1. GENERAL */}
            <Section icon={<Monitor className="w-4 h-4" />} title="General">
              <InfoRow
                label="Theme"
                value={
                  <span className="px-2.5 py-1 rounded-lg bg-[#9B7BFF]/15 border border-[#9B7BFF]/30 text-[#C4B5FD] text-xs font-mono font-semibold">
                    Dark Violet (default)
                  </span>
                }
              />
              <Toggle
                id="reduced-motion"
                on={reducedMotion}
                onChange={handleReducedMotion}
                label="Reduced Motion"
                description="Minimise background animations and page transitions for accessibility."
              />
              <SelectRow
                label="Auto-refresh Interval"
                description="How often the dashboard fetches new data from the backend."
                value={refreshInterval}
                onChange={handleRefreshInterval}
                options={[
                  { value: '10',  label: 'Every 10 seconds' },
                  { value: '30',  label: 'Every 30 seconds' },
                  { value: '60',  label: 'Every 60 seconds' },
                  { value: '300', label: 'Every 5 minutes' },
                  { value: '0',   label: 'Manual only' },
                ]}
              />
            </Section>

            {/* 2. SECURITY */}
            <Section icon={<Shield className="w-4 h-4" />} title="Security Preferences">
              <SelectRow
                label="Alert Severity Threshold"
                description="Minimum severity level to surface in the alerts panel."
                value={alertThreshold}
                onChange={handleAlertThreshold}
                options={[
                  { value: 'LOW',      label: 'Low and above' },
                  { value: 'MEDIUM',   label: 'Medium and above' },
                  { value: 'HIGH',     label: 'High and above' },
                  { value: 'CRITICAL', label: 'Critical only' },
                ]}
              />
              <Toggle
                id="auto-block"
                on={autoBlock}
                onChange={handleAutoBlock}
                label="Auto-Block (Future / Linux)"
                description="Automatically apply firewall rules when a DDoS ATTACK classification is returned. Requires live Linux perf integration — not active in replay mode."
              />
              <Toggle
                id="notifications"
                on={notifications}
                onChange={handleNotifications}
                label="Security Notifications"
                description="Show toast notifications for attack events and alerts."
              />
            </Section>

            {/* 5. DEMO / DEVELOPMENT */}
            <Section icon={<FlaskConical className="w-4 h-4" />} title="Demo / Development">
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#F5F3FF]">DDoS Attack Simulation</p>
                    <StatusChip label="DEMO" variant="demo" />
                  </div>
                  <p className="text-xs text-[#9896B0] mt-0.5">
                    Simulates DDoS attack state across the UI. Toggle also accessible via the topbar button.
                  </p>
                </div>
                <button
                  onClick={toggleDDoSAttack}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-300 border shadow-sm shrink-0 ${
                    isAttackMode
                      ? 'bg-[#FB7185]/15 border-[#FB7185]/35 text-[#FB7185]'
                      : 'bg-[#4DD9F0]/15 border-[#4DD9F0]/35 text-[#4DD9F0] hover:bg-[#4DD9F0]/25'
                  }`}
                >
                  {isAttackMode
                    ? <><Square className="w-3 h-3 fill-current" /> END DEMO</>
                    : <><Play className="w-3 h-3 fill-current" /> START DEMO</>
                  }
                </button>
              </div>
            </Section>
          </div>
        )}

        {/* Tab 2: Engine & System Status */}
        {activeTab === 'system' && (
          <div className="space-y-4 animate-fade-in">
            {/* 3. ML ENGINE */}
            <Section icon={<Brain className="w-4 h-4" />} title="ML Engine Status">
              {isLoadingSystem ? (
                <div className="space-y-3 py-3">
                  {[120, 90, 110, 80, 100].map((w, i) => (
                    <div key={i} className="skeleton h-5 rounded-lg" style={{ width: `${w}px` }} />
                  ))}
                </div>
              ) : (
                <>
                  <InfoRow label="Model Name"   value={mlStatus?.modelName ?? 'CICEV2023_RandomForest_v1'} />
                  <InfoRow label="Version"      value={mlStatus?.version ?? '1.0.0'} />
                  <InfoRow label="Pipeline"     value={mlStatus?.pipelineVersion ?? 'CICEV2023-TOP-RicherStats-v1'} />
                  <InfoRow label="Status"       value={
                    <StatusChip
                      label={mlStatus?.status ?? 'READY'}
                      variant={mlStatus?.status === 'READY' ? 'live' : 'warning'}
                      dot
                    />
                  } />
                  <InfoRow label="Threshold"    value="0.55 (frozen)" />
                  <InfoRow label="Algorithm"    value="RandomForestClassifier (n=400)" />
                  <InfoRow label="Features"     value="10 TOP statistical features" />
                  <InfoRow label="Inference"    value="Local Python subprocess" />
                  <InfoRow label="Dataset"      value="CICEV2023 EV Auth Benchmark" />
                  <InfoRow label="Demo/Fake?"   value={
                    <StatusChip label={mlStatus?.isDemo === false ? 'REAL — isDemo: false' : 'DEMO'} variant={mlStatus?.isDemo === false ? 'protected' : 'demo'} />
                  } />
                </>
              )}
            </Section>

            {/* 4. SYSTEM */}
            <Section icon={<Server className="w-4 h-4" />} title="System Infrastructure">
              {isLoadingSystem ? (
                <div className="py-4 flex items-center gap-2 text-xs font-mono text-[#9896B0]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#9B7BFF]" />
                  Querying system services…
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-xs font-mono font-semibold text-[#9896B0] uppercase tracking-wide">Backend API</span>
                    <StatusDot ok={!!health} label={health ? 'ONLINE' : 'OFFLINE'} />
                  </div>
                  {health && (
                    <div className="flex items-center justify-between py-3">
                      <span className="text-xs font-mono font-semibold text-[#9896B0] uppercase tracking-wide">API Latency</span>
                      <span className="text-sm font-semibold font-mono text-[#F5F3FF]">{health.database?.latencyMs ?? '—'} ms</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-xs font-mono font-semibold text-[#9896B0] uppercase tracking-wide">PostgreSQL</span>
                    <StatusDot ok={health?.database?.connected ?? false} label={health?.database?.connected ? 'CONNECTED' : 'DISCONNECTED'} />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-xs font-mono font-semibold text-[#9896B0] uppercase tracking-wide">ML Engine</span>
                    <StatusDot ok={mlStatus?.status === 'READY'} label={mlStatus?.status ?? 'UNKNOWN'} />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-xs font-mono font-semibold text-[#9896B0] uppercase tracking-wide">Environment</span>
                    <span className="text-sm font-semibold font-mono text-[#F5F3FF]">Windows / Development</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-xs font-mono font-semibold text-[#9896B0] uppercase tracking-wide">Kernel Tracing</span>
                    <StatusDot ok={false} label="Linux Only (Future)" />
                  </div>
                </>
              )}
            </Section>

            {/* Replay mode info */}
            <div className="py-3">
              <div className="flex items-start gap-3 rounded-2xl bg-[#252542] border border-[#C4B5FD]/16 p-4">
                <Info className="w-4 h-4 text-[#9B7BFF] shrink-0 mt-0.5" />
                <div className="text-xs text-[#C4C2D6] space-y-2">
                  <p className="font-bold text-[#F5F3FF]">Replay Mode — Development Input</p>
                  <p>
                    ML inferences currently use <code className="font-mono bg-[#1D1D35] text-[#C4B5FD] px-1.5 py-0.5 rounded border border-[#C4B5FD]/15">REPLAY_SERIES</code> or{' '}
                    <code className="font-mono bg-[#1D1D35] text-[#C4B5FD] px-1.5 py-0.5 rounded border border-[#C4B5FD]/15">ENGINEERED_VECTOR</code> from CICEV2023 dataset fixtures.
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusChip label="REPLAY MODE ACTIVE" variant="replay" dot />
                    <StatusChip label="LIVE perf: FUTURE" variant="offline" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Threat Intelligence Integration */}
        {activeTab === 'threat-intel' && (
          <div className="space-y-4 animate-fade-in">
            {tiMessage && (
              <div className="p-3.5 rounded-2xl bg-[#8055F6]/15 border border-[#8055F6]/30 text-xs font-mono text-[#C4B5FD] flex items-center justify-between">
                <span>{tiMessage}</span>
                <button onClick={() => setTiMessage(null)} className="text-[#9896B0] hover:text-[#F5F3FF]">✕</button>
              </div>
            )}

            {/* Provider Status */}
            <Section icon={<Globe className="w-4 h-4" />} title="Threat Intelligence Providers">
              <Toggle
                id="threat-intel-master"
                label="Enable Threat Intelligence Enrichment"
                description="Enrich anomaly indicators (IPs, domains) during incident correlation and evidence inspection."
                on={tiEnabled}
                onChange={setTiEnabled}
              />
              <div className="flex items-center justify-between py-3">
                <span className="text-xs font-mono font-semibold text-[#9896B0] uppercase tracking-wide">AbuseIPDB API</span>
                <StatusDot
                  ok={tiConfig?.abuseIpDbConfigured ?? false}
                  label={tiConfig?.abuseIpDbConfigured ? 'KEY CONFIGURED' : 'NOT CONFIGURED'}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs font-mono font-semibold text-[#9896B0] uppercase tracking-wide">VirusTotal API</span>
                <StatusDot
                  ok={tiConfig?.virusTotalConfigured ?? false}
                  label={tiConfig?.virusTotalConfigured ? 'KEY CONFIGURED' : 'NOT CONFIGURED'}
                />
              </div>
              <InfoRow label="Cache TTL" value={`${tiConfig?.cacheTtlMinutes ?? 60} Minutes (In-Memory)`} />
              <InfoRow label="RFC 1918 Filter" value="Enabled (Private Subnet Bypass)" />
            </Section>

            {/* API Credentials Configuration */}
            <Section icon={<Key className="w-4 h-4" />} title="API Credentials (Admin Only)">
              <form onSubmit={handleSaveThreatIntel} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-mono text-[#9896B0] mb-1">AbuseIPDB API Key</label>
                  <input
                    type="password"
                    value={abuseIpDbKeyInput}
                    onChange={(e) => setAbuseIpDbKeyInput(e.target.value)}
                    placeholder={tiConfig?.abuseIpDbConfigured ? '•••••••••••••••••••• (Leave blank to keep existing)' : 'Enter AbuseIPDB API key...'}
                    className="w-full px-3 py-2 rounded-xl bg-[#252542] border border-[#C4B5FD]/25 text-xs font-mono text-[#F5F3FF] focus:outline-none focus:border-[#8055F6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#9896B0] mb-1">VirusTotal API Key</label>
                  <input
                    type="password"
                    value={virusTotalKeyInput}
                    onChange={(e) => setVirusTotalKeyInput(e.target.value)}
                    placeholder={tiConfig?.virusTotalConfigured ? '•••••••••••••••••••• (Leave blank to keep existing)' : 'Enter VirusTotal API key...'}
                    className="w-full px-3 py-2 rounded-xl bg-[#252542] border border-[#C4B5FD]/25 text-xs font-mono text-[#F5F3FF] focus:outline-none focus:border-[#8055F6]"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingTI}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-medium text-white bg-[#8055F6] hover:bg-[#6D3DF3] shadow-md transition-colors disabled:opacity-50"
                  >
                    {isSavingTI ? 'Saving...' : 'Save Threat Intelligence Settings'}
                  </button>
                </div>
              </form>
            </Section>

            {/* Test Indicator Lookup Sandbox */}
            <Section icon={<Database className="w-4 h-4" />} title="Threat Intelligence Test Sandbox">
              <div className="py-2 space-y-3">
                <p className="text-xs text-[#C4C2D6]">
                  Query any public IP or private test address against the active threat intelligence pipeline to test caching and provider responses.
                </p>

                <form onSubmit={handleTestIndicator} className="flex gap-2">
                  <input
                    type="text"
                    value={testIndicator}
                    onChange={(e) => setTestIndicator(e.target.value)}
                    placeholder="Enter indicator (e.g. 185.220.101.5 or 192.168.1.1)..."
                    className="flex-1 px-3 py-2 rounded-xl bg-[#252542] border border-[#C4B5FD]/25 text-xs font-mono text-[#F5F3FF] focus:outline-none focus:border-[#8055F6]"
                  />
                  <button
                    type="submit"
                    disabled={isTestingTI || !testIndicator.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-medium text-[#C4B5FD] bg-[#8055F6]/20 hover:bg-[#8055F6]/30 border border-[#8055F6]/40 transition-colors disabled:opacity-50"
                  >
                    {isTestingTI ? 'Looking up...' : 'Test Lookup'}
                  </button>
                </form>

                {testResult && (
                  <div className="p-3.5 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F5F3FF]">{testResult.indicator}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          testResult.reputation === 'MALICIOUS'
                            ? 'bg-[#FB7185]/20 text-[#FB7185] border-[#FB7185]/40'
                            : testResult.reputation === 'SUSPICIOUS'
                            ? 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/40'
                            : 'bg-[#34D399]/20 text-[#34D399] border-[#34D399]/40'
                        }`}
                      >
                        {testResult.reputation} ({testResult.confidence}%)
                      </span>
                    </div>
                    <p className="text-[#C4C2D6] font-sans">{testResult.details}</p>
                    <div className="flex items-center gap-4 text-[10px] text-[#9896B0] pt-1 border-t border-[#C4B5FD]/10">
                      <span>Provider: {testResult.provider}</span>
                      <span>Status: {testResult.status}</span>
                      {testResult.country && <span>Country: {testResult.country}</span>}
                      {testResult.asn && <span>ASN: {testResult.asn}</span>}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          </div>
        )}

        {/* Footer note */}
        <div className="text-center text-[11px] font-mono text-[#9896B0] py-2">
          <Gauge className="w-3.5 h-3.5 inline mr-1.5 text-[#9B7BFF]" />
          Settings marked <strong>Frontend Config</strong> are stored in localStorage and do not modify the backend or ML pipeline.
        </div>
      </div>
    </AppLayout>
  );
};
