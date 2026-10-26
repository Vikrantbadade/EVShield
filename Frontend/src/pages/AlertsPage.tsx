import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { alertService, AlertRecord } from '../services/alertService';
import { StatusChip } from '../components/ui/StatusChip';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { ApiConnectionBanner } from '../components/ui/ApiConnectionBanner';
import { ShieldAlert, RefreshCw, Clock } from 'lucide-react';
import { formatDateTime } from '../utils/dateTime';

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
        return <span className="px-2.5 py-1 rounded-xl bg-[#FB7185]/20 border border-[#FB7185]/40 text-[#FB7185] font-bold text-xs font-mono">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-1 rounded-xl bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#FB7185] font-bold text-xs font-mono">HIGH</span>;
      case 'WARNING':
        return <span className="px-2.5 py-1 rounded-xl bg-[#FBBF24]/20 border border-[#FBBF24]/40 text-[#FBBF24] font-bold text-xs font-mono">WARNING</span>;
      default:
        return <span className="px-2.5 py-1 rounded-xl bg-[#4DD9F0]/20 border border-[#4DD9F0]/40 text-[#4DD9F0] font-bold text-xs font-mono">INFO</span>;
    }
  };

  return (
    <AppLayout pageTitle="Alerts & Rules">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C4B5FD]/16">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F5F3FF] tracking-tight">
                Alerts & Security Rules
              </h2>
              <StatusChip label="BACKEND API CONNECTED" variant="live" dot pulse />
            </div>
            <p className="text-sm text-[#C4C2D6]">
              SOC alert notifications and automated mitigation triggers consumed via backend REST API.
            </p>
          </div>

          <button
            onClick={fetchAlerts}
            disabled={isRefreshing}
            className="p-3 rounded-2xl bg-[#252542] hover:bg-[#303052] border border-[#C4B5FD]/18 text-[#C4C2D6] hover:text-[#F5F3FF] transition-colors shadow-sm self-start sm:self-auto"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#9B7BFF]' : ''}`} />
          </button>
        </div>

        {apiError && (
          <ApiConnectionBanner message={apiError} onRetry={fetchAlerts} isRetrying={isRefreshing} />
        )}

        {/* Alerts List */}
        <ScrollReveal>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="glass-card rounded-[28px] p-12 text-center space-y-3">
                <ShieldAlert className="w-8 h-8 text-[#9B7BFF] mx-auto" />
                <h3 className="text-base font-bold text-[#F5F3FF]">No Active Security Alerts</h3>
                <p className="text-xs text-[#9896B0]">All charging infrastructure authentication gateways report nominal traffic.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="glass-card rounded-[24px] p-6 space-y-3 hover:-translate-y-0.5 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {getSeverityBadge(alert.severity)}
                      <h3 className="text-base font-bold text-[#F5F3FF]">{alert.title}</h3>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-[#9896B0]">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#9B7BFF]" />
                        {formatDateTime(alert.timestamp)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#252542] border border-[#C4B5FD]/20 font-semibold text-[#F5F3FF]">
                        {alert.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#C4C2D6] leading-relaxed">{alert.message}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#9896B0] pt-2 border-t border-[#C4B5FD]/16">
                    <span>Alert ID: <code className="font-bold text-[#F5F3FF]">{alert.id}</code></span>
                    {alert.attackId && <span>Attack Incident: <code className="font-bold text-[#F5F3FF]">{alert.attackId}</code></span>}
                    {alert.stationId && <span>Target Node: <code className="font-bold text-[#F5F3FF]">{alert.stationId}</code></span>}
                    {alert.mlConfidence && <span>ML Confidence: <code className="font-bold text-[#34D399]">{alert.mlConfidence}%</code></span>}
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
