import React, { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { SecurityHero } from '../components/dashboard/SecurityHero';
import { StatCard } from '../components/dashboard/StatCard';
import { MLThreatAlert } from '../components/dashboard/MLThreatAlert';
import { TrafficChart } from '../components/dashboard/TrafficChart';
import { EventCardsRow } from '../components/dashboard/EventCardsRow';
import { StationStatusGrid } from '../components/dashboard/StationStatusGrid';
import { LiveAttackFeed } from '../components/dashboard/LiveAttackFeed';
import { ThreatTimeline } from '../components/dashboard/ThreatTimeline';
import { initialKpiStatsData } from '../data/mockData';
import { useSecurity } from '../context/SecurityContext';
import { RefreshCw, Radio } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isAttackMode, liveFeed, timelineEvents } = useSecurity();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <AppLayout pageTitle="Security Overview">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-4 border-b border-[#AD8B73]/18">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3F3832] tracking-tight">
            Security Overview
          </h2>
          <p className="text-sm text-[#514940] mt-1 font-normal">
            Real-time cybersecurity visibility for your EV charging authentication infrastructure.
          </p>
        </div>

        {/* Time Range Pills & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/70 border border-white/90 rounded-2xl p-1 font-mono text-xs text-[#514940] backdrop-blur-xl shadow-glass-sm">
            <button
              onClick={() => setTimeRange('24h')}
              className={`px-4 py-1.5 rounded-xl transition-all ${
                timeRange === '24h'
                  ? 'bg-[#CEAB93]/30 text-[#3F3832] border border-[#CEAB93]/50 font-bold shadow-glass-sm'
                  : 'hover:text-[#3F3832]'
              }`}
            >
              Last 24h
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-1.5 rounded-xl transition-all ${
                timeRange === '7d'
                  ? 'bg-[#CEAB93]/30 text-[#3F3832] border border-[#CEAB93]/50 font-bold shadow-glass-sm'
                  : 'hover:text-[#3F3832]'
              }`}
            >
              Last 7d
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-1.5 rounded-xl transition-all ${
                timeRange === '30d'
                  ? 'bg-[#CEAB93]/30 text-[#3F3832] border border-[#CEAB93]/50 font-bold shadow-glass-sm'
                  : 'hover:text-[#3F3832]'
              }`}
            >
              Last 30d
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="p-3 rounded-2xl bg-white/70 hover:bg-white/90 border border-white/90 text-[#7A7067] hover:text-[#3F3832] transition-colors backdrop-blur-xl shadow-glass-sm"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#AD8B73]' : ''}`} />
          </button>

          <div
            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-mono font-bold transition-all shadow-glass-sm ${
              isAttackMode
                ? 'bg-[#E85C68]/15 border-[#E85C68]/30 text-[#a82d38]'
                : 'bg-white/75 border-white/90 text-[#2b703b]'
            }`}
          >
            <Radio className={`w-4 h-4 ${isAttackMode ? 'text-[#E85C68] animate-ping' : 'text-[#62C073] animate-pulse'}`} />
            <span>{isAttackMode ? 'ATTACK ACTIVE' : 'LIVE SOC'}</span>
          </div>
        </div>
      </div>

      {/* 1. Large Security Command Center Hero */}
      <SecurityHero />

      {/* 2. Primary KPI Cards Row (4 Key Stats with Distinct Colors) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {initialKpiStatsData.map((stat) => (
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
