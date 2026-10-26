import React from 'react';
import { AttackFeedItem } from '../../types';
import { Radio, ShieldAlert, AlertTriangle, Activity, CheckCircle2 } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';

interface LiveAttackFeedProps {
  feed: AttackFeedItem[];
}

export const LiveAttackFeed: React.FC<LiveAttackFeedProps> = ({ feed }) => {
  const getBadgeVariant = (severity: AttackFeedItem['severity']) => {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high':     return 'threat';
      case 'medium':   return 'demo';
      default:         return 'protected';
    }
  };

  const getIcon = (severity: AttackFeedItem['severity']) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert className="w-4 h-4 text-[#FB7185]" />;
      case 'high':
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-[#FBBF24]" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-[#34D399]" />;
    }
  };

  return (
    <div className="glass-card rounded-[32px] p-6 sm:p-8 flex flex-col justify-between h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[#C4B5FD]/16">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 text-[#4DD9F0]">
              <Radio className="w-4.5 h-4.5 animate-pulse text-[#4DD9F0]" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F3FF]">Live Event Feed</h3>
          </div>
          <p className="text-xs text-[#C4C2D6] mt-1">Real-time authentication gateway telemetry stream</p>
        </div>

        <StatusChip label="STREAM LIVE" variant="live" dot pulse />
      </div>

      {/* Event Stream List */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
        {feed.map((item) => (
          <div
            key={item.id}
            className="bg-[#252542] border border-[#C4B5FD]/16 rounded-2xl p-4 flex items-center justify-between gap-3 hover:bg-[#303052] transition-all duration-200 shadow-sm animate-slide-in-up"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-2 rounded-xl bg-[#1D1D35] border border-[#C4B5FD]/20 shrink-0">
                {getIcon(item.severity)}
              </div>

              <div className="min-w-0">
                <div className="text-xs font-bold text-[#F5F3FF] truncate">{item.title}</div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#9896B0] mt-0.5">
                  <span className="text-[#9B7BFF] font-semibold">{item.nodeId}</span>
                  <span>&bull;</span>
                  <span>{item.type}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0 gap-1.5">
              <span className="text-xs font-mono font-bold text-[#4DD9F0]">{item.time}</span>
              <StatusChip label={item.severity.toUpperCase()} variant={getBadgeVariant(item.severity)} />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-[#C4B5FD]/16 flex items-center justify-between text-[11px] font-mono text-[#9896B0]">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#4DD9F0]" />
          <span>EV Charging Authentication Gateways</span>
        </div>
        <StatusChip label="DEMO FEED" variant="demo" />
      </div>
    </div>
  );
};
