import React from 'react';
import { ShieldCheck, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { StatusChip } from '../ui/StatusChip';

interface EventScenarioCard {
  id: string;
  statusTag: string;
  time: string;
  description: string;
  type: 'normal' | 'suspicious' | 'ddos' | 'mitigated';
}

const scenarios: EventScenarioCard[] = [
  {
    id: 'sc-1',
    statusTag: 'NORMAL ACTIVITY',
    time: '09:42',
    description: 'Authentication traffic stable across all regional charging gateways.',
    type: 'normal',
  },
  {
    id: 'sc-2',
    statusTag: 'SUSPICIOUS ACTIVITY',
    time: '11:17',
    description: 'Traffic deviation & handshake retry rate spike detected at CS-0421.',
    type: 'suspicious',
  },
  {
    id: 'sc-3',
    statusTag: 'DDOS DETECTED',
    time: '12:04',
    description: 'ML inference engine classified high-density authentication payload flood.',
    type: 'ddos',
  },
  {
    id: 'sc-4',
    statusTag: 'THREAT MITIGATED',
    time: '12:07',
    description: 'Automated IP rate limiting enforced. Traffic returned to expected range.',
    type: 'mitigated',
  },
];

export const EventCardsRow: React.FC = () => {
  const getStyle = (type: EventScenarioCard['type']) => {
    switch (type) {
      case 'ddos':
        return {
          glassVariant: 'danger',
          chipVariant: 'critical' as const,
          icon: <ShieldAlert className="w-5 h-5 text-[#E85C68]" />,
          iconBg: 'bg-[#E85C68]/12 border-[#E85C68]/30',
        };
      case 'suspicious':
        return {
          glassVariant: 'sand',
          chipVariant: 'threat' as const,
          icon: <AlertCircle className="w-5 h-5 text-[#D99A32]" />,
          iconBg: 'bg-[#D99A32]/12 border-[#D99A32]/28',
        };
      case 'mitigated':
        return {
          glassVariant: 'success',
          chipVariant: 'protected' as const,
          icon: <CheckCircle2 className="w-5 h-5 text-[#62C073]" />,
          iconBg: 'bg-[#62C073]/12 border-[#62C073]/28',
        };
      default:
        return {
          glassVariant: 'cream',
          chipVariant: 'live' as const,
          icon: <ShieldCheck className="w-5 h-5 text-[#19BFA3]" />,
          iconBg: 'bg-[#19BFA3]/12 border-[#19BFA3]/28',
        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#3F3832]">Security Event Scenarios</h3>
        <StatusChip label="DEMO SCENARIO LOG" variant="demo" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-2">
        {scenarios.map((sc) => {
          const style = getStyle(sc.type);
          return (
            <div
              key={sc.id}
              className={`rounded-[24px] p-6 glass-${style.glassVariant} hover:-translate-y-1 transition-all duration-300 shadow-glass-sm flex flex-col justify-between space-y-4`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className={`p-2.5 rounded-xl border ${style.iconBg}`}>{style.icon}</div>
                <span className="text-xs font-mono font-bold text-[#AD8B73]">{sc.time}</span>
              </div>

              <div className="space-y-2">
                <StatusChip label={sc.statusTag} variant={style.chipVariant} />
                <p className="text-xs text-[#514940] leading-relaxed pt-1 font-normal">{sc.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
