import React from 'react';
import { KpiStat } from '../../types';
import { useSecurity } from '../../context/SecurityContext';
import { Zap, Server, Cpu, ShieldAlert } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';

const iconMap: Record<string, React.ElementType> = { Zap, Server, Cpu, ShieldAlert };

interface StatCardProps { stat: KpiStat; }

export const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  const { activeThreats } = useSecurity();
  const IconComponent = iconMap[stat.iconName] || Zap;

  const displayValue = stat.id === 'active-threats' ? activeThreats.toString() : stat.value;
  const isDanger = stat.id === 'active-threats' && activeThreats > 0;

  return (
    <div
      className={`rounded-[24px] p-6 flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-all duration-300 ${
        isDanger
          ? 'glass-danger !border-[#FB7185]/40 shadow-lg shadow-[#FB7185]/10'
          : 'glass-card'
      }`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div
          className={`p-2.5 rounded-xl border ${
            isDanger
              ? 'bg-[#FB7185]/15 border-[#FB7185]/35 text-[#FB7185]'
              : 'bg-[#252542] border-[#C4B5FD]/20 text-[#9B7BFF]'
          }`}
        >
          <IconComponent className="w-4 h-4" />
        </div>
        {stat.isDemo && <StatusChip label="DEMO" variant="demo" />}
      </div>

      {/* Metric */}
      <div className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${
        isDanger ? 'text-[#FB7185]' : 'text-[#F5F3FF]'
      }`}>
        {displayValue}
      </div>

      {/* Label + Change */}
      <div className="pt-3 border-t border-[#C4B5FD]/16 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#C4C2D6] uppercase tracking-wider">{stat.label}</span>
        {stat.change && (
          <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${
            isDanger
              ? 'bg-[#FB7185]/20 text-[#FB7185]'
              : 'bg-[#34D399]/15 text-[#34D399]'
          }`}>
            {isDanger ? '1 INCIDENT' : stat.change}
          </span>
        )}
      </div>
    </div>
  );
};
