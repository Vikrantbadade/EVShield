import React from 'react';
import { AffectedStationInfo } from '../../types/attack';
import { Server, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';

interface AffectedStationsProps {
  stations: AffectedStationInfo[];
}

export const AffectedStations: React.FC<AffectedStationsProps> = ({ stations }) => {
  return (
    <div className="glass-sand rounded-[32px] p-6 sm:p-8 space-y-6 shadow-glass border border-white/90">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/70 border border-white/90 text-[#AD8B73] shadow-glass-sm">
              <Server className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xl font-bold text-[#3F3832]">Affected Charging Infrastructure</h3>
          </div>
          <p className="text-xs text-[#514940] mt-1">Charging station nodes impacted during the authentication burst</p>
        </div>

        <StatusChip label={`${stations.length} STATIONS`} variant="demo" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stations.map((st) => {
          const isAttack = st.status === 'UNDER ATTACK';
          const isDegraded = st.status === 'DEGRADED';

          const cardVariant = isAttack ? 'glass-danger' : isDegraded ? 'glass-sand' : 'glass-cream';

          return (
            <div
              key={st.id}
              className={`${cardVariant} rounded-2xl p-5 space-y-3 shadow-glass-sm hover:-translate-y-1 transition-all border border-white/90`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#AD8B73] flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-[#19BFA3]" />
                  {st.id}
                </span>
                <StatusChip
                  label={st.status}
                  variant={isAttack ? 'critical' : isDegraded ? 'threat' : 'protected'}
                  dot
                  pulse={isAttack}
                  icon={isAttack ? <AlertTriangle className="w-3 h-3 text-[#E85C68]" /> : <ShieldCheck className="w-3 h-3 text-[#62C073]" />}
                />
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#3F3832]">{st.name}</h4>
                <p className="text-xs text-[#7A7067] font-mono mt-0.5">{st.location}</p>
              </div>

              <div className="pt-3 border-t border-[#AD8B73]/15 flex items-center justify-between text-xs font-mono">
                <span className="text-[#7A7067]">Request Rate:</span>
                <span className={`font-extrabold ${isAttack ? 'text-[#a82d38]' : 'text-[#3F3832]'}`}>
                  {st.requestsPerSec.toLocaleString()} req/s
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
