import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { alertService, AlertRecord } from '../services/alertService';
import { StatusChip } from '../components/ui/StatusChip';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { ApiConnectionBanner } from '../components/ui/ApiConnectionBanner';
import { ShieldAlert, RefreshCw, Clock } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const res = await alertService.getAlerts();
      setAlerts(res.items);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to query security alerts from backend.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return <span className="px-2.5 py-1 rounded-xl bg-[#E85C68]/20 border border-[#E85C68]/40 text-[#a82d38] font-bold text-xs font-mono">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-1 rounded-xl bg-[#E85C68]/15 border border-[#E85C68]/30 text-[#a82d38] font-bold text-xs font-mono">HIGH</span>;
      case 'WARNING':
        return <span className="px-2.5 py-1 rounded-xl bg-[#D99A32]/20 border border-[#D99A32]/40 text-[#a8731d] font-bold text-xs font-mono">WARNING</span>;
      default:
        return <span className="px-2.5 py-1 rounded-xl bg-[#52A8FF]/20 border border-[#52A8FF]/40 text-[#1e5ea0] font-bold text-xs font-mono">INFO</span>;
    }
  };

  return (
    <AppLayout pageTitle="Alerts & Rules">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#AD8B73]/18">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3F3832] tracking-tight">
                Alerts & Security Rules
              </h2>
              <StatusChip label="BACKEND API CONNECTED" variant="live" dot pulse />
              <StatusChip label="DEMO DATA" variant="demo" />
            </div>
            <p className="text-sm text-[#514940]">
              SOC alert notifications and automated mitigation triggers consumed via backend REST API.
            </p>
          </div>

          <button
            onClick={fetchAlerts}
            disabled={isRefreshing}
            className="p-3 rounded-2xl bg-white/70 hover:bg-white/90 border border-white/90 text-[#7A7067] hover:text-[#3F3832] transition-colors shadow-glass-sm self-start sm:self-auto"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#AD8B73]' : ''}`} />
          </button>
        </div>

        {apiError && (
          <ApiConnectionBanner message={apiError} onRetry={fetchAlerts} isRetrying={isRefreshing} />
        )}

        {/* Alerts List */}
        <ScrollReveal>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="glass-cream rounded-[28px] p-12 text-center space-y-3 shadow-glass border border-white/90">
                <ShieldAlert className="w-8 h-8 text-[#AD8B73] mx-auto" />
                <h3 className="text-base font-bold text-[#3F3832]">No Active Security Alerts</h3>
                <p className="text-xs text-[#7A7067]">All charging infrastructure authentication gateways report nominal traffic.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="glass-cream rounded-[24px] p-6 shadow-glass border border-white/90 space-y-3 hover:-translate-y-0.5 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {getSeverityBadge(alert.severity)}
                      <h3 className="text-base font-bold text-[#3F3832]">{alert.title}</h3>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-[#7A7067]">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#AD8B73]" />
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-white/70 border border-white/90 font-semibold text-[#3F3832]">
                        {alert.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#514940] leading-relaxed">{alert.message}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#7A7067] pt-2 border-t border-[#AD8B73]/10">
                    <span>Alert ID: <code className="font-bold text-[#3F3832]">{alert.id}</code></span>
                    {alert.attackId && <span>Attack Incident: <code className="font-bold text-[#3F3832]">{alert.attackId}</code></span>}
                    {alert.stationId && <span>Target Node: <code className="font-bold text-[#3F3832]">{alert.stationId}</code></span>}
                    {alert.mlConfidence && <span>ML Confidence: <code className="font-bold text-[#19BFA3]">{alert.mlConfidence}%</code></span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollReveal>
      </div>
    </AppLayout>
  );
};
