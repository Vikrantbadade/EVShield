import React from 'react';
import { MonitoringEvent } from '../../types/monitoring';
import { StatusChip } from '../ui/StatusChip';
import { Radio, CheckCircle2, AlertTriangle, Info, Zap } from 'lucide-react';

interface LiveEventStreamProps {
  events: MonitoringEvent[];
  isAttackMode: boolean;
}

const getSeverityStyle = (severity: MonitoringEvent['severity']) => {
  switch (severity) {
    case 'critical': return { border: 'border-l-[#E85C68]', bg: 'bg-[#E85C68]/05', icon: AlertTriangle, iconColor: 'text-[#E85C68]', dot: 'bg-[#E85C68]' };
    case 'warning':  return { border: 'border-l-[#D99A32]', bg: 'bg-[#D99A32]/05', icon: Zap,           iconColor: 'text-[#D99A32]', dot: 'bg-[#D99A32]' };
    case 'normal':   return { border: 'border-l-[#19BFA3]', bg: 'bg-transparent',  icon: CheckCircle2,  iconColor: 'text-[#19BFA3]', dot: 'bg-[#19BFA3]' };
    default:         return { border: 'border-l-[#52A8FF]', bg: 'bg-transparent',  icon: Info,          iconColor: 'text-[#52A8FF]', dot: 'bg-[#52A8FF]' };
  }
};

export const LiveEventStream: React.FC<LiveEventStreamProps> = ({ events, isAttackMode }) => {
  return (
    <div className="glass-cream rounded-[32px] p-6 sm:p-8 space-y-6 shadow-glass border border-white/90">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/70 border border-white/90 text-[#AD8B73] shadow-glass-sm">
              <Radio className={`w-4 h-4 ${isAttackMode ? 'text-[#E85C68] animate-ping' : 'text-[#19BFA3]'}`} />
            </div>
            <h3 className="text-xl font-bold text-[#3F3832]">Live Security Event Stream</h3>
          </div>
          <p className="text-xs text-[#514940] mt-1">
            Real-time authentication and threat detection events across the charging network
          </p>
        </div>
        <StatusChip label={isAttackMode ? 'INCIDENT EVENTS' : 'NORMAL OPS'} variant={isAttackMode ? 'critical' : 'live'} dot pulse={isAttackMode} />
      </div>

      {/* Event List */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {events.map((ev, idx) => {
          const { border, bg, icon: Icon, iconColor, dot } = getSeverityStyle(ev.severity);
          return (
            <div
              key={ev.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-2xl border-l-4 ${border} ${bg} bg-white/55 backdrop-blur-xl border border-white/80 shadow-glass-sm`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono font-bold text-[#AD8B73]">{ev.time}</span>
                  <span className="text-[10px] font-mono text-[#7A7067]">• {ev.source}</span>
                </div>
                <p className="text-xs text-[#3F3832] leading-relaxed font-medium">{ev.message}</p>
              </div>

              {/* Severity dot */}
              <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${dot} ${ev.severity === 'critical' ? 'animate-pulse' : ''}`} />
            </div>
          );
        })}
      </div>

      <div className="text-[10px] font-mono text-center text-[#7A7067] pt-2 border-t border-[#AD8B73]/15">
        DEMO DATA • Synthetic Security Events — {events.length} events in stream
      </div>
    </div>
  );
};
