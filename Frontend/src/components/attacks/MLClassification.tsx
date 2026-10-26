import React from 'react';
import { AttackIncident } from '../../types/attack';
import { Cpu, Sparkles, HelpCircle } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';

interface MLClassificationProps {
  incident: AttackIncident;
}

export const MLClassification: React.FC<MLClassificationProps> = ({ incident }) => {
  const deviation =
    incident.baselineRequestsPerSecond > 0
      ? Math.round(((incident.peakRequestsPerSecond - incident.baselineRequestsPerSecond) / incident.baselineRequestsPerSecond) * 100)
      : 0;

  const deviationStr = deviation >= 0 ? `+${deviation.toLocaleString()}%` : `${deviation.toLocaleString()}%`;
  const thresholdPct = Math.round((incident.mlThreshold || 0.55) * 100);

  const signals = incident.signals || [
    {
      name: 'Traffic Burst Intensity',
      value: incident.peakRequestsPerSecond > 50 ? 'CRITICAL' : 'ELEVATED',
      status: 'ANOMALOUS',
      description: `Observed ${incident.peakRequestsPerSecond.toLocaleString()} req/s vs baseline ${incident.baselineRequestsPerSecond.toLocaleString()} req/s`,
    },
    {
      name: 'Auth Payload Rate',
      value: `${incident.peakRequestsPerSecond.toLocaleString()} req/s`,
      status: 'ANOMALOUS',
      description: 'Surge of rapid OCPP session handshake requests',
    },
    {
      name: 'Baseline Deviation',
      value: deviationStr,
      status: deviation > 100 ? 'ANOMALOUS' : 'ELEVATED',
      description: `Traffic divergence from ${incident.baselineRequestsPerSecond.toLocaleString()} req/s nominal level`,
    },
    {
      name: 'Model Threshold Delta',
      value: `${incident.mlConfidence}%`,
      status: incident.mlConfidence >= thresholdPct ? 'ANOMALOUS' : 'NOMINAL',
      description: `Configured decision threshold: ${thresholdPct}%`,
    },
  ];

  return (
    <div className="glass-sand rounded-[32px] p-6 sm:p-8 flex flex-col space-y-6 shadow-glass border border-white/90">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[#E3CAA5]/40">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/70 border border-white/90 text-[#AD8B73] shadow-glass-sm">
              <Cpu className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xl font-bold text-[#3F3832]">ML Detection Signals</h3>
          </div>
          <p className="text-xs text-[#514940] mt-1">Feature extraction, confidence score & classification rationale</p>
        </div>

        <StatusChip label={incident.isDemo ? "MODEL PREVIEW" : "LIVE RANDOM FOREST"} variant={incident.isDemo ? "demo" : "live"} />
      </div>

      {/* Feature Signals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {signals.map((sig) => (
          <div key={sig.name} className="glass-cream rounded-2xl p-4 space-y-2 border border-white/90 shadow-glass-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#514940]">{sig.name}</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                sig.status === 'ANOMALOUS' ? 'bg-[#E85C68]/15 text-[#a82d38]' : 'bg-[#D99A32]/15 text-[#a8731d]'
              }`}>
                {sig.status}
              </span>
            </div>
            <div className="text-xl font-extrabold font-mono text-[#3F3832]">{sig.value}</div>
            <p className="text-[11px] text-[#7A7067] leading-relaxed">{sig.description}</p>
          </div>
        ))}
      </div>

      {/* Plain Language Model Interpretation */}
      <div className="bg-white/75 backdrop-blur-xl rounded-2xl p-5 border border-white/90 space-y-2 shadow-glass-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-[#3F3832]">
          <HelpCircle className="w-4 h-4 text-[#AD8B73]" />
          <span>Why was this classified as an attack?</span>
        </div>
        <p className="text-xs text-[#514940] leading-relaxed pl-6">
          {incident.detectionSummary}
        </p>
        <div className="pt-2 pl-6 flex items-center gap-2 text-[10px] font-mono text-[#7A7067]">
          <Sparkles className="w-3 h-3 text-[#19BFA3]" />
          <span>Model: CICEV2023 Random Forest &bull; Confidence: {incident.mlConfidence}% &bull; Threshold: {thresholdPct}%</span>
        </div>
      </div>
    </div>
  );
};
