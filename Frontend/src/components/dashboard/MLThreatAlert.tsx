import React from 'react';
import { Cpu, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { useNavigate } from 'react-router-dom';
import { StatusChip } from '../ui/StatusChip';

export const MLThreatAlert: React.FC = () => {
  const { isAttackMode, mlConfidence, affectedNodes } = useSecurity();
  const navigate = useNavigate();

  return (
    <div
      className={`rounded-[28px] p-6 sm:p-8 relative overflow-hidden transition-all duration-500 ${
        isAttackMode ? 'glass-danger' : 'glass-cream'
      }`}
    >
      {/* Background ambient glow */}
      <div
        className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isAttackMode ? 'bg-[#E85C68]/15' : 'bg-[#CEAB93]/20'
        }`}
      />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        {/* Left info block */}
        <div className="flex items-start gap-5">
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-center shrink-0 ${
              isAttackMode
                ? 'bg-[#E85C68]/14 border-[#E85C68]/30 text-[#E85C68]'
                : 'bg-white/70 border-white/90 text-[#AD8B73]'
            }`}
          >
            {isAttackMode ? <ShieldAlert className="w-7 h-7" /> : <Cpu className="w-7 h-7" />}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-wider text-[#7A7067] uppercase flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#52A8FF]" />
                ML DETECTION ENGINE
              </span>
              <StatusChip label="DEMO" variant="demo" />
            </div>

            <h3 className={`text-xl sm:text-2xl font-bold flex items-center gap-2 ${
              isAttackMode ? 'text-[#a82d38]' : 'text-[#3F3832]'
            }`}>
              {isAttackMode
                ? <><AlertTriangle className="w-5 h-5 text-[#E85C68]" />⚠ DDoS ATTACK DETECTED</>
                : <><CheckCircle2 className="w-5 h-5 text-[#62C073]" />✓ Traffic appears normal</>
              }
            </h3>

            <p className="text-sm text-[#514940] max-w-xl leading-relaxed">
              {isAttackMode
                ? 'The ML detection engine identified abnormal EV authentication traffic payload bursts.'
                : 'No abnormal DDoS behavior detected across EV charging authentication nodes.'}
            </p>
          </div>
        </div>

        {/* Right: telemetry */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-[#AD8B73]/15">
          {isAttackMode ? (
            <>
              {[
                { label: 'SEVERITY',       value: 'CRITICAL',        color: 'text-[#a82d38]' },
                { label: 'AFFECTED NODES', value: `${affectedNodes}`, color: 'text-[#D99A32]' },
                { label: 'CONFIDENCE',     value: `${mlConfidence}%`, color: 'text-[#19BFA3]' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/75 border border-white/90 px-4 py-2.5 rounded-2xl shadow-glass-sm">
                  <div className="text-[10px] text-[#7A7067] mb-0.5">{label}</div>
                  <div className={`font-extrabold text-sm ${color}`}>{value}</div>
                </div>
              ))}
              <button
                onClick={() => navigate('/analysis')}
                className="btn-primary rounded-xl text-xs py-3 px-5"
              >
                VIEW ATTACK ANALYSIS
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="bg-white/75 border border-white/90 px-5 py-3 rounded-2xl flex items-center gap-4 shadow-glass-sm">
              <span className="text-[#7A7067] text-xs">CONFIDENCE</span>
              <span className="text-[#19BFA3] font-extrabold text-lg">{mlConfidence}%</span>
              <StatusChip label="MODEL VERIFIED" variant="live" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
