import React, { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { DetectionMethod } from '../../types/ml';
import {
  Play,
  Square,
  RotateCcw,
  Server,
  Cpu,
  Activity,
  Radio,
  Sliders,
  Flame,
  Users,
  Repeat,
  HardDrive,
  Clock,
  Shuffle,
  CheckCircle,
  Timer,
  PlayCircle,
  PauseCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  Layers,
} from 'lucide-react';

export const DemoControls: React.FC = () => {
  const {
    startNormalTraffic,
    stopTraffic,
    resetDemo,
    triggerScenario,
    setSimulationIntensity,
    activeDetector,
    setActiveDetector,
    simulationMode,
    detectionStatus,
    simulationLifecycle,
    autoSimulation,
    recoveryStatus,
    enableAutoDemo,
    disableAutoDemo,
    serverStatus,
    backendStatus,
    mlEngineStatus,
    telemetryStatus,
    requestsPerSec,
    packetRate,
    bytesPerSecond,
    activeConnections,
    simulationState,
    isRecovering,
    isStopped,
  } = useSecurity();

  const [customInterval, setCustomInterval] = useState<number>(15);
  const [customDuration, setCustomDuration] = useState<number>(8);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  const isAnomalous = detectionStatus === 'ANOMALY_ACTIVE';
  const intensity = simulationState?.intensity || 'MEDIUM';
  const isAutoDemoEnabled = autoSimulation?.enabled ?? false;

  const detectors: { id: DetectionMethod; name: string; tag: string }[] = [
    { id: 'RANDOM_FOREST', name: 'Random Forest', tag: 'Supervised Multi-Class' },
    { id: 'ISOLATION_FOREST', name: 'Isolation Forest', tag: 'Unsupervised Outlier' },
    { id: 'THRESHOLD', name: 'Threshold Rules', tag: 'Z-Score & Static' },
    { id: 'ENSEMBLE', name: 'Ensemble', tag: 'Majority Voting' },
  ];

  const anomalyScenarios = [
    {
      id: 'burst',
      name: 'Traffic Burst',
      desc: 'Rapid surge in requests/sec',
      icon: Flame,
      color: 'text-[#FB7185] hover:border-[#FB7185]/50 hover:bg-[#FB7185]/10',
    },
    {
      id: 'connection-rate',
      name: 'High Conn Rate',
      desc: 'Aggressive client handshakes',
      icon: Users,
      color: 'text-[#F97316] hover:border-[#F97316]/50 hover:bg-[#F97316]/10',
    },
    {
      id: 'repeated-requests',
      name: 'Repeated Requests',
      desc: 'Replay of auth endpoints',
      icon: Repeat,
      color: 'text-[#FBBF24] hover:border-[#FBBF24]/50 hover:bg-[#FBBF24]/10',
    },
    {
      id: 'packet-rate',
      name: 'Packet Rate Surge',
      desc: 'Surge in packets without payload',
      icon: Radio,
      color: 'text-[#9B7BFF] hover:border-[#9B7BFF]/50 hover:bg-[#9B7BFF]/10',
    },
    {
      id: 'data-volume',
      name: 'Excessive Data',
      desc: 'Heavy data transfer bandwidth',
      icon: HardDrive,
      color: 'text-[#38BDF8] hover:border-[#38BDF8]/50 hover:bg-[#38BDF8]/10',
    },
    {
      id: 'duration',
      name: 'Unusual Latency',
      desc: 'Degraded connection duration',
      icon: Clock,
      color: 'text-[#F472B6] hover:border-[#F472B6]/50 hover:bg-[#F472B6]/10',
    },
    {
      id: 'prolonged',
      name: 'Prolonged Abnormal',
      desc: 'Persistent sustained attack rate',
      icon: Flame,
      color: 'text-[#EF4444] hover:border-[#EF4444]/50 hover:bg-[#EF4444]/10',
    },
    {
      id: 'combined',
      name: 'Combined Anomaly',
      desc: 'Multi-feature concurrent burst',
      icon: Shuffle,
      color: 'text-[#A855F7] hover:border-[#A855F7]/50 hover:bg-[#A855F7]/10',
    },
  ];

  return (
    <div className="bg-[#17172A]/90 rounded-2xl p-6 space-y-5 shadow-xl border border-[#C4B5FD]/16 relative overflow-hidden backdrop-blur-xl">
      {/* Top Header & Subsystem Health */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#C4B5FD]/12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8055F6]/20 border border-[#8055F6]/30 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-[#4DD9F0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#F5F3FF]">Network Telemetry & Anomaly Controller</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#8055F6]/20 text-[#C4B5FD] border border-[#8055F6]/30">
                LIVE STREAM
              </span>
            </div>
            <p className="text-xs text-[#C4C2D6]">
              Simulates network flows against EV charging station gateway (127.0.0.1:8080) with real-time detection & baseline synchronization.
            </p>
          </div>
        </div>

        {/* Subsystem Health Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 ${
              serverStatus === 'ONLINE'
                ? 'bg-[#34D399]/15 border-[#34D399]/30 text-[#34D399]'
                : 'bg-[#FB7185]/15 border-[#FB7185]/30 text-[#FB7185]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Station: {serverStatus}</span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 ${
              backendStatus === 'ONLINE'
                ? 'bg-[#34D399]/15 border-[#34D399]/30 text-[#34D399]'
                : 'bg-[#FB7185]/15 border-[#FB7185]/30 text-[#FB7185]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Backend: {backendStatus}</span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 ${
              mlEngineStatus === 'ONLINE'
                ? 'bg-[#34D399]/15 border-[#34D399]/30 text-[#34D399]'
                : 'bg-[#FB7185]/15 border-[#FB7185]/30 text-[#FB7185]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>ML Engine: {mlEngineStatus}</span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 ${
              telemetryStatus === 'ACTIVE'
                ? 'bg-[#4DD9F0]/15 border-[#4DD9F0]/30 text-[#4DD9F0]'
                : 'bg-[#252542] border-[#C4B5FD]/16 text-[#9896B0]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                telemetryStatus === 'ACTIVE' ? 'bg-[#4DD9F0] animate-pulse' : 'bg-[#9896B0]'
              }`}
            />
            <span>Stream: {telemetryStatus}</span>
          </div>
        </div>
      </div>

      {/* Active Detector Selector Toggle Bar */}
      <div className="bg-[#1D1D35] p-3 rounded-xl border border-[#C4B5FD]/16 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#9B7BFF]" />
          <span className="text-xs font-mono font-bold text-[#F5F3FF] uppercase tracking-wider">
            Active Detection Method:
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {detectors.map((det) => {
            const isSelected = activeDetector === det.id;
            return (
              <button
                key={det.id}
                onClick={() => setActiveDetector(det.id)}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all text-left flex flex-col ${
                  isSelected
                    ? 'bg-[#8055F6] text-[#F5F3FF] shadow-md ring-2 ring-[#8055F6]/40'
                    : 'bg-[#252542] text-[#C4C2D6] hover:text-[#F5F3FF] hover:bg-[#303052] border border-[#C4B5FD]/10'
                }`}
              >
                <span>{det.name}</span>
                <span className={`text-[9px] font-normal ${isSelected ? 'text-[#F5F3FF]/80' : 'text-[#9896B0]'}`}>
                  {det.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Simulation Lifecycle Controls & Active State Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Core Actions & Drawer Toggle */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={startNormalTraffic}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-sm ${
                simulationMode === 'NORMAL' && !isAnomalous && !isStopped
                  ? 'bg-[#34D399] text-[#11111F] ring-2 ring-[#34D399]/40'
                  : 'bg-[#252542] hover:bg-[#303052] text-[#F5F3FF] border border-[#C4B5FD]/16 hover:-translate-y-0.5'
              }`}
              title="Start normal baseline background traffic generation"
            >
              <Play className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Start Baseline</span>
            </button>

            <button
              onClick={() => triggerScenario('return-to-normal')}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs font-mono flex items-center gap-2 border transition-all hover:-translate-y-0.5 shadow-sm ${
                isRecovering
                  ? 'bg-[#FBBF24]/20 border-[#FBBF24]/50 text-[#FBBF24] ring-2 ring-[#FBBF24]/20'
                  : 'bg-[#8055F6]/15 hover:bg-[#8055F6]/25 text-[#C4B5FD] border-[#8055F6]/30'
              }`}
              title="Halt abnormal traffic injection and safely transition to normal baseline"
            >
              <CheckCircle className="w-3.5 h-3.5 text-[#34D399]" />
              <span>{isRecovering ? 'Recovering...' : 'Return to Normal'}</span>
            </button>

            <button
              onClick={stopTraffic}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs font-mono flex items-center gap-2 border transition-all hover:-translate-y-0.5 shadow-sm ${
                isStopped
                  ? 'bg-[#FB7185]/20 border-[#FB7185]/40 text-[#FB7185]'
                  : 'bg-[#252542] hover:bg-[#303052] text-[#C4C2D6] hover:text-[#F5F3FF] border-[#C4B5FD]/16'
              }`}
              title="Pause telemetry stream"
            >
              <Square className="w-3.5 h-3.5 text-[#FB7185]" />
              <span>Stop</span>
            </button>

            <button
              onClick={resetDemo}
              className="px-3.5 py-2 rounded-xl font-bold text-xs font-mono flex items-center gap-2 bg-[#252542] hover:bg-[#303052] text-[#C4C2D6] hover:text-[#F5F3FF] border border-[#C4B5FD]/16 transition-all hover:-translate-y-0.5 shadow-sm"
              title="Reset telemetry counters and baseline statistics"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#9896B0]" />
              <span>Reset</span>
            </button>

            <button
              onClick={() => setShowAdvancedSettings((prev) => !prev)}
              className="px-3 py-2 rounded-xl font-bold text-xs font-mono flex items-center gap-1.5 bg-[#1D1D35] hover:bg-[#252542] text-[#C4C2D6] hover:text-[#F5F3FF] border border-[#C4B5FD]/16 transition-all shadow-sm ml-auto"
            >
              <Settings className="w-3.5 h-3.5 text-[#9B7BFF]" />
              <span>Settings</span>
              {showAdvancedSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Collapsible Advanced Settings Drawer */}
          {showAdvancedSettings && (
            <div className="bg-[#1D1D35] rounded-xl p-3.5 border border-[#C4B5FD]/16 space-y-3">
              {/* Traffic Intensity */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-mono text-[#C4C2D6] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#9B7BFF]" /> Traffic Intensity:
                </span>
                <div className="flex items-center gap-1 bg-[#252542] p-1 rounded-lg border border-[#C4B5FD]/16 text-xs font-mono">
                  {(['LOW', 'MEDIUM', 'HIGH', 'EXTREME'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSimulationIntensity(lvl)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        intensity === lvl
                          ? 'bg-[#8055F6] text-[#F5F3FF] shadow-sm'
                          : 'text-[#9896B0] hover:text-[#F5F3FF]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Automatic Demo Simulation */}
              <div className="pt-2 border-t border-[#C4B5FD]/12 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-[#4DD9F0]" />
                  <div>
                    <div className="text-xs font-bold text-[#F5F3FF]">Automatic Demo Cycles</div>
                    <div className="text-[10px] text-[#C4C2D6]">
                      {isAutoDemoEnabled ? (
                        autoSimulation?.phase === 'ATTACK_PERIOD' ? (
                          <span className="text-[#FB7185]">
                            Active ({autoSimulation.scenario}): {autoSimulation.activeAttackSecondsRemaining}s left
                          </span>
                        ) : (
                          <span className="text-[#34D399]">
                            Next injection in: {autoSimulation?.secondsToNextAttack ?? 0}s
                          </span>
                        )
                      ) : (
                        'Periodically injects controlled anomalies without manual input'
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#C4C2D6]">
                    <label className="flex items-center gap-1">
                      <span>Int:</span>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={customInterval}
                        onChange={(e) => setCustomInterval(Math.max(5, parseInt(e.target.value) || 15))}
                        disabled={isAutoDemoEnabled}
                        className="w-10 px-1 py-0.5 bg-[#252542] border border-[#C4B5FD]/20 rounded text-[#F5F3FF] text-[10px] text-center font-mono disabled:opacity-50"
                      />
                      <span>s</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <span>Dur:</span>
                      <input
                        type="number"
                        min="3"
                        max="60"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(Math.max(3, parseInt(e.target.value) || 8))}
                        disabled={isAutoDemoEnabled}
                        className="w-10 px-1 py-0.5 bg-[#252542] border border-[#C4B5FD]/20 rounded text-[#F5F3FF] text-[10px] text-center font-mono disabled:opacity-50"
                      />
                      <span>s</span>
                    </label>
                  </div>

                  {isAutoDemoEnabled ? (
                    <button
                      onClick={() => disableAutoDemo()}
                      className="px-2.5 py-1 rounded-lg font-bold text-[11px] font-mono flex items-center gap-1 bg-[#FB7185]/15 hover:bg-[#FB7185]/25 text-[#FB7185] border border-[#FB7185]/30 transition-all"
                    >
                      <PauseCircle className="w-3.5 h-3.5" />
                      <span>Disable</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => enableAutoDemo(customInterval, customDuration)}
                      className="px-2.5 py-1 rounded-lg font-bold text-[11px] font-mono flex items-center gap-1 bg-[#8055F6]/20 hover:bg-[#8055F6]/30 text-[#F5F3FF] border border-[#8055F6]/40 transition-all"
                    >
                      <PlayCircle className="w-3.5 h-3.5 text-[#9B7BFF]" />
                      <span>Enable</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* High-Contrast Active State Cards */}
        <div className="lg:col-span-5 bg-[#1D1D35] rounded-xl p-3.5 border border-[#C4B5FD]/16 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[10px] uppercase text-[#C4C2D6] font-semibold tracking-wider">Live State</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-md border text-[10px] ${
                isAnomalous
                  ? 'bg-[#FB7185]/20 border-[#FB7185]/40 text-[#FB7185]'
                  : isRecovering
                  ? 'bg-[#FBBF24]/20 border-[#FBBF24]/40 text-[#FBBF24]'
                  : isStopped
                  ? 'bg-[#252542] border-[#C4B5FD]/20 text-[#9896B0]'
                  : 'bg-[#34D399]/20 border-[#34D399]/40 text-[#34D399]'
              }`}
            >
              {isAnomalous
                ? `ANOMALY: ${simulationMode}`
                : isRecovering
                ? 'RECOVERING: BASELINE ADAPTATION'
                : isStopped
                ? 'STREAM STOPPED'
                : 'NOMINAL BASELINE'}
            </span>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-[#252542] p-2 rounded-lg border border-[#C4B5FD]/12">
              <div className="text-[9px] font-semibold text-[#C4C2D6] uppercase tracking-wider mb-0.5">Mode</div>
              <div className={`font-bold text-xs truncate ${isAnomalous ? 'text-[#FB7185]' : isRecovering ? 'text-[#FBBF24]' : 'text-[#9B7BFF]'}`}>
                {isStopped ? 'STOPPED' : simulationMode}
              </div>
            </div>
            <div className="bg-[#252542] p-2 rounded-lg border border-[#C4B5FD]/12">
              <div className="text-[9px] font-semibold text-[#C4C2D6] uppercase tracking-wider mb-0.5">Throughput</div>
              <div className="font-bold text-sm text-[#4DD9F0]">
                {requestsPerSec} <span className="text-[9px] text-[#C4C2D6]">req/s</span>
              </div>
            </div>
            <div className="bg-[#252542] p-2 rounded-lg border border-[#C4B5FD]/12">
              <div className="text-[9px] font-semibold text-[#C4C2D6] uppercase tracking-wider mb-0.5">Duration</div>
              <div className="font-bold text-sm text-[#F5F3FF]">
                {simulationState?.durationSeconds || 0}s
              </div>
            </div>
          </div>

          {/* Footer state chips */}
          <div className="pt-2 border-t border-[#C4B5FD]/12 flex items-center justify-between text-[10px] font-mono text-[#C4C2D6]">
            <span>
              Lifecycle: <strong className={isStopped ? 'text-[#FB7185]' : 'text-[#34D399]'}>{simulationLifecycle}</strong>
            </span>
            <span>
              Detector: <strong className={isAnomalous ? 'text-[#FB7185]' : isRecovering ? 'text-[#FBBF24]' : 'text-[#34D399]'}>{detectionStatus}</strong>
            </span>
            {isRecovering && recoveryStatus && (
              <span className="text-[#FBBF24]">
                Cycles: {recoveryStatus.consecutiveNormalCycles}/{recoveryStatus.requiredNormalCycles}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Anomaly Testing Grid */}
      <div className="space-y-2.5 pt-2 border-t border-[#C4B5FD]/12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-[#F5F3FF] uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-[#FB7185]" />
            <span>Anomaly Simulation Triggers</span>
          </div>
          <span className="text-[10px] font-mono text-[#C4C2D6]">
            Active Conns: <strong className="text-[#F5F3FF]">{activeConnections}</strong> | Packet Rate: <strong className="text-[#4DD9F0]">{packetRate} pkt/s</strong> | Bandwidth: <strong className="text-[#38BDF8]">{(bytesPerSecond / 1024).toFixed(1)} KB/s</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2">
          {anomalyScenarios.map((sc) => {
            const Icon = sc.icon;
            const scenarioModeKey = sc.id.toUpperCase().replace(/-/g, '_');
            const isSelected = simulationMode === scenarioModeKey || (sc.id === 'burst' && simulationMode === 'TRAFFIC_BURST') || (sc.id === 'data-volume' && simulationMode === 'EXCESSIVE_DATA') || (sc.id === 'duration' && simulationMode === 'UNUSUAL_LATENCY');

            return (
              <button
                key={sc.id}
                onClick={() => triggerScenario(sc.id)}
                className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected && isAnomalous
                    ? 'bg-[#FB7185]/20 border-[#FB7185] ring-2 ring-[#FB7185]/30 shadow-md'
                    : `bg-[#1D1D35] border-[#C4B5FD]/16 hover:bg-[#252542] hover:-translate-y-0.5 ${sc.color}`
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold font-mono text-[#F5F3FF]">{sc.name}</span>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                </div>
                <p className="text-[10px] text-[#C4C2D6] line-clamp-1">{sc.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
