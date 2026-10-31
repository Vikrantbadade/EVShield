import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { analyticsService, AnalyticsData } from '../services/analyticsService';
import { StatusChip } from '../components/ui/StatusChip';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { ApiConnectionBanner } from '../components/ui/ApiConnectionBanner';
import { BarChart3, PieChart, ShieldCheck, Activity, RefreshCw } from 'lucide-react';

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
      setApiError(err instanceof Error ? err.message : 'Failed to query analytics data from backend.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <AppLayout pageTitle="Analytics">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-[#C4B5FD]/16">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FF] tracking-tight">
                Security Analytics
              </h2>
              <StatusChip label="BACKEND CONNECTED" variant="live" dot pulse />
              <StatusChip label="TELEMETRY ANALYTICS" variant="live" />
            </div>
            <p className="text-xs sm:text-sm text-[#C4C2D6]">
              System throughput, attack distributions, and security trend reports consumed from backend REST API.
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl bg-[#252542] hover:bg-[#303052] border border-[#C4B5FD]/18 text-[#C4C2D6] hover:text-[#F5F3FF] transition-colors shadow-sm self-start sm:self-auto"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#9B7BFF]' : ''}`} />
          </button>
        </div>

        {apiError && (
          <ApiConnectionBanner message={apiError} onRetry={fetchAnalytics} isRetrying={isRefreshing} />
        )}

        {/* Attack Frequency & Type Distribution Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <ScrollReveal>
              <div className="glass-card rounded-[24px] p-5 sm:p-6 border border-[#C4B5FD]/16 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#F5F3FF] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#9B7BFF]" />
                    <span>Attack Frequency Trend (7-Day)</span>
                  </h3>
                  <span className="text-xs font-mono text-[#9896B0]">/api/v1/analytics</span>
                </div>

                <div className="space-y-2.5 pt-2">
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
                      <span className="w-24 text-[#9896B0] shrink-0">{item.date}</span>
                      <div className="flex-1 bg-[#252542] h-6 rounded-xl border border-[#C4B5FD]/16 overflow-hidden relative">
                        <div
                          className="bg-[#FB7185]/35 h-full rounded-xl border-r border-[#FB7185]/60 transition-all duration-500"
                          style={{ width: `${Math.min(100, item.count * 15)}%` }}
                        />
                      </div>
                      <span className="w-16 text-right font-bold text-[#F5F3FF]">{item.count} attacks</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-5">
            <ScrollReveal delay={100}>
              <div className="glass-card rounded-[24px] p-5 sm:p-6 border border-[#C4B5FD]/16 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-[#F5F3FF] flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#4DD9F0]" />
                  <span>Attack Type Distribution</span>
                </h3>

                <div className="space-y-3 pt-2">
                  {(data?.attackDistribution || [
                    { type: 'Volumetric DDoS', percentage: 55 },
                    { type: 'Traffic Anomaly', percentage: 25 },
                    { type: 'Auth Spraying', percentage: 15 },
                    { type: 'Malformed Packet Burst', percentage: 5 },
                  ]).map((item) => (
                    <div key={item.type} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-semibold text-[#F5F3FF]">{item.type}</span>
                        <span className="text-[#9B7BFF] font-bold">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-[#252542] h-2.5 rounded-full border border-[#C4B5FD]/16 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#8055F6] to-[#9B7BFF] h-full rounded-full transition-all duration-500"
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
            <div className="glass-card rounded-[24px] p-5 space-y-2 border border-[#C4B5FD]/16 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#9896B0]">Nominal Stations</span>
                <ShieldCheck className="w-4 h-4 text-[#34D399]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#F5F3FF]">
                {data?.stationHealthOverview?.nominal ?? 412}
              </div>
              <div className="text-[10px] font-mono text-[#34D399]">Protected and nominal operational mode</div>
            </div>

            <div className="glass-card rounded-[24px] p-5 space-y-2 border border-[#C4B5FD]/16 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#9896B0]">Elevated Monitoring</span>
                <Activity className="w-4 h-4 text-[#FBBF24]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#F5F3FF]">
                {data?.stationHealthOverview?.elevated ?? 5}
              </div>
              <div className="text-[10px] font-mono text-[#FBBF24]">Mild variance from baseline flow</div>
            </div>

            <div className="glass-card rounded-[24px] p-5 space-y-2 border border-[#C4B5FD]/16 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#9896B0]">Critical / Under Attack</span>
                <Activity className="w-4 h-4 text-[#FB7185]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#F5F3FF]">
                {data?.stationHealthOverview?.critical ?? 3}
              </div>
              <div className="text-[10px] font-mono text-[#FB7185]">Mitigation dynamic firewalls engaged</div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </AppLayout>
  );
};
