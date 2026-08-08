import React from 'react';
import { DemoStation } from '../../types/station';
import { StatusChip } from '../ui/StatusChip';
import { Activity, Cpu, Clock } from 'lucide-react';

interface StationCardProps {
  station: DemoStation;
  onClick: () => void;
}

export const StationCard: React.FC<StationCardProps> = ({ station, onClick }) => {
  const isAttack = station.status === 'UNDER ATTACK';
  const isDegraded = station.status === 'DEGRADED';

  const cardClass = isAttack
    ? 'glass-danger'
    : isDegraded
    ? 'glass-sand'
    : 'glass-cream';

  const chipVariant = isAttack ? 'critical' : isDegraded ? 'threat' : 'protected';

  return (
    <div
      onClick={onClick}
      className={`${cardClass} rounded-[24px] p-5 space-y-4 cursor-pointer hover:-translate-y-1 transition-all duration-300 border border-white/90 shadow-glass-sm group`}
      role="button"
      aria-label={`${station.name} station card`}
    >
      {/* Station ID + Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Activity className={`w-3.5 h-3.5 ${isAttack ? 'text-[#E85C68] animate-pulse' : 'text-[#19BFA3]'}`} />
          <span className="text-xs font-mono font-extrabold text-[#AD8B73]">{station.id}</span>
        </div>
        <StatusChip
          label={station.status}
          variant={chipVariant}
          dot
          pulse={isAttack}
        />
      </div>

      {/* Station Name + Region */}
      <div>
        <h4 className="text-sm font-bold text-[#3F3832] leading-snug group-hover:text-[#19BFA3] transition-colors">{station.name}</h4>
        <p className="text-[11px] font-mono text-[#7A7067] mt-0.5">{station.regionLabel}</p>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div className="bg-white/50 rounded-xl px-2.5 py-2 space-y-0.5">
          <div className="text-[#7A7067]">Req/sec</div>
          <div className={`font-extrabold ${isAttack ? 'text-[#a82d38]' : 'text-[#3F3832]'}`}>{station.requestsPerSec.toLocaleString()}</div>
        </div>
        <div className="bg-white/50 rounded-xl px-2.5 py-2 space-y-0.5">
          <div className="text-[#7A7067]">Latency</div>
          <div className={`font-extrabold ${isAttack ? 'text-[#a82d38]' : 'text-[#3F3832]'}`}>{station.latencyMs} ms</div>
        </div>
        <div className="bg-white/50 rounded-xl px-2.5 py-2 space-y-0.5">
          <div className="text-[#7A7067]">Health</div>
          <div className={`font-extrabold ${station.healthPercent < 80 ? 'text-[#a82d38]' : 'text-[#2b703b]'}`}>{station.healthPercent}%</div>
        </div>
        <div className="bg-white/50 rounded-xl px-2.5 py-2 space-y-0.5">
          <div className="text-[#7A7067]">Chargers</div>
          <div className="font-extrabold text-[#3F3832]">{station.connectedChargers}</div>
        </div>
      </div>

      {/* ML Status */}
      <div className="flex items-center gap-2 bg-white/50 rounded-xl px-3 py-2 text-[11px] font-mono border border-white/70">
        <Cpu className={`w-3 h-3 ${station.mlStatus === 'ATTACK DETECTED' ? 'text-[#E85C68]' : 'text-[#19BFA3]'}`} />
        <span className="text-[#514940]">ML:</span>
        <span className={`font-bold ${station.mlStatus === 'ATTACK DETECTED' ? 'text-[#a82d38]' : 'text-[#0d7a67]'}`}>{station.mlStatus}</span>
        {station.mlConfidence && <span className="text-[#7A7067]">({station.mlConfidence}%)</span>}
      </div>

      {/* Last Event */}
      <div className="flex items-start gap-2 text-[10px] font-mono text-[#7A7067] leading-relaxed">
        <Clock className="w-3 h-3 shrink-0 mt-0.5 text-[#AD8B73]" />
        <span className="truncate">{station.lastEvent}</span>
      </div>
    </div>
  );
};
