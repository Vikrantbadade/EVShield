import React from 'react';
import { AttackIncident } from '../../types/attack';
import { Clock, ShieldAlert, Cpu, AlertTriangle, CheckCircle2, Radio } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';

interface AttackTimelineProps {
  incident: AttackIncident;
}

export const AttackTimeline: React.FC<AttackTimelineProps> = ({ incident }) => {
  const events = [
    { time: `${incident.timestamp}`, title: 'Traffic Anomaly Detected', desc: `Request rate surged past nominal 1,200 req/s baseline to ${incident.peakRequestsPerSecond.toLocaleString()} req/s.`, icon: Radio, chip: 'threat' as const },
    { time: '12:04:31', title: 'ML Inference Triggered', desc: 'EVShield ML detection engine extracted payload frequency & retry features.', icon: Cpu, chip: 'demo' as const },
    { time: '12:04:42', title: 'Attack Classification Confirmed', desc: `ML model confirmed DDoS Authentication Burst signature with ${incident.mlConfidence}% confidence.`, icon: ShieldAlert, chip: 'critical' as const },
    { time: '12:05:01', title: 'Affected Infrastructure Identified', desc: `Gateway Zone 1 (${incident.targetInfrastructure}) flagged as primary target scope.`, icon: AlertTriangle, chip: 'threat' as const },
    { time: '12:06:12', title: 'Mitigation Initiated', desc: 'Automated IP rate-limiting rules and token handshake quarantine engaged.', icon: ShieldAlert, chip: 'live' as const },
    { time: `${incident.endTime || '12:08:00'}`, title: 'Traffic Returned to Baseline', desc: 'Attack mitigation completed. Authentication request rate stabilized back at ~1,200 req/s.', icon: CheckCircle2, chip: 'protected' as const },
  ];

  return (
    <div className="glass-peach rounded-[32px] p-6 sm:p-8 space-y-6 shadow-glass border border-white/90">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/70 border border-white/90 text-[#AD8B73] shadow-glass-sm">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xl font-bold text-[#3F3832]">Forensic Incident Timeline</h3>
          </div>
          <p className="text-xs text-[#514940] mt-1">Detailed timestamped sequence of detection & response actions</p>
        </div>

        <StatusChip label="TIMELINE LOG" variant="demo" />
      </div>

      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[2px] before:bg-[#CEAB93]/35">
        {events.map((ev) => {
          const Icon = ev.icon;
          return (
            <div key={ev.time} className="relative group">
              <div className="absolute -left-6 top-2 w-5 h-5 rounded-full bg-white border border-[#CEAB93]/50 flex items-center justify-center z-10 group-hover:border-[#19BFA3] shadow-glass-sm transition-colors">
                <Icon className="w-3.5 h-3.5 text-[#AD8B73]" />
              </div>

              <div className="bg-white/65 backdrop-blur-xl border border-white/85 rounded-2xl p-4 hover:bg-white/85 transition-all shadow-glass-sm">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-mono font-extrabold text-[#AD8B73]">{ev.time}</span>
                  <StatusChip label={ev.title} variant={ev.chip} />
                </div>
                <h4 className="text-sm font-bold text-[#3F3832] mb-1">{ev.title}</h4>
                <p className="text-xs text-[#514940] leading-relaxed">{ev.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
