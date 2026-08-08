import React from 'react';
import { ShieldCheck, ShieldAlert, Play, Square, Radio } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { StatusChip } from '../ui/StatusChip';

export const SecurityHero: React.FC = () => {
  const { isAttackMode, toggleDDoSAttack, securityStatus, requestsPerSec, affectedNodes } = useSecurity();

  return (
    <div
      className={`rounded-[32px] p-8 sm:p-12 relative overflow-hidden transition-all duration-700 ${
        isAttackMode ? 'glass-danger' : 'glass-cream'
      }`}
    >
      {/* Multi-colored ambient glows */}
      <div
        className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[100px] pointer-events-none transition-all duration-700 ${
          isAttackMode ? 'bg-[#E85C68]/22' : 'bg-[#AD8B73]/20 animate-float-slow'
        }`}
      />
      <div
        className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[80px] pointer-events-none transition-all duration-700 ${
          isAttackMode ? 'bg-[#CEAB93]/20' : 'bg-[#CEAB93]/25 animate-float-slower'
        }`}
      />
      <div
        className={`absolute top-1/2 left-1/3 w-60 h-60 rounded-full blur-[90px] pointer-events-none transition-all duration-700 ${
          isAttackMode ? 'bg-[#E85C68]/15' : 'bg-[#19BFA3]/14'
        }`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left: Status & Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-3">
            <StatusChip
              label="SECURITY COMMAND CENTER"
              variant={isAttackMode ? 'threat' : 'live'}
              dot
              pulse
            />
            {isAttackMode && (
              <StatusChip label="DDoS ATTACK ACTIVE" variant="critical" />
            )}
          </div>

          {/* Status headline */}
          <div className="space-y-3">
            <h2
              className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-mono transition-colors duration-500 ${
                isAttackMode ? 'text-[#a82d38]' : 'text-[#3F3832]'
              }`}
            >
              {securityStatus}
            </h2>
            <p className="text-base sm:text-lg text-[#514940] leading-relaxed max-w-xl font-normal">
              {isAttackMode
                ? 'High-density DDoS authentication flood detected across EV charging gateway nodes. ML mitigation engaged.'
                : 'All monitored EV charging ecosystem authentication infrastructure is operating within expected traffic parameters.'}
            </p>
          </div>

          {/* Action row */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={toggleDDoSAttack}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 border ${
                isAttackMode
                  ? 'bg-[#E85C68]/18 border-[#E85C68]/40 text-[#a82d38] hover:bg-[#E85C68]/25'
                  : 'btn-primary'
              }`}
            >
              {isAttackMode
                ? <><Square className="w-4 h-4 fill-current" />END SIMULATION</>
                : <><Play className="w-4 h-4 fill-current" />SIMULATE DDOS ATTACK</>
              }
              <span className="chip chip-demo py-0 px-1.5 text-[9px]">DEMO</span>
            </button>

            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/60 border border-white/80 text-xs font-mono text-[#514940] shadow-glass-sm">
              <Radio className="w-3.5 h-3.5 text-[#19BFA3]" />
              <span>{requestsPerSec.toLocaleString()} req/s</span>
            </div>
          </div>
        </div>

        {/* Right: Animated Shield Centerpiece */}
        <div className="lg:col-span-5 flex items-center justify-center">
          <div className="relative w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center">
            {/* Rotating rings */}
            <div className={`absolute inset-0 rounded-full border-2 border-dashed transition-colors duration-700 animate-spin-slow ${
              isAttackMode ? 'border-[#E85C68]/30' : 'border-[#AD8B73]/30'
            }`} />
            <div className={`absolute inset-6 rounded-full border transition-colors duration-700 animate-spin-slow-reverse ${
              isAttackMode ? 'border-[#E85C68]/20' : 'border-[#CEAB93]/35'
            }`} />

            {/* Central shield card */}
            <div className={`relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all duration-500 ${
              isAttackMode
                ? 'bg-[#E85C68]/15 border border-[#E85C68]/35 shadow-glow-red'
                : 'bg-white/70 border border-white/90 shadow-glow-taupe'
            }`}>
              {isAttackMode
                ? <ShieldAlert className="w-12 h-12 text-[#E85C68]" />
                : <ShieldCheck className="w-12 h-12 text-[#19BFA3]" />
              }
              <span className="font-mono text-[11px] font-bold text-[#514940] tracking-wider">
                {isAttackMode ? 'ATTACK MODE' : 'SOC SECURE'}
              </span>
            </div>

            {/* Floating micro nodes */}
            {[
              { label: 'EV Nodes',    color: 'text-[#AD8B73]', cls: 'top-1 left-2' },
              { label: 'Auth Core',   color: 'text-[#19BFA3]', cls: 'bottom-3 left-1' },
              { label: isAttackMode ? `${affectedNodes} Nodes` : '0 Threats',
                color: isAttackMode ? 'text-[#E85C68]' : 'text-[#62C073]',
                cls: 'top-8 right-1' },
            ].map(({ label, color, cls }) => (
              <div
                key={label}
                className={`absolute ${cls} bg-white/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/90 text-[10px] font-mono font-semibold ${color} shadow-glass-sm`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
