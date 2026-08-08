import React from 'react';
import { KpiStat } from '../../types';
import { useSecurity } from '../../context/SecurityContext';
import { Zap, Server, Cpu, ShieldAlert } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';

const iconMap: Record<string, React.ElementType> = { Zap, Server, Cpu, ShieldAlert };

// Color variant mapping for distinct visual rhythm
const cardVariantMap: Record<string, 'cream' | 'peach' | 'sand' | 'blue' | 'white'> = {
  'total-requests': 'cream',
  'active-threats': 'peach',
  'affected-nodes': 'sand',
  'ml-accuracy':    'blue',
};

interface StatCardProps { stat: KpiStat; }

export const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  const { activeThreats } = useSecurity();
  const IconComponent = iconMap[stat.iconName] || Zap;

  const displayValue = stat.id === 'active-threats' ? activeThreats.toString() : stat.value;
  const isDanger = stat.id === 'active-threats' && activeThreats > 0;

  const variant = isDanger ? 'danger' : cardVariantMap[stat.id] || 'white';

  return (
    <div
      className={`glass-${variant} rounded-[24px] p-6 flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-all duration-300 shadow-glass-sm`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div
          className="p-2.5 rounded-xl border"
          style={isDanger
            ? { background: 'rgba(232,92,104,0.14)', borderColor: 'rgba(232,92,104,0.30)' }
            : { background: 'rgba(255,255,255,0.70)', borderColor: 'rgba(255,255,255,0.90)' }
          }
        >
          <IconComponent className={`w-4 h-4 ${isDanger ? 'text-[#E85C68]' : 'text-[#AD8B73]'}`} />
        </div>
        {stat.isDemo && <StatusChip label="DEMO" variant="demo" />}
      </div>

      {/* Metric */}
      <div className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${
        isDanger ? 'text-[#a82d38]' : 'text-[#3F3832]'
      }`}>
        {displayValue}
      </div>

      {/* Label + Change */}
      <div className="pt-3 border-t border-[#AD8B73]/15 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#514940] uppercase tracking-wider">{stat.label}</span>
        {stat.change && (
          <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${
            isDanger
              ? 'bg-[#E85C68]/15 text-[#a82d38]'
              : 'bg-[#62C073]/15 text-[#2b703b]'
          }`}>
            {isDanger ? '1 INCIDENT' : stat.change}
          </span>
        )}
      </div>
    </div>
  );
};
