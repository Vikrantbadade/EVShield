import React from 'react';
import { Activity, Zap, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TelemetryMetricsProps {
  isAttackMode: boolean;
  requestsPerSec: number;
}

export const TelemetryMetrics: React.FC<TelemetryMetricsProps> = ({ isAttackMode, requestsPerSec }) => {
  const metrics = [
    {
      label: 'Auth Requests / sec',
      value: requestsPerSec.toLocaleString(),
      unit: 'req/s',
      icon: Activity,
      variant: 'cream' as const,
      highlight: isAttackMode,
    },
    {
      label: 'Active Connections',
      value: isAttackMode ? '18,450' : '18,420',
      unit: 'live',
      icon: Zap,
      variant: 'blue' as const,
      highlight: false,
    },
    {
      label: 'Avg Auth Latency',
      value: isAttackMode ? '142' : '42',
      unit: 'ms',
      icon: Clock,
      variant: 'sand' as const,
      highlight: isAttackMode,
    },
    {
      label: 'Error Rate',
      value: isAttackMode ? '28.4' : '0.3',
      unit: '%',
      icon: AlertTriangle,
      variant: 'peach' as const,
      highlight: isAttackMode,
    },
    {
      label: 'Auth Success Rate',
      value: isAttackMode ? '71.6' : '99.7',
      unit: '%',
      icon: ShieldCheck,
      variant: 'taupe' as const,
      highlight: isAttackMode,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {metrics.map(({ label, value, unit, icon: Icon, variant, highlight }) => (
        <div
          key={label}
          className={`glass-${variant} rounded-[24px] p-5 space-y-2.5 shadow-glass-sm hover:-translate-y-0.5 transition-all`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-[#7A7067] uppercase leading-tight">{label}</span>
            <div className="p-1.5 rounded-xl bg-white/70 border border-white/90">
              <Icon className={`w-3.5 h-3.5 ${highlight ? 'text-[#E85C68]' : 'text-[#19BFA3]'}`} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-extrabold font-mono ${highlight ? 'text-[#a82d38]' : 'text-[#3F3832]'} tracking-tight`}>
              {value}
            </span>
            <span className="text-xs text-[#7A7067] font-mono">{unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
