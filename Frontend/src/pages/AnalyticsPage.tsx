import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { analyticsService, AnalyticsData } from '../services/analyticsService';
import { StatusChip } from '../components/ui/StatusChip';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { ApiConnectionBanner } from '../components/ui/ApiConnectionBanner';
import { BarChart3, RefreshCw, PieChart, Activity, ShieldCheck } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const res = await analyticsService.getAnalytics();
      setData(res);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to query security analytics.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <AppLayout pageTitle="Analytics">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#AD8B73]/18">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3F3832] tracking-tight">
                Security Analytics
              </h2>
              <StatusChip label="BACKEND CONNECTED" variant="live" dot pulse />
              <StatusChip label="DEMO BACKEND DATA" variant="demo" />
            </div>
            <p className="text-sm text-[#514940]">
              System throughput, attack distributions, and security trend reports consumed from backend REST API.
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={isRefreshing}
            className="p-3 rounded-2xl bg-white/70 hover:bg-white/90 border border-white/90 text-[#7A7067] hover:text-[#3F3832] transition-colors shadow-glass-sm self-start sm:self-auto"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#AD8B73]' : ''}`} />
          </button>
        </div>

        {apiError && (
          <ApiConnectionBanner message={apiError} onRetry={fetchAnalytics} isRetrying={isRefreshing} />
        )}

        {/* Attack Frequency & Type Distribution Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <ScrollReveal>
              <div className="glass-cream rounded-[28px] p-6 shadow-glass border border-white/90 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#3F3832] flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#AD8B73]" />
                    <span>Attack Frequency Trend (7-Day)</span>
                  </h3>
                  <span className="text-xs font-mono text-[#7A7067]">API Endpoint: /api/v1/analytics</span>
                </div>

                <div className="space-y-3 pt-2">
                  {(data?.attackFrequency || [
                    { date: '2026-08-02', count: 2 },
                    { date: '2026-08-03', count: 1 },
                    { date: '2026-08-04', count: 4 },
                    { date: '2026-08-05', count: 0 },
                    { date: '2026-08-06', count: 3 },
                    { date: '2026-08-07', count: 2 },
                    { date: '2026-08-08', count: 6 },
                  ]).map((item) => (
                    <div key={item.date} className="flex items-center gap-4 text-xs font-mono">
                      <span className="w-24 text-[#7A7067] shrink-0">{item.date}</span>
                      <div className="flex-1 bg-white/70 h-6 rounded-xl border border-white/90 overflow-hidden relative">
                        <div
                          className="bg-[#E85C68]/30 h-full rounded-xl border-r border-[#E85C68]/50 transition-all duration-500"
                          style={{ width: `${Math.min(100, item.count * 15)}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-bold text-[#3F3832]">{item.count} attacks</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-5">
            <ScrollReveal delay={100}>
              <div className="glass-cream rounded-[28px] p-6 shadow-glass border border-white/90 space-y-4">
                <h3 className="text-lg font-bold text-[#3F3832] flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[#19BFA3]" />
                  <span>Attack Type Distribution</span>
                </h3>

                <div className="space-y-4 pt-2">
                  {(data?.attackDistribution || [
                    { type: 'Volumetric DDoS', percentage: 55 },
                    { type: 'Traffic Anomaly', percentage: 25 },
                    { type: 'Auth Spraying', percentage: 15 },
                    { type: 'Malformed Packet Burst', percentage: 5 },
                  ]).map((item) => (
                    <div key={item.type} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-semibold text-[#3F3832]">{item.type}</span>
                        <span className="text-[#AD8B73] font-bold">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-white/70 h-3 rounded-full border border-white/90 overflow-hidden">
                        <div
                          className="bg-[#CEAB93] h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Station Health Overview */}
        <ScrollReveal delay={150}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-cream rounded-[24px] p-5 space-y-2 border border-white/90 shadow-glass-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#7A7067]">Nominal Stations</span>
                <ShieldCheck className="w-4 h-4 text-[#2b703b]" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-[#3F3832]">{data?.stationHealthOverview?.nominal ?? 412}</div>
              <div className="text-[10px] font-mono text-[#2b703b]">Protected and nominal operational mode</div>
            </div>

            <div className="glass-cream rounded-[24px] p-5 space-y-2 border border-white/90 shadow-glass-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#7A7067]">Elevated Monitoring</span>
                <Activity className="w-4 h-4 text-[#a8731d]" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-[#3F3832]">{data?.stationHealthOverview?.elevated ?? 5}</div>
              <div className="text-[10px] font-mono text-[#a8731d]">Mild variance from baseline flow</div>
            </div>

            <div className="glass-cream rounded-[24px] p-5 space-y-2 border border-white/90 shadow-glass-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#7A7067]">Critical / Under Attack</span>
                <Activity className="w-4 h-4 text-[#a82d38]" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-[#3F3832]">{data?.stationHealthOverview?.critical ?? 3}</div>
              <div className="text-[10px] font-mono text-[#a82d38]">Mitigation dynamic firewalls engaged</div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </AppLayout>
  );
};
