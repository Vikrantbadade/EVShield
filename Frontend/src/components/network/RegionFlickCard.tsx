import React from 'react';
import { ChargingRegion } from '../../types/station';
import { StatusChip } from '../ui/StatusChip';
import CardFlip from '../kokonutui/card-flip';
import {
  Server,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Globe,
  Radio,
  RefreshCw,
  Cpu,
} from 'lucide-react';

interface RegionFlickCardProps {
  region: ChargingRegion;
  onClose?: () => void;
}

export const RegionCardFront: React.FC<{ region: ChargingRegion }> = ({ region }) => {
  const isAttack = region.underAttack > 0;
  const isDegraded = region.degraded > 0;
  const statusLabel = isAttack ? 'UNDER ATTACK' : isDegraded ? 'DEGRADED' : 'PROTECTED';
  const statusVariant = isAttack ? 'critical' : isDegraded ? 'threat' : 'protected';

  return (
    <div className="flex h-full flex-col justify-between p-6 bg-gradient-to-b from-[#17172E]/95 via-[#131326]/95 to-[#0E0E1C]/95 text-[#F5F3FF] select-none">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-[#8055F6]/20 border border-[#8055F6]/35 font-mono text-[11px] font-bold text-[#C4B5FD]">
              {region.id}
            </span>
            <StatusChip label={statusLabel} variant={statusVariant} dot pulse={isAttack} />
          </div>
          <span className="text-[10px] font-mono text-[#9896B0] uppercase tracking-wider">
            Region Hub
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-extrabold text-[#F5F3FF] tracking-tight flex items-center gap-2">
            {region.label}
          </h3>
          <p className="text-xs text-[#C4C2D6]">
            Regional EV charging authentication cluster
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
              <div className="text-[10px] font-mono uppercase text-[#9896B0]">Total Stations</div>
              <div className="text-lg font-extrabold font-mono text-[#F5F3FF]">
                {region.totalStations.toLocaleString()}
              </div>
            </div>
          </div>
          <span className="text-xs font-mono text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-1 rounded-lg border border-[#38BDF8]/20">
            Active Hub
          </span>
        </div>

        {/* 3-Column Status Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <div className="p-2.5 rounded-xl bg-[#34D399]/10 border border-[#34D399]/25 flex flex-col justify-between">
            <span className="text-[10px] text-[#34D399] font-semibold flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Safe
            </span>
            <span className="text-base font-extrabold text-[#34D399] mt-1">{region.protected}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/25 flex flex-col justify-between">
            <span className="text-[10px] text-[#FBBF24] font-semibold flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Degr.
            </span>
            <span className="text-base font-extrabold text-[#FBBF24] mt-1">{region.degraded}</span>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex flex-col justify-between ${
              isAttack
                ? 'bg-[#FB7185]/20 border-[#FB7185]/40 text-[#FB7185] animate-pulse'
                : 'bg-[#252542]/40 border-[#C4B5FD]/16 text-[#9896B0]'
            }`}
          >
            <span className="text-[10px] font-semibold flex items-center justify-center gap-1">
              <Radio className="w-3 h-3" /> Attack
            </span>
            <span className={`text-base font-extrabold mt-1 ${isAttack ? 'text-[#FB7185]' : 'text-[#F5F3FF]'}`}>
              {region.underAttack}
            </span>
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

export const RegionCardBack: React.FC<{ region: ChargingRegion }> = ({ region }) => {
  const isAttack = region.underAttack > 0;

  return (
    <div className="flex h-full flex-col justify-between p-6 bg-gradient-to-b from-[#17172E]/95 via-[#131326]/95 to-[#0E0E1C]/95 text-[#F5F3FF] select-none">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-[#4DD9F0]/15 border border-[#4DD9F0]/30 font-mono text-[11px] font-bold text-[#4DD9F0]">
              TELEMETRY
            </span>
            <span className="text-[10px] font-mono text-[#9896B0] uppercase">{region.id} NODE</span>
          </div>
          <span className="text-xs font-mono font-bold text-[#9B7BFF]">{region.label}</span>
        </div>

        <h4 className="text-lg font-bold text-[#F5F3FF] tracking-tight">
          Live Network Signals
        </h4>
      </div>

      {/* Telemetry Rows */}
      <div className="space-y-2.5 my-auto text-xs font-mono">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C1C36]/60 border border-[#C4B5FD]/14">
          <div className="flex items-center gap-2 text-[#C4C2D6]">
            <Activity className="w-3.5 h-3.5 text-[#9B7BFF]" />
            <span>Auth Traffic</span>
          </div>
          <span className={`font-extrabold ${isAttack ? 'text-[#FB7185]' : 'text-[#4DD9F0]'}`}>
            {region.requestsPerSec.toLocaleString()} req/s
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C1C36]/60 border border-[#C4B5FD]/14">
          <div className="flex items-center gap-2 text-[#C4C2D6]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Network Health</span>
          </div>
          <span className="font-extrabold text-[#34D399]">
            {region.healthPercent}%
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C1C36]/60 border border-[#C4B5FD]/14">
          <div className="flex items-center gap-2 text-[#C4C2D6]">
            <Zap className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span>Avg Latency</span>
          </div>
          <span className={`font-extrabold ${region.latencyMs > 100 ? 'text-[#FB7185]' : 'text-[#F5F3FF]'}`}>
            {region.latencyMs} ms
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C1C36]/60 border border-[#C4B5FD]/14">
          <div className="flex items-center gap-2 text-[#C4C2D6]">
            <Cpu className="w-3.5 h-3.5 text-[#8055F6]" />
            <span>ML Classifier</span>
          </div>
          <span className={`font-extrabold ${isAttack ? 'text-[#FB7185]' : 'text-[#34D399]'}`}>
            {isAttack ? 'ANOMALOUS FLOOD' : 'NOMINAL 99.2%'}
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C1C36]/60 border border-[#C4B5FD]/14">
          <div className="flex items-center gap-2 text-[#C4C2D6]">
            <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Gateway Protocol</span>
          </div>
          <span className="font-mono text-[11px] text-[#C4C2D6]">
            OCPP 2.0.1 / TLS 1.3
          </span>
        </div>
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

export const RegionFlickCard: React.FC<RegionFlickCardProps> = ({ region }) => {
  return (
    <CardFlip
      key={region.id}
      label={`${region.label} charging region details`}
      axis="y"
      front={<RegionCardFront region={region} />}
      back={<RegionCardBack region={region} />}
      className="w-[330px] sm:w-[370px] aspect-[7/10] max-w-full"
      faceClassName="rounded-3xl border border-[#C4B5FD]/25 shadow-2xl backdrop-blur-2xl"
    />
  );
};
