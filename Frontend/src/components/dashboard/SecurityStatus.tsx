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
          ? 'bg-gradient-to-r from-[#101824] via-[#141D2A] to-[#101824] border-[#59E3C2]/30 shadow-[#59E3C2]/5'
          : 'bg-gradient-to-r from-[#1A1018] via-[#24141A] to-[#1A1018] border-[#FF5C6C]/40 shadow-[#FF5C6C]/10'
      }`}
    >
      {/* Background Glow */}
      <div
        className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isProtected ? 'bg-[#59E3C2]/10' : 'bg-[#FF5C6C]/15 animate-pulse'
        }`}
      />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        {/* Left Side: Status Icon + Text */}
        <div className="flex items-start gap-5">
          <div
            className={`p-4 rounded-2xl border shadow-lg flex items-center justify-center shrink-0 ${
              isProtected
                ? 'bg-[#59E3C2]/10 border-[#59E3C2]/30 text-[#59E3C2] shadow-[0_0_20px_rgba(89,227,194,0.15)]'
                : 'bg-[#FF5C6C]/10 border-[#FF5C6C]/40 text-[#FF5C6C] shadow-[0_0_25px_rgba(255,92,108,0.2)] animate-bounce'
            }`}
          >
            {isProtected ? (
              <ShieldCheck className="w-10 h-10 text-[#59E3C2]" />
            ) : (
              <ShieldAlert className="w-10 h-10 text-[#FF5C6C]" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono tracking-widest uppercase text-[#94A3B8]">
                GLOBAL SOC STATUS
              </span>
              <span
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                  isProtected
                    ? 'bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/20'
                    : 'bg-[#FF5C6C]/20 text-[#FF5C6C] border border-[#FF5C6C]/40 animate-pulse'
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
                isProtected ? 'text-[#59E3C2]' : 'text-[#FF5C6C]'
              }`}
            >
              {securityStatus}
            </h2>

            <p className="text-sm sm:text-base text-[#94A3B8] max-w-xl font-normal leading-relaxed">
              {isProtected
                ? 'All monitored EV charging infrastructure is operating within expected traffic patterns.'
                : 'High-volume DDoS authentication anomaly detected across charging gateways.'}
            </p>
          </div>
        </div>

        {/* Right Side: Status Telemetry Metrics */}
        <div className="flex items-center gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-800/80">
          <div className="bg-[#0B111C]/80 px-4 py-3 rounded-2xl border border-slate-800/80 min-w-[130px] flex flex-col">
            <span className="text-[10px] font-mono text-[#94A3B8] uppercase">ACTIVE THREATS</span>
            <span
              className={`text-xl font-extrabold font-mono mt-0.5 ${
                activeThreats === 0 ? 'text-[#4ADE80]' : 'text-[#FF5C6C]'
              }`}
            >
              {activeThreats}
            </span>
          </div>

          <div className="bg-[#0B111C]/80 px-4 py-3 rounded-2xl border border-slate-800/80 min-w-[130px] flex flex-col">
            <span className="text-[10px] font-mono text-[#94A3B8] uppercase">CHARGERS ONLINE</span>
            <span className="text-xl font-extrabold font-mono text-[#59E3C2] mt-0.5">
              {isAttackMode ? '1,224 / 1,250' : '1,248 / 1,250'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
