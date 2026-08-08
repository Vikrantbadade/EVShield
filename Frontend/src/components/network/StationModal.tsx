import React from 'react';
import { DemoStation } from '../../types/station';
import { StatusChip } from '../ui/StatusChip';
import { X, Activity, Cpu, Clock, Zap, Server, ShieldCheck, AlertTriangle } from 'lucide-react';

interface StationModalProps {
  station: DemoStation;
  onClose: () => void;
}

export const StationModal: React.FC<StationModalProps> = ({ station, onClose }) => {
  const isAttack = station.status === 'UNDER ATTACK';
  const isDegraded = station.status === 'DEGRADED';
  const chipVariant = isAttack ? 'critical' : isDegraded ? 'threat' : 'protected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#3F3832]/20 backdrop-blur-sm" />

      {/* Modal Panel */}
      <div
        className="relative z-10 glass-cream rounded-[32px] p-7 w-full max-w-lg shadow-glass-hover border border-white/90 space-y-6 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-extrabold text-[#AD8B73]">{station.id}</span>
              <StatusChip label={station.status} variant={chipVariant} dot pulse={isAttack} />
              <StatusChip label="DEMO" variant="demo" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#3F3832]">{station.name}</h3>
            <p className="text-xs font-mono text-[#7A7067]">{station.regionLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/70 hover:bg-white border border-white/90 text-[#7A7067] hover:text-[#3F3832] transition-colors shadow-glass-sm shrink-0"
            aria-label="Close station detail"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
          {[
            { label: 'Traffic',     value: `${station.requestsPerSec.toLocaleString()} req/s`, icon: Activity, highlight: isAttack },
            { label: 'Latency',     value: `${station.latencyMs} ms`,   icon: Zap,        highlight: station.latencyMs > 100 },
            { label: 'Health',      value: `${station.healthPercent}%`, icon: ShieldCheck, highlight: station.healthPercent < 80 },
            { label: 'Error Rate',  value: `${station.errorRatePercent}%`, icon: AlertTriangle, highlight: station.errorRatePercent > 5 },
            { label: 'Chargers',    value: `${station.connectedChargers} connected`, icon: Server, highlight: false },
            { label: 'Region',      value: station.regionLabel, icon: Server, highlight: false },
          ].map(({ label, value, icon: Icon, highlight }) => (
            <div key={label} className="bg-white/60 backdrop-blur-xl rounded-2xl px-3.5 py-3 space-y-1 border border-white/85 shadow-glass-sm">
              <div className="text-[#7A7067] flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {label}
              </div>
              <div className={`font-extrabold ${highlight ? 'text-[#a82d38]' : 'text-[#3F3832]'}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* ML Detection Section */}
        <div className={`rounded-2xl p-4 space-y-2 border ${
          station.mlStatus === 'ATTACK DETECTED'
            ? 'bg-[#E85C68]/10 border-[#E85C68]/25'
            : 'bg-[#19BFA3]/08 border-[#19BFA3]/20'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold text-[#3F3832]">
            <Cpu className={`w-4 h-4 ${station.mlStatus === 'ATTACK DETECTED' ? 'text-[#E85C68]' : 'text-[#19BFA3]'}`} />
            ML Detection Status
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={`font-extrabold ${station.mlStatus === 'ATTACK DETECTED' ? 'text-[#a82d38]' : 'text-[#0d7a67]'}`}>
              {station.mlStatus}
            </span>
            {station.mlConfidence && (
              <span className="text-[#7A7067]">Confidence: <strong className="text-[#3F3832]">{station.mlConfidence}%</strong></span>
            )}
          </div>
        </div>

        {/* Last Event */}
        <div className="bg-white/50 rounded-2xl px-4 py-3 flex items-start gap-2 text-xs font-mono text-[#514940]">
          <Clock className="w-3.5 h-3.5 text-[#AD8B73] shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] text-[#7A7067] mb-0.5">Last Security Event</div>
            {station.lastEvent}
          </div>
        </div>
      </div>
    </div>
  );
};
