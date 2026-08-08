import React from 'react';
import { TimelineEvent } from '../../types';
import { Clock, ShieldCheck, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';

interface ThreatTimelineProps {
  events: TimelineEvent[];
}

export const ThreatTimeline: React.FC<ThreatTimelineProps> = ({ events }) => {
  const getBadgeVariant = (severity: TimelineEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high':     return 'threat';
      case 'medium':   return 'demo';
      default:         return 'protected';
    }
  };

  const getIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'escalated':
        return <ShieldAlert className="w-4 h-4 text-[#E85C68]" />;
      case 'pattern':
      case 'suspicious':
        return <AlertCircle className="w-4 h-4 text-[#D99A32]" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4 text-[#62C073]" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-[#19BFA3]" />;
    }
  };

  return (
    <div className="glass-peach rounded-[32px] p-6 sm:p-8 flex flex-col justify-between space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[#CEAB93]/25">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/70 border border-white/90 text-[#AD8B73] shadow-glass-sm">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xl font-bold text-[#3F3832]">Threat Timeline</h3>
          </div>
          <p className="text-xs text-[#514940] mt-1">Historical incident sequence & anomaly log</p>
        </div>

        <StatusChip label="DEMO LOG" variant="demo" />
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[2px] before:bg-[#CEAB93]/35">
        {events.map((event) => (
          <div key={event.id} className="relative group">
            {/* Timeline Node Icon Dot */}
            <div className="absolute -left-6 top-2 w-5 h-5 rounded-full bg-white border border-[#CEAB93]/50 flex items-center justify-center z-10 group-hover:border-[#19BFA3] shadow-glass-sm transition-colors">
              {getIcon(event.type)}
            </div>

            {/* Event Body */}
            <div className="bg-white/65 backdrop-blur-xl border border-white/85 rounded-2xl p-4 hover:bg-white/85 transition-all duration-200 shadow-glass-sm">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-mono font-extrabold text-[#AD8B73]">{event.time}</span>
                <StatusChip label={event.severity.toUpperCase()} variant={getBadgeVariant(event.severity)} />
              </div>

              <h4 className="text-sm font-bold text-[#3F3832] mb-1">{event.title}</h4>
              <p className="text-xs text-[#514940] leading-relaxed">{event.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-[#CEAB93]/25 text-center">
        <span className="text-[11px] font-mono text-[#7A7067]">
          ● Demo sequence captured from simulated SOC replay engine
        </span>
      </div>
    </div>
  );
};
