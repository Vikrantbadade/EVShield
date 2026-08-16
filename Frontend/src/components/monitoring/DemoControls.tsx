import React from 'react';
import { useSecurity } from '../../context/SecurityContext';
import {
  Play,
  ShieldAlert,
  Square,
  RotateCcw,
  Server,
  Cpu,
  Activity,
  Radio,
} from 'lucide-react';

export const DemoControls: React.FC = () => {
  const {
    startNormalTraffic,
    startAttackSimulation,
    stopTraffic,
    resetDemo,
    simulationMode,
    threatLevelState,
    serverStatus,
    backendStatus,
    mlEngineStatus,
    telemetryStatus,
    mlConfidence,
    mlThreshold,
    mlLabel,
    requestsPerSec,
    avgLatencyMs,
    totalRequests,
    errorRatePercent,
  } = useSecurity();

  const isAttack = mlLabel === 'ATTACK' || threatLevelState === 'CRITICAL';
  const isAnalyzing = threatLevelState === 'ANALYZING';
  const isRecovering = threatLevelState === 'RECOVERING';

  return (
    <div className="glass-cream rounded-[32px] p-6 sm:p-8 space-y-6 shadow-glass border border-white/90 relative overflow-hidden">
      {/* Top Header & Subsystem Health */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-[#AD8B73]/18">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#AD8B73]/15 border border-[#AD8B73]/30 flex items-center justify-center text-[#AD8B73] shrink-0">
              <Radio className="w-5 h-5 text-[#19BFA3]" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#3F3832]">Cybersecurity Demonstration Lab</h3>
              <p className="text-xs text-[#514940] mt-0.5">
                Real-time traffic generation against local fake charging server (127.0.0.1:8080) &amp; CICEV2023 Random Forest inference.
              </p>
            </div>
          </div>
        </div>

        {/* Subsystem Health Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 shadow-glass-sm ${
              serverStatus === 'ONLINE'
                ? 'bg-[#62C073]/12 border-[#62C073]/30 text-[#1e6b2c]'
                : 'bg-[#E85C68]/15 border-[#E85C68]/30 text-[#a82d38]'
            }`}
            title="Fake EV Charging Station (Port 8080)"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Server: {serverStatus}</span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 shadow-glass-sm ${
              backendStatus === 'ONLINE'
                ? 'bg-[#62C073]/12 border-[#62C073]/30 text-[#1e6b2c]'
                : 'bg-[#E85C68]/15 border-[#E85C68]/30 text-[#a82d38]'
            }`}
            title="EVShield Backend API (Port 5000)"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Backend: {backendStatus}</span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 shadow-glass-sm ${
              mlEngineStatus === 'ONLINE'
                ? 'bg-[#62C073]/12 border-[#62C073]/30 text-[#1e6b2c]'
                : 'bg-[#E85C68]/15 border-[#E85C68]/30 text-[#a82d38]'
            }`}
            title="Scikit-Learn Random Forest (model.joblib)"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>ML Engine: {mlEngineStatus}</span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 shadow-glass-sm ${
              telemetryStatus === 'ACTIVE'
                ? 'bg-[#19BFA3]/15 border-[#19BFA3]/30 text-[#0d7a67]'
                : 'bg-white/60 border-white/90 text-[#7A7067]'
            }`}
            title="Rolling Telemetry Collector"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                telemetryStatus === 'ACTIVE' ? 'bg-[#19BFA3] animate-pulse' : 'bg-[#7A7067]'
              }`}
            />
            <span>Telemetry: {telemetryStatus}</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Action Buttons */}
        <div className="lg:col-span-7 flex flex-wrap gap-3">
          <button
            onClick={startNormalTraffic}
            className={`px-4 py-3 rounded-2xl font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-glass-sm ${
              simulationMode === 'NORMAL'
                ? 'bg-[#19BFA3] text-white border border-[#19BFA3] shadow-md ring-2 ring-[#19BFA3]/30'
                : 'bg-white/80 hover:bg-white text-[#3F3832] border border-white/90 hover:-translate-y-0.5'
            }`}
          >
            <Play className="w-4 h-4 text-[#19BFA3]" />
            <span>Start Normal Traffic</span>
          </button>

          <button
            onClick={startAttackSimulation}
            className={`px-4 py-3 rounded-2xl font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-glass-sm ${
              simulationMode === 'ATTACK'
                ? 'bg-[#E85C68] text-white border border-[#E85C68] shadow-md ring-2 ring-[#E85C68]/30 animate-pulse'
                : 'bg-white/80 hover:bg-white text-[#3F3832] border border-white/90 hover:-translate-y-0.5'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-[#E85C68]" />
            <span>Start Attack Simulation</span>
          </button>

          <button
            onClick={stopTraffic}
            className="px-4 py-3 rounded-2xl font-bold text-xs font-mono flex items-center gap-2 bg-white/70 hover:bg-white/90 text-[#7A7067] hover:text-[#3F3832] border border-white/90 transition-all hover:-translate-y-0.5 shadow-glass-sm"
          >
            <Square className="w-3.5 h-3.5 text-[#AD8B73]" />
            <span>Stop Traffic</span>
          </button>

          <button
            onClick={resetDemo}
            className="px-3.5 py-3 rounded-2xl font-bold text-xs font-mono flex items-center gap-2 bg-white/70 hover:bg-white/90 text-[#7A7067] hover:text-[#3F3832] border border-white/90 transition-all hover:-translate-y-0.5 shadow-glass-sm"
            title="Reset telemetry counters and event stream"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#7A7067]" />
            <span>Reset</span>
          </button>
        </div>

        {/* Live Threat Gauge & ML Output */}
        <div className="lg:col-span-5 bg-white/70 rounded-2xl p-4 border border-white/90 shadow-glass-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-[#7A7067] font-semibold">Real ML Probability</span>
              <span className="text-[10px] font-mono text-[#7A7067]">(Threshold: {Math.round(mlThreshold * 100)}%)</span>
            </div>
            <span
              className={`text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-lg border ${
                isAttack
                  ? 'bg-[#E85C68]/15 border-[#E85C68]/30 text-[#a82d38]'
                  : isAnalyzing
                  ? 'bg-[#D99A32]/15 border-[#D99A32]/30 text-[#966314]'
                  : isRecovering
                  ? 'bg-[#52A8FF]/15 border-[#52A8FF]/30 text-[#1a5da8]'
                  : 'bg-[#62C073]/12 border-[#62C073]/30 text-[#1e6b2c]'
              }`}
            >
              {isAttack ? '⚠ ATTACK DETECTED' : isAnalyzing ? 'ANALYZING' : isRecovering ? 'RECOVERING' : '● NORMAL'}
            </span>
          </div>

          {/* Progress bar meter */}
          <div className="space-y-1">
            <div className="w-full h-3.5 bg-[#CEAB93]/20 rounded-full overflow-hidden p-0.5 border border-[#CEAB93]/30 relative">
              {/* Threshold mark */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[#3F3832] z-10"
                style={{ left: `${mlThreshold * 100}%` }}
                title={`Detection Threshold: ${Math.round(mlThreshold * 100)}%`}
              />
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isAttack ? 'bg-[#E85C68]' : mlConfidence > 40 ? 'bg-[#D99A32]' : 'bg-[#19BFA3]'
                }`}
                style={{ width: `${Math.min(mlConfidence, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#7A7067]">
              <span>0%</span>
              <span className="font-bold text-[#3F3832]">{mlConfidence.toFixed(1)}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Operational Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
        <div className="bg-white/55 rounded-xl px-3.5 py-2.5 border border-white/80">
          <div className="text-[10px] font-mono text-[#7A7067] uppercase">Throughput</div>
          <div className="text-base font-extrabold font-mono text-[#3F3832] mt-0.5">
            {requestsPerSec} <span className="text-[10px] font-normal text-[#7A7067]">req/s</span>
          </div>
        </div>

        <div className="bg-white/55 rounded-xl px-3.5 py-2.5 border border-white/80">
          <div className="text-[10px] font-mono text-[#7A7067] uppercase">Total Requests</div>
          <div className="text-base font-extrabold font-mono text-[#3F3832] mt-0.5">
            {totalRequests.toLocaleString()}
          </div>
        </div>

        <div className="bg-white/55 rounded-xl px-3.5 py-2.5 border border-white/80">
          <div className="text-[10px] font-mono text-[#7A7067] uppercase">Avg Latency</div>
          <div className="text-base font-extrabold font-mono text-[#3F3832] mt-0.5">
            {avgLatencyMs} <span className="text-[10px] font-normal text-[#7A7067]">ms</span>
          </div>
        </div>

        <div className="bg-white/55 rounded-xl px-3.5 py-2.5 border border-white/80">
          <div className="text-[10px] font-mono text-[#7A7067] uppercase">Error Rate</div>
          <div className="text-base font-extrabold font-mono text-[#3F3832] mt-0.5">
            {errorRatePercent}%
          </div>
        </div>

        <div className="bg-white/55 rounded-xl px-3.5 py-2.5 border border-white/80">
          <div className="text-[10px] font-mono text-[#7A7067] uppercase">Random Forest</div>
          <div className="text-base font-extrabold font-mono text-[#3F3832] mt-0.5">
            {mlLabel}
          </div>
        </div>

        <div className="bg-white/55 rounded-xl px-3.5 py-2.5 border border-white/80">
          <div className="text-[10px] font-mono text-[#7A7067] uppercase">Target Endpoint</div>
          <div className="text-xs font-mono font-bold text-[#3F3832] mt-1 truncate">
            127.0.0.1:8080
          </div>
        </div>
      </div>
    </div>
  );
};
