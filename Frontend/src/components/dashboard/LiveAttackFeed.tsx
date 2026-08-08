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
        return <ShieldAlert className="w-4 h-4 text-[#E85C68]" />;
      case 'high':
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-[#D99A32]" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-[#62C073]" />;
    }
  };

  return (
    <div className="glass-taupe rounded-[32px] p-6 sm:p-8 flex flex-col justify-between h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[#AD8B73]/18">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/70 border border-white/90 text-[#AD8B73] shadow-glass-sm">
              <Radio className="w-4.5 h-4.5 animate-pulse text-[#19BFA3]" />
            </div>
            <h3 className="text-xl font-bold text-[#3F3832]">Live Event Feed</h3>
          </div>
          <p className="text-xs text-[#514940] mt-1">Real-time authentication gateway telemetry stream</p>
        </div>

        <StatusChip label="STREAM LIVE" variant="live" dot pulse />
      </div>

      {/* Event Stream List */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
        {feed.map((item) => (
          <div
            key={item.id}
            className="bg-white/65 backdrop-blur-xl border border-white/85 rounded-2xl p-4 flex items-center justify-between gap-3 hover:bg-white/85 transition-all duration-200 shadow-glass-sm animate-slide-in-up"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-2 rounded-xl bg-white/80 border border-white/90 shrink-0">
                {getIcon(item.severity)}
              </div>

              <div className="min-w-0">
                <div className="text-xs font-bold text-[#3F3832] truncate">{item.title}</div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#7A7067] mt-0.5">
                  <span className="text-[#AD8B73] font-semibold">{item.nodeId}</span>
                  <span>&bull;</span>
                  <span>{item.type}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0 gap-1.5">
              <span className="text-xs font-mono font-bold text-[#0d7a67]">{item.time}</span>
              <StatusChip label={item.severity.toUpperCase()} variant={getBadgeVariant(item.severity)} />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-[#AD8B73]/18 flex items-center justify-between text-[11px] font-mono text-[#7A7067]">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#19BFA3]" />
          <span>EV Charging Authentication Gateways</span>
        </div>
        <StatusChip label="DEMO FEED" variant="demo" />
      </div>
    </div>
  );
};
