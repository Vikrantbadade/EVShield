import React from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { Server, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';

export const StationStatusGrid: React.FC = () => {
  const { chargingStations } = useSecurity();

  return (
    <div className="glass-sand rounded-[32px] p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#CEAB93]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E3CAA5]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[#AD8B73]/18 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/70 border border-white/90 text-[#AD8B73] shadow-glass-sm">
              <Server className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xl font-bold text-[#3F3832]">Infrastructure Node Topology</h3>
          </div>
          <p className="text-xs text-[#514940] mt-1">EV charging authentication gateway status across regions</p>
        </div>

        <StatusChip label="DEMO INFRASTRUCTURE" variant="demo" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        {chargingStations.map((station) => {
          const isAttack = station.status === 'UNDER ATTACK';

          return (
            <div
              key={station.id}
              className={`rounded-2xl p-5 border transition-all duration-300 ${
                isAttack
                  ? 'glass-danger !border-[#E85C68]/40 shadow-glow-red'
                  : 'glass-cream hover:bg-white/80 shadow-glass-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-[#AD8B73] flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-[#19BFA3]" />
                  {station.id}
                </span>
                <StatusChip
                  label={station.status}
                  variant={isAttack ? 'critical' : 'protected'}
                  dot
                  pulse={isAttack}
                  icon={isAttack ? <AlertTriangle className="w-3 h-3 text-[#E85C68]" /> : <ShieldCheck className="w-3 h-3 text-[#62C073]" />}
                />
              </div>

              <h4 className="text-sm font-bold text-[#3F3832] mb-1">{station.name}</h4>
              <p className="text-xs text-[#7A7067] font-mono">{station.location}</p>

              <div className="mt-4 pt-3 border-t border-[#AD8B73]/15 flex items-center justify-between text-xs font-mono">
                <span className="text-[#7A7067]">Throughput:</span>
                <span className={`font-extrabold ${isAttack ? 'text-[#a82d38]' : 'text-[#3F3832]'}`}>
                  {station.requestsPerSec.toLocaleString()} req/s
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
