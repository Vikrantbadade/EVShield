import React from 'react';
import { DemoStation } from '../../types/station';
import { StatusChip } from '../ui/StatusChip';
import CardFlip from '../kokonutui/card-flip';
import {
  Server,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Clock,
  Cpu,
  RefreshCw,
  Radio,
} from 'lucide-react';

interface StationFlickCardProps {
  station: DemoStation;
  onClose?: () => void;
}

export const StationCardFront: React.FC<{ station: DemoStation }> = ({ station }) => {
  const isAttack = station.status === 'UNDER ATTACK';
  const isDegraded = station.status === 'DEGRADED';
  const statusVariant = isAttack ? 'critical' : isDegraded ? 'threat' : 'protected';

  return (
    <div className="flex h-full flex-col justify-between p-6 bg-gradient-to-b from-[#17172E]/95 via-[#131326]/95 to-[#0E0E1C]/95 text-[#F5F3FF] select-none">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-[#8055F6]/20 border border-[#8055F6]/35 font-mono text-[11px] font-bold text-[#C4B5FD]">
              {station.id}
            </span>
            <StatusChip label={station.status} variant={statusVariant} dot pulse={isAttack} />
          </div>
          <span className="text-[10px] font-mono text-[#9896B0] uppercase tracking-wider">
            Station Node
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-[#F5F3FF] tracking-tight">
            {station.name}
          </h3>
          <p className="text-xs text-[#C4C2D6]">
            {station.regionLabel} Cluster
          </p>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="space-y-3 my-auto">
        <div className="p-3.5 rounded-2xl bg-[#1C1C36]/70 border border-[#C4B5FD]/16 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#8055F6]/20 text-[#9B7BFF]">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-[#9896B0]">Connected Chargers</div>
              <div className="text-lg font-extrabold font-mono text-[#F5F3FF]">
                {station.connectedChargers} Active
              </div>
            </div>
          </div>
          <span className="text-xs font-mono text-[#34D399] bg-[#34D399]/10 px-2 py-1 rounded-lg border border-[#34D399]/20">
            Online
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center font-mono">
          <div className="p-2.5 rounded-xl bg-[#34D399]/10 border border-[#34D399]/25 flex flex-col justify-between">
            <span className="text-[10px] text-[#34D399] font-semibold flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Health
            </span>
            <span className="text-base font-extrabold text-[#34D399] mt-1">{station.healthPercent}%</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#1C1C36]/60 border border-[#C4B5FD]/16 flex flex-col justify-between">
            <span className="text-[10px] text-[#C4C2D6] font-semibold flex items-center justify-center gap-1">
              <Activity className="w-3 h-3 text-[#4DD9F0]" /> Traffic
            </span>
            <span className="text-base font-extrabold text-[#4DD9F0] mt-1">{station.requestsPerSec} req/s</span>
          </div>
        </div>

        {/* Last Event */}
        <div className="p-2.5 rounded-xl bg-[#1C1C36]/50 border border-[#C4B5FD]/12 flex items-start gap-2 text-xs font-mono text-[#C4C2D6]">
          <Clock className="w-3.5 h-3.5 text-[#9B7BFF] shrink-0 mt-0.5" />
          <div className="truncate">
            <div className="text-[9px] uppercase text-[#9896B0]">Last Event</div>
            <div className="truncate">{station.lastEvent}</div>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="pt-3 border-t border-[#C4B5FD]/14 flex items-center justify-between text-[11px] font-mono text-[#9896B0]">
        <div className="flex items-center gap-1.5 text-[#C4B5FD]">
          <RefreshCw className="w-3 h-3 animate-spin text-[#9B7BFF]" style={{ animationDuration: '8s' }} />
          <span>Click or drag to flip</span>
        </div>
        <span className="text-[10px] text-[#9896B0]/70">1 / 2</span>
      </div>
    </div>
  );
};

export const StationCardBack: React.FC<{ station: DemoStation }> = ({ station }) => {
  return (
    <div className="flex h-full flex-col justify-between p-6 bg-gradient-to-b from-[#17172E]/95 via-[#131326]/95 to-[#0E0E1C]/95 text-[#F5F3FF] select-none">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-[#4DD9F0]/15 border border-[#4DD9F0]/30 font-mono text-[11px] font-bold text-[#4DD9F0]">
              TELEMETRY
            </span>
            <span className="text-[10px] font-mono text-[#9896B0] uppercase">{station.id}</span>
          </div>
          <span className="text-xs font-mono font-bold text-[#9B7BFF]">{station.region}</span>
        </div>

        <h4 className="text-lg font-bold text-[#F5F3FF] tracking-tight">
          Station Diagnostics
        </h4>
      </div>

      {/* Telemetry Rows */}
      <div className="space-y-2.5 my-auto text-xs font-mono">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C1C36]/60 border border-[#C4B5FD]/14">
          <div className="flex items-center gap-2 text-[#C4C2D6]">
            <Zap className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span>Response Latency</span>
          </div>
          <span className={`font-extrabold ${station.latencyMs > 100 ? 'text-[#FB7185]' : 'text-[#F5F3FF]'}`}>
            {station.latencyMs} ms
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C1C36]/60 border border-[#C4B5FD]/14">
          <div className="flex items-center gap-2 text-[#C4C2D6]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#FB7185]" />
            <span>Error Rate</span>
          </div>
          <span className={`font-extrabold ${station.errorRatePercent > 5 ? 'text-[#FB7185]' : 'text-[#34D399]'}`}>
            {station.errorRatePercent}%
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C1C36]/60 border border-[#C4B5FD]/14">
          <div className="flex items-center gap-2 text-[#C4C2D6]">
            <Cpu className="w-3.5 h-3.5 text-[#8055F6]" />
            <span>ML Status</span>
          </div>
          <span className={`font-extrabold ${station.mlStatus === 'ATTACK DETECTED' ? 'text-[#FB7185]' : 'text-[#34D399]'}`}>
            {station.mlStatus}
          </span>
        </div>

        {station.mlConfidence && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C1C36]/60 border border-[#C4B5FD]/14">
            <div className="flex items-center gap-2 text-[#C4C2D6]">
              <Radio className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Model Confidence</span>
            </div>
            <span className="font-extrabold text-[#38BDF8]">
              {station.mlConfidence}%
            </span>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="pt-3 border-t border-[#C4B5FD]/14 flex items-center justify-between text-[11px] font-mono text-[#9896B0]">
        <div className="flex items-center gap-1.5 text-[#C4B5FD]">
          <RefreshCw className="w-3 h-3 text-[#9B7BFF]" />
          <span>Click or drag to flip back</span>
        </div>
        <span className="text-[10px] text-[#9896B0]/70">2 / 2</span>
      </div>
    </div>
  );
};

export const StationFlickCard: React.FC<StationFlickCardProps> = ({ station }) => {
  return (
    <CardFlip
      key={station.id}
      label={`${station.name} station details`}
      axis="y"
      front={<StationCardFront station={station} />}
      back={<StationCardBack station={station} />}
      className="w-[330px] sm:w-[370px] aspect-[7/10] max-w-full"
      faceClassName="rounded-3xl border border-[#C4B5FD]/25 shadow-2xl backdrop-blur-2xl"
    />
  );
};
