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
import { RefreshCw, Shield, Activity, Radio } from 'lucide-react';

import { DemoControls } from '../components/monitoring/DemoControls';

export const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'command' | 'traffic' | 'threats'>('command');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-[#C4B5FD]/16">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FF] tracking-tight">
              Security Overview
            </h2>
            {healthStatus ? (
              <StatusChip label="API ONLINE (V1)" variant="protected" dot />
            ) : (
              <StatusChip label="BACKEND CONNECTING" variant="demo" dot />
            )}
            <StatusChip label="DEMO BACKEND DATA" variant="demo" />
          </div>
          <p className="text-xs sm:text-sm text-[#C4C2D6] font-normal">
            Real-time cybersecurity visibility for your EV charging authentication infrastructure.
          </p>
        </div>

        {/* Clean Refresh Action (Redundant Date Range Control removed as instructed) */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBackendData}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-[#252542] hover:bg-[#303052] border border-[#C4B5FD]/18 text-[#C4C2D6] hover:text-[#F5F3FF] transition-colors shadow-sm"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#9B7BFF]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Backend API Connection Error Banner */}
      {apiError && (
        <ApiConnectionBanner message={apiError} onRetry={fetchBackendData} isRetrying={isRefreshing} />
      )}

      {/* ── Viewport Operational Subview Tabs ── */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#17172B]/90 border border-[#C4B5FD]/16 backdrop-blur-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('command')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'command'
              ? 'bg-[#8055F6] text-white shadow-md shadow-[#8055F6]/30 font-bold'
              : 'text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252542]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Command Center</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('traffic')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'traffic'
              ? 'bg-[#8055F6] text-white shadow-md shadow-[#8055F6]/30 font-bold'
              : 'text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252542]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Traffic &amp; Telemetry</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('threats')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'threats'
              ? 'bg-[#8055F6] text-white shadow-md shadow-[#8055F6]/30 font-bold'
              : 'text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#252542]'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Threat Feeds &amp; Stations</span>
          {isAttackMode && (
            <span className="w-2 h-2 rounded-full bg-[#FB7185] animate-ping" />
          )}
        </button>
      </div>

      {/* Tab 1: Command Center View */}
      {activeTab === 'command' && (
        <div className="space-y-4 animate-fade-in">
          {/* 1. Interactive Demo Control Lab */}
          <DemoControls />

          {/* 2. Large Security Command Center Hero */}
          <SecurityHero />

          {/* 3. Primary KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiStatsData.map((stat) => (
              <StatCard key={stat.id} stat={stat} />
            ))}
          </div>

          {/* 4. ML Threat Alert Panel */}
          <MLThreatAlert />
        </div>
      )}

      {/* Tab 2: Traffic & Telemetry Stream */}
      {activeTab === 'traffic' && (
        <div className="space-y-4 animate-fade-in">
          {/* Cinematic Authentication Traffic Chart */}
          <TrafficChart />

          {/* Horizontal Security Event Scenario Cards */}
          <EventCardsRow />
        </div>
      )}

      {/* Tab 3: Threat Feeds & Charging Stations */}
      {activeTab === 'threats' && (
        <div className="space-y-4 animate-fade-in">
          {/* Two-Column Section: Infrastructure Node Status & Live Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7">
              <StationStatusGrid />
            </div>
            <div className="lg:col-span-5">
              <LiveAttackFeed feed={liveFeed} />
            </div>
          </div>

          {/* Threat Timeline */}
          <ThreatTimeline events={timelineEvents} />
        </div>
      )}
    </AppLayout>
  );
};
