import React from 'react';
import { AttackIncident } from '../../types/attack';
import { AttackBadge } from './AttackBadge';
import { StatusChip } from '../ui/StatusChip';
import { ShieldAlert, Clock, Radio, Server } from 'lucide-react';

interface AttackSummaryProps {
  incident: AttackIncident;
}

export const AttackSummary: React.FC<AttackSummaryProps> = ({ incident }) => {
  const isAttack = incident.classification === 'ATTACK';

  return (
    <div className="space-y-6">
      {/* Security Verdict Panel */}
      <div className={`rounded-[32px] p-8 sm:p-10 relative overflow-hidden transition-all duration-500 ${
        isAttack ? 'glass-danger' : 'glass-success'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <StatusChip label="SECURITY VERDICT" variant={isAttack ? 'critical' : 'protected'} dot pulse />
              <StatusChip label="DEMO DATA" variant="demo" />
            </div>

            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
              isAttack ? 'text-[#a82d38]' : 'text-[#2b703b]'
            }`}>
              {isAttack ? 'THREAT CONFIRMED' : 'NORMAL ACTIVITY'}
            </h2>

            <p className="text-sm sm:text-base text-[#514940] max-w-2xl leading-relaxed">
              {incident.detectionSummary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs shrink-0">
            <div className="bg-white/80 border border-white/90 px-5 py-3.5 rounded-2xl shadow-glass-sm text-center">
              <div className="text-[10px] text-[#7A7067] mb-1">CLASSIFICATION</div>
              <AttackBadge type="classification" value={incident.classification} className="text-xs px-3 py-1" />
            </div>
            <div className="bg-white/80 border border-white/90 px-5 py-3.5 rounded-2xl shadow-glass-sm text-center">
              <div className="text-[10px] text-[#7A7067] mb-1">ML CONFIDENCE</div>
              <div className="text-xl font-extrabold text-[#19BFA3]">{incident.mlConfidence}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Key Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Peak Request Rate', value: `${incident.peakRequestsPerSecond.toLocaleString()} req/s`, sub: `Baseline: ${incident.baselineRequestsPerSecond.toLocaleString()} req/s`, icon: Radio, variant: 'cream' as const, color: 'text-[#E85C68]' },
          { label: 'Attack Duration',   value: incident.duration, sub: `Start: ${incident.startTime}`, icon: Clock, variant: 'peach' as const, color: 'text-[#AD8B73]' },
          { label: 'Affected Nodes',    value: `${incident.affectedNodes} Nodes`, sub: 'EV charging gateways', icon: Server, variant: 'sand' as const, color: 'text-[#D99A32]' },
          { label: 'Mitigation Status', value: incident.status, sub: incident.mitigationTime ? `In ${incident.mitigationTime}` : 'Enforced', icon: ShieldAlert, variant: 'taupe' as const, color: 'text-[#19BFA3]' },
        ].map(({ label, value, sub, icon: Icon, variant, color }) => (
          <div key={label} className={`glass-${variant} rounded-[24px] p-5 space-y-2 shadow-glass-sm hover:-translate-y-0.5 transition-all`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-[#7A7067] uppercase">{label}</span>
              <div className="p-2 rounded-xl bg-white/70 border border-white/90">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <div className="text-2xl font-extrabold font-mono text-[#3F3832] tracking-tight">{value}</div>
            <div className="text-[10px] font-mono text-[#7A7067]">{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
