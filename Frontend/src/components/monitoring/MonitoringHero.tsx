import React from 'react';
import { StatusChip } from '../ui/StatusChip';
import { ShieldCheck, AlertTriangle, Activity, Cpu, Radio } from 'lucide-react';

interface MonitoringHeroProps {
  isAttackMode: boolean;
  requestsPerSec: number;
  mlConfidence: number;
}

export const MonitoringHero: React.FC<MonitoringHeroProps> = ({
  isAttackMode,
  requestsPerSec,
  mlConfidence,
}) => {
  return (
    <div className={`relative overflow-hidden rounded-[36px] p-8 sm:p-10 shadow-glass border transition-all duration-700 ${
      isAttackMode
        ? 'glass-danger border-[#E85C68]/35'
        : 'glass-success border-[#19BFA3]/30'
    }`}>
      {/* Ambient glow blob */}
      <div
        className={`absolute top-[-60px] right-[-60px] w-[360px] h-[360px] rounded-full blur-[120px] pointer-events-none transition-all duration-700 ${
          isAttackMode ? 'bg-[#E85C68]/18' : 'bg-[#19BFA3]/14'
        }`}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Left: Status */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusChip
              label={isAttackMode ? 'THREAT DETECTED' : 'SYSTEM PROTECTED'}
              variant={isAttackMode ? 'critical' : 'protected'}
              dot
              pulse={isAttackMode}
            />
            <StatusChip label="LIVE MONITORING" variant="live" />
          </div>

          <div className="space-y-1">
            <h3 className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${
              isAttackMode ? 'text-[#a82d38]' : 'text-[#1a6e5e]'
            }`}>
              {isAttackMode ? 'ATTACK ACTIVE' : 'PROTECTED'}
            </h3>
            <p className="text-sm text-[#514940] max-w-md leading-relaxed">
              {isAttackMode
                ? 'DDoS authentication burst detected. ML engine is actively monitoring and mitigating the threat across EV charging gateways.'
                : 'All EV charging authentication gateways are operating within nominal parameters. No anomalies detected.'}
            </p>
          </div>

          {isAttackMode && (
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#a82d38]">
              <Radio className="w-4 h-4 text-[#E85C68] animate-ping" />
              EVS-DEMO-001 — INCIDENT ACTIVE
            </div>
          )}
        </div>

        {/* Right: Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 shrink-0">
          {[
            {
              label: 'Auth Traffic',
              value: `${requestsPerSec.toLocaleString()} req/s`,
              icon: Activity,
              highlight: isAttackMode,
            },
            {
              label: 'Active Connections',
              value: isAttackMode ? '18,450' : '18,420',
              icon: Radio,
              highlight: false,
            },
            {
              label: 'ML Confidence',
              value: `${mlConfidence.toFixed(1)}%`,
              icon: Cpu,
              highlight: isAttackMode,
            },
            {
              label: 'Status',
              value: isAttackMode ? 'THREAT' : 'NOMINAL',
              icon: isAttackMode ? AlertTriangle : ShieldCheck,
              highlight: isAttackMode,
            },
          ].map(({ label, value, icon: Icon, highlight }) => (
            <div
              key={label}
              className="bg-white/75 backdrop-blur-xl rounded-2xl px-4 py-3.5 border border-white/90 shadow-glass-sm text-center space-y-1.5"
            >
              <div className="flex items-center justify-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${highlight ? 'text-[#E85C68]' : 'text-[#19BFA3]'}`} />
                <span className="text-[10px] font-mono text-[#7A7067]">{label}</span>
              </div>
              <div className={`text-lg font-extrabold font-mono ${highlight ? 'text-[#a82d38]' : 'text-[#3F3832]'}`}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
