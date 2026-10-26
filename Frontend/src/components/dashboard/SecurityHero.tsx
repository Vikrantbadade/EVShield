import React from 'react';
import { ShieldCheck, ShieldAlert, Play, Square, Radio } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { StatusChip } from '../ui/StatusChip';

export const SecurityHero: React.FC = () => {
  const { isAttackMode, toggleDDoSAttack, securityStatus, threatLevelState, requestsPerSec, affectedNodes } = useSecurity();

  // Status-driven typography color and theme
  const isProtected = securityStatus === 'PROTECTED' && !isAttackMode;
  const isAttack = isAttackMode || securityStatus === 'THREAT DETECTED';
  const isAnalyzing = threatLevelState === 'ANALYZING';
  const isRecovery = threatLevelState === 'RECOVERING';

  const statusTextColor = isAttack
    ? 'text-[#FB7185]'
    : isAnalyzing
    ? 'text-[#FBBF24]'
    : isRecovery
    ? 'text-[#38BDF8]'
    : 'text-[#34D399]';

  return (
    <div
      className={`rounded-3xl p-6 sm:p-9 relative overflow-hidden transition-all duration-500 border backdrop-blur-2xl ${
        isAttack
          ? 'bg-[#23121C]/80 border-[#FB7185]/35 shadow-2xl shadow-[#FB7185]/10'
          : 'bg-[#17172B]/80 border-[#C4B5FD]/16 shadow-2xl shadow-black/60'
      }`}
    >
      {/* Dynamic ambient cyber glows */}
      <div
        className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none transition-all duration-700 ${
          isAttack ? 'bg-[#FB7185]/20' : 'bg-[#8055F6]/14'
        }`}
      />
      <div
        className={`absolute -bottom-20 -left-20 w-72 h-72 rounded-full blur-[90px] pointer-events-none transition-all duration-700 ${
          isAttack ? 'bg-[#FB7185]/12' : 'bg-[#4DD9F0]/10'
        }`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left: Status & Operational Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusChip
              label="SECURITY COMMAND CENTER"
              variant={isAttack ? 'threat' : 'live'}
              dot
              pulse
            />
            {isAttack && (
              <StatusChip label="DDoS ATTACK ACTIVE" variant="critical" />
            )}
            <StatusChip
              label="CICEV2023 RANDOM FOREST"
              variant="demo"
            />
          </div>

          {/* High-Impact Status Headline */}
          <div className="space-y-2">
            <h2
              className={`text-[clamp(2.25rem,4.8vw,3.75rem)] font-black tracking-tight leading-none uppercase font-sans transition-colors duration-300 ${statusTextColor}`}
            >
              {isProtected ? (
                <>
                  <span className="font-black">PRO</span>
                  <span className="italic font-light opacity-90 text-[#4DD9F0]">TECTED</span>
                </>
              ) : isAttack ? (
                <>
                  <span className="font-black">ATTACK </span>
                  <span className="italic font-light opacity-90">DETECTED</span>
                </>
              ) : (
                securityStatus
              )}
            </h2>
            <p className="text-xs sm:text-sm text-[#C4C2D6] leading-relaxed max-w-xl font-normal">
              {isAttack
                ? 'High-density DDoS authentication flood detected across EV charging gateway nodes. Automated ML mitigation engaged.'
                : 'All monitored EV charging ecosystem authentication infrastructure is operating within nominal parameters. Zero unauthorized deviations.'}
            </p>
          </div>

          {/* Action & Metric Row */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={toggleDDoSAttack}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all duration-300 border shadow-md ${
                isAttack
                  ? 'bg-[#FB7185]/18 border-[#FB7185]/40 text-[#FB7185] hover:bg-[#FB7185]/25 shadow-[#FB7185]/15'
                  : 'bg-gradient-to-r from-[#8055F6] to-[#9B7BFF] hover:from-[#7344F5] hover:to-[#8E6BF5] text-white border-[#C4B5FD]/30 shadow-[#8055F6]/25'
              }`}
            >
              {isAttack ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>END SIMULATION</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>SIMULATE DDOS ATTACK</span>
                </>
              )}
              <span className="px-1.5 py-0.2 rounded bg-black/25 border border-white/20 text-[9px] font-mono">
                DEMO
              </span>
            </button>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#252542] border border-[#C4B5FD]/18 text-xs font-mono text-[#F5F3FF] shadow-sm">
              <Radio className="w-3.5 h-3.5 text-[#34D399]" />
              <span className="font-bold">{requestsPerSec.toLocaleString()}</span>
              <span className="text-[#9896B0]">req/s</span>
            </div>
          </div>
        </div>

        {/* Right: Animated Shield Centerpiece */}
        <div className="lg:col-span-5 flex items-center justify-center">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
            {/* Rotating rings */}
            <div
              className={`absolute inset-0 rounded-full border-2 border-dashed transition-colors duration-700 animate-spin-slow ${
                isAttack ? 'border-[#FB7185]/30' : 'border-[#8055F6]/30'
              }`}
            />
            <div
              className={`absolute inset-5 rounded-full border transition-colors duration-700 animate-spin-slow-reverse ${
                isAttack ? 'border-[#FB7185]/20' : 'border-[#4DD9F0]/25'
              }`}
            />

            {/* Central shield card */}
            <div
              className={`relative z-10 w-32 h-32 sm:w-36 sm:h-36 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-500 ${
                isAttack
                  ? 'bg-[#321522]/90 border border-[#FB7185]/40 shadow-glow-red'
                  : 'bg-[#1D1D35]/90 border border-[#34D399]/40 shadow-glow-cyan'
              }`}
            >
              {isAttack ? (
                <ShieldAlert className="w-10 h-10 text-[#FB7185] animate-pulse" />
              ) : (
                <ShieldCheck className="w-10 h-10 text-[#34D399]" />
              )}
              <span className="font-mono text-[10px] font-bold text-[#F5F3FF] tracking-wider">
                {isAttack ? 'ATTACK ACTIVE' : 'SOC SECURE'}
              </span>
            </div>

            {/* Floating micro nodes */}
            {[
              { label: 'EV Nodes', color: 'text-[#C4B5FD]', cls: 'top-1 left-1' },
              { label: 'Auth Core', color: 'text-[#34D399]', cls: 'bottom-2 left-1' },
              {
                label: isAttack ? `${affectedNodes} Nodes` : '0 Threats',
                color: isAttack ? 'text-[#FB7185]' : 'text-[#34D399]',
                cls: 'top-6 right-0',
              },
            ].map(({ label, color, cls }) => (
              <div
                key={label}
                className={`absolute ${cls} bg-[#17172B]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-[#C4B5FD]/18 text-[9px] font-mono font-semibold ${color} shadow-sm`}
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
