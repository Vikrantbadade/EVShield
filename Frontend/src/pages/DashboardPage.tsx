import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { SecurityHero } from '../components/dashboard/SecurityHero';
import { StatCard } from '../components/dashboard/StatCard';
import { MLThreatAlert } from '../components/dashboard/MLThreatAlert';
import { TrafficChart } from '../components/dashboard/TrafficChart';
import { EventCardsRow } from '../components/dashboard/EventCardsRow';
import { StationStatusGrid } from '../components/dashboard/StationStatusGrid';
import { LiveAttackFeed } from '../components/dashboard/LiveAttackFeed';
import { ThreatTimeline } from '../components/dashboard/ThreatTimeline';
import { useSecurity } from '../context/SecurityContext';
import { dashboardService, DashboardSummaryData } from '../services/dashboardService';
import { healthService, HealthCheckStatus } from '../services/healthService';
import { ApiConnectionBanner } from '../components/ui/ApiConnectionBanner';
import { StatusChip } from '../components/ui/StatusChip';
import { KpiStat } from '../types';
import { RefreshCw, Radio } from 'lucide-react';

import { DemoControls } from '../components/monitoring/DemoControls';

export const DashboardPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardSummaryData | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthCheckStatus | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    isAttackMode,
    liveFeed,
    timelineEvents,
    serverStatus,
    mlConfidence,
    totalRequests,
  } = useSecurity();

  const fetchBackendData = useCallback(async () => {
    setIsRefreshing(true);
    setApiError(null);

    try {
      const [summary, health] = await Promise.all([
        dashboardService.getSummary(),
        healthService.getHealth(),
      ]);
      setDashboardData(summary);
      setHealthStatus(health);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Backend connection error');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBackendData();
  }, [fetchBackendData]);

  // Construct dynamic KPI stat cards based on live context / backend response
  const kpiStatsData: KpiStat[] = [
    {
      id: 'total-reqs',
      label: 'Total Requests',
      value: (totalRequests || dashboardData?.totalRequests || 0).toLocaleString(),
      change: '+14.2%',
      isPositive: true,
      isDemo: false,
      description: 'Analyzed telemetry packets across local charging gateways',
      iconName: 'Activity',
    },
    {
      id: 'attacks-detected',
      label: 'Attacks Detected',
      value: (isAttackMode ? 1 : 0).toString(),
      change: isAttackMode ? 'CRITICAL' : '0 ACTIVE',
      isPositive: !isAttackMode,
      isDemo: false,
      description: 'Identified DDoS & authentication burst attempts',
      iconName: 'ShieldAlert',
    },
    {
      id: 'protected-chargers',
      label: 'Protected Chargers',
      value: serverStatus === 'ONLINE' ? '1 / 1 Online' : '0 / 1 Online',
      change: serverStatus === 'ONLINE' ? '100% Online' : 'Offline',
      isPositive: serverStatus === 'ONLINE',
      isDemo: false,
      description: 'Active charging nodes protected by EVShield',
      iconName: 'Server',
    },
    {
      id: 'ml-accuracy',
      label: 'ML Threat Score',
      value: `${mlConfidence.toFixed(1)}%`,
      change: 'CICEV2023 RF',
      isPositive: !isAttackMode,
      isDemo: false,
      description: 'Real-time Random Forest probability',
      iconName: 'Zap',
    },
  ];

  return (
    <AppLayout pageTitle="Security Overview">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-4 border-b border-[#C4B5FD]/16">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F5F3FF] tracking-tight">
              Security Overview
            </h2>
            {healthStatus ? (
              <StatusChip label="API ONLINE (V1)" variant="protected" dot />
            ) : (
              <StatusChip label="BACKEND CONNECTING" variant="demo" dot />
            )}
            <StatusChip label="DEMO BACKEND DATA" variant="demo" />
          </div>
          <p className="text-sm text-[#C4C2D6] mt-1 font-normal">
            Real-time cybersecurity visibility for your EV charging authentication infrastructure.
          </p>
        </div>

        {/* Time Range Pills & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#252542] border border-[#C4B5FD]/18 rounded-2xl p-1 font-mono text-xs text-[#9896B0] shadow-sm">
            <button
              onClick={() => setTimeRange('24h')}
              className={`px-4 py-1.5 rounded-xl transition-all ${
                timeRange === '24h'
                  ? 'bg-[#9B7BFF]/25 text-[#F5F3FF] border border-[#9B7BFF]/45 font-bold shadow-sm'
                  : 'hover:text-[#F5F3FF]'
              }`}
            >
              Last 24h
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-1.5 rounded-xl transition-all ${
                timeRange === '7d'
                  ? 'bg-[#9B7BFF]/25 text-[#F5F3FF] border border-[#9B7BFF]/45 font-bold shadow-sm'
                  : 'hover:text-[#F5F3FF]'
              }`}
            >
              Last 7d
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-1.5 rounded-xl transition-all ${
                timeRange === '30d'
                  ? 'bg-[#9B7BFF]/25 text-[#F5F3FF] border border-[#9B7BFF]/45 font-bold shadow-sm'
                  : 'hover:text-[#F5F3FF]'
              }`}
            >
              Last 30d
            </button>
          </div>

          <button
            onClick={fetchBackendData}
            disabled={isRefreshing}
            className="p-3 rounded-2xl bg-[#252542] hover:bg-[#303052] border border-[#C4B5FD]/18 text-[#C4C2D6] hover:text-[#F5F3FF] transition-colors shadow-sm"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#9B7BFF]' : ''}`} />
          </button>

          <div
            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-mono font-bold transition-all shadow-sm ${
              isAttackMode
                ? 'bg-[#FB7185]/15 border-[#FB7185]/35 text-[#FB7185]'
                : 'bg-[#252542] border-[#C4B5FD]/18 text-[#34D399]'
            }`}
          >
            <Radio className={`w-4 h-4 ${isAttackMode ? 'text-[#FB7185] animate-ping' : 'text-[#34D399] animate-pulse'}`} />
            <span>{isAttackMode ? 'ATTACK ACTIVE' : 'LIVE SOC'}</span>
          </div>
        </div>
      </div>

      {/* Backend API Connection Error Banner */}
      {apiError && (
        <ApiConnectionBanner message={apiError} onRetry={fetchBackendData} isRetrying={isRefreshing} />
      )}

      {/* 1. Interactive Demo Control Lab */}
      <DemoControls />

      {/* 2. Large Security Command Center Hero */}
      <SecurityHero />

      {/* 3. Primary KPI Cards Row (4 Key Stats with Distinct Colors) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiStatsData.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>

      {/* 3. ML Threat Alert Panel */}
      <MLThreatAlert />

      {/* 4. Cinematic Authentication Traffic Chart */}
      <TrafficChart />

      {/* 5. Horizontal Security Event Scenario Cards */}
      <EventCardsRow />

      {/* 6. Two-Column Section: Infrastructure Node Status & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <StationStatusGrid />
        </div>
        <div className="lg:col-span-5">
          <LiveAttackFeed feed={liveFeed} />
        </div>
      </div>

      {/* 7. Threat Timeline */}
      <ThreatTimeline events={timelineEvents} />
    </AppLayout>
  );
};
