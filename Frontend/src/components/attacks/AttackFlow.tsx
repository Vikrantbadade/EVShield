import React from 'react';
import { AttackIncident } from '../../types/attack';
import { Activity, Zap, Cpu, ShieldAlert, Bell, CheckCircle2 } from 'lucide-react';

interface AttackFlowProps {
  incident: AttackIncident;
}

const flowSteps = [
  { label: 'Traffic Spike',       sub: 'Reqs exceed threshold', icon: Activity, bg: 'glass-cream' },
  { label: 'Authentication Burst',sub: 'Handshake payload flood', icon: Zap, bg: 'glass-peach' },
  { label: 'ML Analysis',        sub: 'Feature extraction',     icon: Cpu, bg: 'glass-sand' },
  { label: 'Attack Classified',   sub: 'DDoS confidence 97.4%', icon: ShieldAlert, bg: 'glass-danger' },
  { label: 'Alert Generated',     sub: 'SOC notification sent', icon: Bell, bg: 'glass-taupe' },
  { label: 'Automated Mitigation',sub: 'Rate limiting enforced', icon: CheckCircle2, bg: 'glass-success' },
];

export const AttackFlow: React.FC<AttackFlowProps> = (_props) => {
  return (
    <div className="glass-cream rounded-[32px] p-6 sm:p-8 space-y-6 shadow-glass border border-white/90">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#3F3832]">Incident Progression Flow</h3>
          <p className="text-xs text-[#514940] mt-1">Lifecycle sequence from anomaly detection to automated resolution</p>
        </div>
        <span className="chip chip-demo">FLOW SEQUENCE</span>
      </div>

      {/* Horizontal Flow Chain */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
        {flowSteps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="relative group">
              <div className={`${step.bg} rounded-2xl p-4 flex flex-col items-center text-center space-y-2.5 h-full border border-white/90 shadow-glass-sm hover:-translate-y-1 transition-all`}>
                <div className="w-8 h-8 rounded-xl bg-white/80 border border-white/90 flex items-center justify-center font-mono font-bold text-xs text-[#3F3832]">
                  <Icon className="w-4 h-4 text-[#AD8B73]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#3F3832] leading-tight">{step.label}</div>
                  <div className="text-[10px] text-[#7A7067] mt-0.5">{step.sub}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
