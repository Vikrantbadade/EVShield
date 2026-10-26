import React from 'react';
import { AffectedStationInfo } from '../../types/attack';
import { Server, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';

interface AffectedStationsProps {
  stations: AffectedStationInfo[];
}

export const AffectedStations: React.FC<AffectedStationsProps> = ({ stations }) => {
  return (
    <div className="glass-card rounded-[32px] p-6 sm:p-7 space-y-5 border border-[#C4B5FD]/16 shadow-glass">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 text-[#4DD9F0]">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F3FF] tracking-tight">
              Affected Charging Infrastructure
            </h3>
          </div>
          <p className="text-xs text-[#C4C2D6] mt-1">
            Charging station nodes impacted during the authentication burst
          </p>
        </div>

        <StatusChip
          label={`${stations.length} ${stations.length === 1 ? 'NODE' : 'NODES'}`}
          variant={stations.some((s) => s.status === 'UNDER ATTACK') ? 'critical' : 'demo'}
        />
      </div>

      {/* Responsive Station Cards Grid */}
      {stations.length === 0 ? (
        <div className="rounded-2xl p-8 text-center bg-[#14142B]/40 border border-[#C4B5FD]/10">
          <div className="mx-auto w-10 h-10 rounded-xl bg-[#34D399]/15 border border-[#34D399]/30 flex items-center justify-center text-[#34D399] mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-mono text-[#C4C2D6]">
            All charging infrastructure operational within baseline parameters.
          </p>
        </div>
      ) : (
        <div className={`grid gap-4 ${stations.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {stations.map((st) => {
            const isAttack = st.status === 'UNDER ATTACK';
            const isDegraded = st.status === 'DEGRADED';

            return (
              <div
                key={st.id}
                className={`rounded-2xl p-5 flex flex-col justify-between space-y-4 bg-[#14142B]/85 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 border ${
                  isAttack
                    ? 'border-[#FB7185]/35 shadow-lg shadow-black/40 ring-1 ring-[#FB7185]/20'
                    : isDegraded
                    ? 'border-[#FBBF24]/30 shadow-lg shadow-black/40'
                    : 'border-[#C4B5FD]/16 shadow-md shadow-black/30'
                }`}
              >
                {/* Header Row: Station ID & Separated Attack Status Badge */}
                <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={`p-1.5 rounded-lg border shrink-0 ${
                        isAttack
                          ? 'bg-[#FB7185]/15 border-[#FB7185]/35 text-[#FB7185]'
                          : isDegraded
                          ? 'bg-[#FBBF24]/15 border-[#FBBF24]/35 text-[#FBBF24]'
                          : 'bg-[#4DD9F0]/15 border-[#4DD9F0]/35 text-[#4DD9F0]'
                      }`}
                    >
                      {isAttack ? (
                        <ShieldAlert className="w-3.5 h-3.5" />
                      ) : (
                        <Activity className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span className="font-mono text-xs font-extrabold text-[#F5F3FF] tracking-wider whitespace-nowrap">
                      {st.id}
                    </span>
                  </div>

                  <div className="shrink-0">
                    <StatusChip
                      label={st.status}
                      variant={isAttack ? 'critical' : isDegraded ? 'threat' : 'protected'}
                      dot
                      pulse={isAttack}
                    />
                  </div>
                </div>

                {/* Station Information */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#F5F3FF] tracking-tight leading-snug break-words">
                    {st.name}
                  </h4>
                  <p className="text-xs text-[#9896B0] font-mono leading-relaxed break-words">
                    {st.location}
                  </p>
                </div>

                {/* Metrics Row */}
                <div className="pt-3 border-t border-[#C4B5FD]/14 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#C4C2D6]">Request Rate</span>
                  <span
                    className={`font-bold font-mono px-2.5 py-1 rounded-lg border text-xs shrink-0 ${
                      isAttack
                        ? 'text-[#FB7185] bg-[#FB7185]/12 border-[#FB7185]/30'
                        : isDegraded
                        ? 'text-[#FBBF24] bg-[#FBBF24]/12 border-[#FBBF24]/30'
                        : 'text-[#34D399] bg-[#34D399]/12 border-[#34D399]/30'
                    }`}
                  >
                    {st.requestsPerSec.toLocaleString()} req/s
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
