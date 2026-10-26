import React from 'react';
import { AttackIncident } from '../../types/attack';
import { Clock, ShieldAlert, Cpu, AlertTriangle, CheckCircle2, Radio } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';
import { formatTime } from '../../utils/dateTime';

interface AttackTimelineProps {
  incident: AttackIncident;
}

export const AttackTimeline: React.FC<AttackTimelineProps> = ({ incident }) => {
  const startTimeStr = formatTime(incident.startTime || incident.timestamp);
  const endTimeStr = incident.endTime ? formatTime(incident.endTime) : null;
  const isMitigated = incident.status === 'MITIGATED' || incident.status === 'RESOLVED';
  const isRecovered = incident.status === 'RESOLVED' || (incident.status === 'MITIGATED' && !!incident.endTime);

  const events: Array<{ time: string; title: string; desc: string; icon: any; chip: 'threat' | 'demo' | 'critical' | 'live' | 'protected' }> = [
    {
      time: startTimeStr,
      title: 'Traffic Anomaly Observed',
      desc: `Request rate surged past nominal ${incident.baselineRequestsPerSecond.toLocaleString()} req/s baseline to peak of ${incident.peakRequestsPerSecond.toLocaleString()} req/s.`,
      icon: Radio,
      chip: 'threat',
    },
    {
      time: startTimeStr,
      title: 'ML Detection Engine Triggered',
      desc: 'EVShield ML feature extractor evaluated request frequency, inter-arrival variance, and token payload patterns.',
      icon: Cpu,
      chip: 'demo',
    },
    {
      time: startTimeStr,
      title: 'Attack Classification Confirmed',
      desc: `ML classifier confirmed ${incident.attackTypeLabel || 'DDoS Flood'} with ${incident.mlConfidence}% confidence.`,
      icon: ShieldAlert,
      chip: 'critical',
    },
    {
      time: startTimeStr,
      title: 'Target Scope Flagged',
      desc: `Target infrastructure identified as ${incident.targetInfrastructure || 'Gateway Auth Endpoint'}. ${incident.affectedNodes} charging nodes placed on guard.`,
      icon: AlertTriangle,
      chip: 'threat',
    },
  ];

  if (isMitigated) {
    events.push({
      time: endTimeStr || startTimeStr,
      title: 'Mitigation Enforced',
      desc: incident.mitigationStatus || 'Automated IP rate-limiting rules and token handshake quarantine engaged.',
      icon: ShieldAlert,
      chip: 'live',
    });
  } else {
    events.push({
      time: startTimeStr,
      title: 'Mitigation Pending',
      desc: 'Attack detected and active. Enforce mitigation or await automated policy threshold trigger.',
      icon: ShieldAlert,
      chip: 'threat',
    });
  }

  if (isRecovered && endTimeStr) {
    events.push({
      time: endTimeStr,
      title: 'Baseline Restored',
      desc: `Incident closed. Request rate stabilized back at baseline (~${incident.baselineRequestsPerSecond.toLocaleString()} req/s).`,
      icon: CheckCircle2,
      chip: 'protected',
    });
  }

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

        <StatusChip label={incident.isDemo ? "HISTORICAL TIMELINE" : "LIVE INCIDENT TIMELINE"} variant={incident.isDemo ? "demo" : "live"} />
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
