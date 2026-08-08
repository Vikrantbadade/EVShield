import React from 'react';
import { ChargingRegion } from '../../types/station';
import { StatusChip } from '../ui/StatusChip';
import { X, Server, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RegionPanelProps {
  region: ChargingRegion;
  onClose: () => void;
}

export const RegionPanel: React.FC<RegionPanelProps> = ({ region, onClose }) => {
  const isUnderAttack = region.underAttack > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#3F3832]/20 backdrop-blur-sm" />

      <div
        className="relative z-10 glass-cream rounded-[32px] p-7 w-full max-w-md shadow-glass-hover border border-white/90 space-y-6 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusChip
                label={isUnderAttack ? 'THREAT DETECTED' : 'PROTECTED'}
                variant={isUnderAttack ? 'critical' : 'protected'}
                dot
                pulse={isUnderAttack}
              />
              <StatusChip label="DEMO" variant="demo" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#3F3832]">{region.label}</h3>
            <p className="text-xs font-mono text-[#7A7067]">EV Charging Region • {region.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/70 hover:bg-white border border-white/90 text-[#7A7067] hover:text-[#3F3832] transition-colors shadow-glass-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Station Summary */}
        <div className="grid grid-cols-3 gap-3 text-xs font-mono text-center">
          <div className="bg-[#62C073]/12 border border-[#62C073]/25 rounded-2xl px-3 py-3">
            <div className="text-[#7A7067] text-[10px]">Protected</div>
            <div className="text-xl font-extrabold text-[#2b703b]">{region.protected}</div>
          </div>
          <div className="bg-[#D99A32]/12 border border-[#D99A32]/25 rounded-2xl px-3 py-3">
            <div className="text-[#7A7067] text-[10px]">Degraded</div>
            <div className="text-xl font-extrabold text-[#a8731d]">{region.degraded}</div>
          </div>
          <div className={`${isUnderAttack ? 'bg-[#E85C68]/15 border-[#E85C68]/30' : 'bg-white/60 border-white/80'} rounded-2xl px-3 py-3`}>
            <div className="text-[#7A7067] text-[10px]">Under Attack</div>
            <div className={`text-xl font-extrabold ${isUnderAttack ? 'text-[#a82d38]' : 'text-[#3F3832]'}`}>{region.underAttack}</div>
          </div>
        </div>

        {/* Telemetry */}
        <div className="space-y-3 text-xs font-mono">
          {[
            { label: 'Total Stations',  value: region.totalStations.toLocaleString(),              icon: Server,       highlight: false },
            { label: 'Auth Traffic',    value: `${region.requestsPerSec.toLocaleString()} req/s`,  icon: Activity,     highlight: isUnderAttack },
            { label: 'Network Health',  value: `${region.healthPercent}%`,                          icon: ShieldCheck,  highlight: region.healthPercent < 80 },
            { label: 'Avg Latency',     value: `${region.latencyMs} ms`,                           icon: AlertTriangle,highlight: region.latencyMs > 100 },
          ].map(({ label, value, icon: Icon, highlight }) => (
            <div key={label} className="flex items-center justify-between bg-white/60 rounded-2xl px-4 py-2.5 border border-white/85">
              <div className="flex items-center gap-2 text-[#514940]">
                <Icon className="w-3.5 h-3.5 text-[#AD8B73]" />
                {label}
              </div>
              <span className={`font-extrabold ${highlight ? 'text-[#a82d38]' : 'text-[#3F3832]'}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
