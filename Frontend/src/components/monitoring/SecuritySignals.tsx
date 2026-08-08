import React from 'react';
import { SecuritySignal } from '../../types/monitoring';
import { StatusChip } from '../ui/StatusChip';
import { Cpu } from 'lucide-react';

interface SecuritySignalsPanelProps {
  signals: SecuritySignal[];
  isAttackMode: boolean;
}

export const SecuritySignalsPanel: React.FC<SecuritySignalsPanelProps> = ({ signals, isAttackMode }) => {
  const getBarColor = (status: SecuritySignal['status']) => {
    if (status === 'CRITICAL') return 'bg-[#E85C68]';
    if (status === 'ELEVATED') return 'bg-[#D99A32]';
    return 'bg-[#19BFA3]';
  };

  const getTextColor = (status: SecuritySignal['status']) => {
    if (status === 'CRITICAL') return 'text-[#a82d38]';
    if (status === 'ELEVATED') return 'text-[#a8731d]';
    return 'text-[#0d7a67]';
  };

  return (
    <div className="glass-peach rounded-[32px] p-6 sm:p-8 space-y-6 shadow-glass border border-white/90 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/70 border border-white/90 text-[#AD8B73] shadow-glass-sm">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-[#3F3832]">Security Signals</h3>
          </div>
          <p className="text-xs text-[#514940] mt-1">Live threat indicator signals from ML detection engine</p>
        </div>
        <StatusChip label={isAttackMode ? 'ALERT' : 'NOMINAL'} variant={isAttackMode ? 'critical' : 'live'} dot pulse={isAttackMode} />
      </div>

      {/* Signal Bars */}
      <div className="space-y-4">
        {signals.map((sig) => (
          <div key={sig.id} className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#514940] font-medium">{sig.label}</span>
              <span className={`font-extrabold ${getTextColor(sig.status)}`}>{sig.value}</span>
            </div>
            <div className="h-2 rounded-full bg-white/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${getBarColor(sig.status)} ${
                  sig.status === 'CRITICAL' ? 'animate-pulse' : ''
                }`}
                style={{ width: `${sig.percent}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-[#7A7067] text-right">{sig.status}</div>
          </div>
        ))}
      </div>

      <div className="text-[10px] font-mono text-center text-[#7A7067] pt-2 border-t border-[#AD8B73]/15">
        DEMO • ML Detection Engine v1.0 • Synthetic Signal Data
      </div>
    </div>
  );
};
