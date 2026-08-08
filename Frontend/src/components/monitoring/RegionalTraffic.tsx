import React from 'react';
import { RegionalTrafficEntry } from '../../types/monitoring';
import { StatusChip } from '../ui/StatusChip';
import { Activity, Globe } from 'lucide-react';

interface RegionalTrafficPanelProps {
  entries: RegionalTrafficEntry[];
  isAttackMode: boolean;
}

export const RegionalTrafficPanel: React.FC<RegionalTrafficPanelProps> = ({ entries }) => {
  return (
    <div className="glass-sand rounded-[32px] p-6 sm:p-8 space-y-6 shadow-glass border border-white/90 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/70 border border-white/90 text-[#AD8B73] shadow-glass-sm">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-[#3F3832]">Regional Traffic</h3>
          </div>
          <p className="text-xs text-[#514940] mt-1">Per-region EV auth request throughput and health</p>
        </div>
        <StatusChip label="5 REGIONS" variant="demo" />
      </div>

      {/* Region Rows */}
      <div className="space-y-3">
        {entries.map((entry) => {
          const isThreat = entry.status === 'THREAT DETECTED';

          return (
            <div
              key={entry.regionId}
              className={`rounded-2xl px-4 py-3 border shadow-glass-sm transition-all ${
                isThreat
                  ? 'bg-[#E85C68]/08 border-[#E85C68]/20'
                  : 'bg-white/60 backdrop-blur-xl border-white/85'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Region Name */}
                <div className="flex items-center gap-2 min-w-[90px]">
                  <Activity className={`w-3.5 h-3.5 ${isThreat ? 'text-[#E85C68] animate-pulse' : 'text-[#19BFA3]'}`} />
                  <span className="text-sm font-bold text-[#3F3832]">{entry.region}</span>
                </div>

                {/* Health bar */}
                <div className="flex-1 mx-4">
                  <div className="h-1.5 rounded-full bg-white/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isThreat ? 'bg-[#E85C68]' : 'bg-[#19BFA3]'
                      }`}
                      style={{ width: `${entry.healthPercent}%` }}
                    />
                  </div>
                </div>

                {/* Traffic and latency */}
                <div className="text-right space-y-0.5 shrink-0">
                  <div className={`text-xs font-mono font-extrabold ${isThreat ? 'text-[#a82d38]' : 'text-[#3F3832]'}`}>
                    {entry.requestsPerSec.toLocaleString()} req/s
                  </div>
                  <div className="text-[10px] font-mono text-[#7A7067]">{entry.latencyMs} ms avg</div>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  <StatusChip
                    label={entry.status}
                    variant={isThreat ? 'critical' : 'protected'}
                    dot
                    pulse={isThreat}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
