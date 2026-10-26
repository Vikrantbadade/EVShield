import React from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

export const SecurityStatus: React.FC = () => {
  const { securityStatus, activeThreats, isAttackMode } = useSecurity();
  const isProtected = securityStatus === 'PROTECTED';

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 border backdrop-blur-xl relative overflow-hidden transition-all duration-500 shadow-xl ${
        isProtected
          ? 'bg-gradient-to-r from-[#17172A] via-[#1D1D35] to-[#17172A] border-[#34D399]/30 shadow-[#34D399]/5'
          : 'bg-gradient-to-r from-[#2A1620] via-[#331826] to-[#2A1620] border-[#FB7185]/40 shadow-[#FB7185]/10'
      }`}
    >
      {/* Background Glow */}
      <div
        className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isProtected ? 'bg-[#34D399]/10' : 'bg-[#FB7185]/15 animate-pulse'
        }`}
      />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        {/* Left Side: Status Icon + Text */}
        <div className="flex items-start gap-5">
          <div
            className={`p-4 rounded-2xl border shadow-lg flex items-center justify-center shrink-0 ${
              isProtected
                ? 'bg-[#34D399]/10 border-[#34D399]/30 text-[#34D399] shadow-[0_0_20px_rgba(52,211,153,0.15)]'
                : 'bg-[#FB7185]/10 border-[#FB7185]/40 text-[#FB7185] shadow-[0_0_25px_rgba(251,113,133,0.2)] animate-bounce'
            }`}
          >
            {isProtected ? (
              <ShieldCheck className="w-10 h-10 text-[#34D399]" />
            ) : (
              <ShieldAlert className="w-10 h-10 text-[#FB7185]" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono tracking-widest uppercase text-[#9896B0]">
                GLOBAL SOC STATUS
              </span>
              <span
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                  isProtected
                    ? 'bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20'
                    : 'bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/40 animate-pulse'
                }`}
              >
                {isProtected ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>SYSTEM NORMAL</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>CRITICAL ALERT</span>
                  </>
                )}
              </span>
            </div>

            <h2
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
                isProtected ? 'text-[#34D399]' : 'text-[#FB7185]'
              }`}
            >
              {securityStatus}
            </h2>

            <p className="text-sm sm:text-base text-[#C4C2D6] max-w-xl font-normal leading-relaxed">
              {isProtected
                ? 'All monitored EV charging infrastructure is operating within expected traffic patterns.'
                : 'High-volume DDoS authentication anomaly detected across charging gateways.'}
            </p>
          </div>
        </div>

        {/* Right Side: Status Telemetry Metrics */}
        <div className="flex items-center gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-[#C4B5FD]/16">
          <div className="bg-[#252542] px-4 py-3 rounded-2xl border border-[#C4B5FD]/16 min-w-[130px] flex flex-col shadow-sm">
            <span className="text-[10px] font-mono text-[#9896B0] uppercase">ACTIVE THREATS</span>
            <span
              className={`text-xl font-extrabold font-mono mt-0.5 ${
                activeThreats === 0 ? 'text-[#34D399]' : 'text-[#FB7185]'
              }`}
            >
              {activeThreats}
            </span>
          </div>

          <div className="bg-[#252542] px-4 py-3 rounded-2xl border border-[#C4B5FD]/16 min-w-[130px] flex flex-col shadow-sm">
            <span className="text-[10px] font-mono text-[#9896B0] uppercase">CHARGERS ONLINE</span>
            <span className="text-xl font-extrabold font-mono text-[#4DD9F0] mt-0.5">
              {isAttackMode ? '1,224 / 1,250' : '1,248 / 1,250'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
