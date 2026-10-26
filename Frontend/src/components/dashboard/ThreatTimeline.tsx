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
        return <ShieldAlert className="w-3.5 h-3.5 text-[#FB7185]" />;
      case 'pattern':
      case 'suspicious':
        return <AlertCircle className="w-3.5 h-3.5 text-[#FBBF24]" />;
      case 'resolved':
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-[#4DD9F0]" />;
    }
  };

  return (
    <div className="glass-card rounded-[32px] p-6 sm:p-8 flex flex-col justify-between space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[#C4B5FD]/16">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#252542] border border-[#C4B5FD]/20 text-[#9B7BFF]">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F3FF]">Threat Timeline</h3>
          </div>
          <p className="text-xs text-[#C4C2D6] mt-1">Historical incident sequence & anomaly log</p>
        </div>

        <StatusChip label="DEMO LOG" variant="demo" />
      </div>

      {/* Timeline List (Bounded with internal scroll) */}
      <div className="relative pl-6 space-y-4 max-h-[340px] overflow-y-auto pr-2 scrollbar-thin before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[2px] before:bg-[#C4B5FD]/20">
        {events.map((event) => (
          <div key={event.id} className="relative group">
            {/* Timeline Node Icon Dot */}
            <div className="absolute -left-6 top-2 w-5 h-5 rounded-full bg-[#252542] border border-[#9B7BFF]/50 flex items-center justify-center z-10 group-hover:border-[#4DD9F0] shadow-sm transition-colors">
              {getIcon(event.type)}
            </div>

            {/* Event Body */}
            <div className="bg-[#252542] border border-[#C4B5FD]/16 rounded-2xl p-4 hover:bg-[#303052] transition-all duration-200 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-mono font-extrabold text-[#C4B5FD]">{event.time}</span>
                <StatusChip label={event.severity.toUpperCase()} variant={getBadgeVariant(event.severity)} />
              </div>

              <h4 className="text-sm font-bold text-[#F5F3FF] mb-1">{event.title}</h4>
              <p className="text-xs text-[#C4C2D6] leading-relaxed">{event.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-[#C4B5FD]/16 text-center">
        <span className="text-[11px] font-mono text-[#9896B0]">
          ● Demo sequence captured from simulated SOC replay engine
        </span>
      </div>
    </div>
  );
};
