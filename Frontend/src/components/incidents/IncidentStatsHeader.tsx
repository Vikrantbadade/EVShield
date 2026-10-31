import React from 'react';
import { ShieldAlert, AlertTriangle, Clock, CheckCircle2, Flame } from 'lucide-react';
import { IncidentAnalyticsSummary } from '../../types/incident';

interface IncidentStatsHeaderProps {
  analytics: IncidentAnalyticsSummary | null;
  isLoading: boolean;
}

export const IncidentStatsHeader: React.FC<IncidentStatsHeaderProps> = ({ analytics, isLoading }) => {
  const cards = [
    {
      label: 'Total Incidents',
      value: analytics ? analytics.totalIncidents : '—',
      sub: `${analytics?.openIncidents ?? 0} open, ${analytics?.investigatingIncidents ?? 0} active`,
      icon: ShieldAlert,
      color: 'text-[#8055F6]',
      bg: 'bg-[#8055F6]/10',
      border: 'border-[#8055F6]/30',
    },
    {
      label: 'Critical Severity',
      value: analytics ? analytics.criticalIncidents : '—',
      sub: `${analytics?.highIncidents ?? 0} high severity`,
      icon: Flame,
      color: 'text-[#FB7185]',
      bg: 'bg-[#FB7185]/10',
      border: 'border-[#FB7185]/30',
    },
    {
      label: 'Avg Risk Score',
      value: analytics ? `${analytics.averageRiskScore}/100` : '—',
      sub: analytics?.averageRiskScore && analytics.averageRiskScore > 70 ? 'Elevated SOC Risk' : 'Nominal Network Risk',
      icon: AlertTriangle,
      color: 'text-[#FBBF24]',
      bg: 'bg-[#FBBF24]/10',
      border: 'border-[#FBBF24]/30',
    },
    {
      label: 'Mean Time to Resolve',
      value: analytics ? (analytics.mttrMinutes > 0 ? `${analytics.mttrMinutes} min` : '< 1 min') : '—',
      sub: `MTTA: ${analytics?.mttaMinutes ?? 0} min ack`,
      icon: Clock,
      color: 'text-[#4DD9F0]',
      bg: 'bg-[#4DD9F0]/10',
      border: 'border-[#4DD9F0]/30',
    },
    {
      label: 'Resolution Rate',
      value: analytics ? `${analytics.resolutionRatePercent}%` : '—',
      sub: `${analytics?.containedIncidents ?? 0} contained, ${analytics?.resolvedIncidents ?? 0} resolved`,
      icon: CheckCircle2,
      color: 'text-[#34D399]',
      bg: 'bg-[#34D399]/10',
      border: 'border-[#34D399]/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-2xl bg-[#17172A]/70 border ${card.border} backdrop-blur-md transition-all duration-200 hover:bg-[#1D1D35]/80`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#9896B0]">{card.label}</span>
              <div className={`p-1.5 rounded-lg ${card.bg} ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-[#F5F3FF]">
                {isLoading ? '...' : card.value}
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#9896B0] mt-1 truncate">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
};
