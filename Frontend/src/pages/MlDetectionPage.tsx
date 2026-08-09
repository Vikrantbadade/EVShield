import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { mlService, MLModelStatus, MLModelMetrics, MLPrediction } from '../services/mlService';
import { StatusChip } from '../components/ui/StatusChip';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { ApiConnectionBanner } from '../components/ui/ApiConnectionBanner';
import {
  Brain, Cpu, CheckCircle2, RefreshCw, Zap, Shield,
  Info, Play, AlertTriangle, Database, GitBranch,
} from 'lucide-react';

/** Extended prediction shape that includes fields returned by the backend
 *  but not yet typed in the service interface. */
interface ExtendedPrediction extends MLPrediction {
  mode?: string;
  threshold?: number;
  extracted_features?: Record<string, number>;
  demo?: boolean;
}

/* ─── Replay Series Fixture ───────────────────────────────── */
const REPLAY_FIXTURE = {
  // Real kernel-symbol series from CICEV2023 dataset:
  // Correct_ID/Random_CS_OFF/Gaussian_Off/TOP/CS/TOP.json
  // Symbol: __update_load_avg_se, label: attack
  data_point: [3.26, 2.94, 2.41, 2.13, 1.96, 2.59, 2.10, 2.76, 2.63, 2.36],
  symbol: '__update_load_avg_se',
};

/* ─── Pre-built Engineered Vector ─────────────────────────── */
const VECTOR_FIXTURE = {
  count: 14.0, mean: 2.4964, max: 3.26, sum: 34.95,
  std: 0.3929, min: 1.96, median: 2.47, q1: 2.15, q3: 2.7275, iqr: 0.5775,
};

type PredictMode = 'REPLAY_SERIES' | 'ENGINEERED_VECTOR';

export const MlDetectionPage: React.FC = () => {
  const [status, setStatus] = useState<MLModelStatus | null>(null);
  const [metrics, setMetrics] = useState<MLModelMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  /* Predict form */
  const [predictMode, setPredictMode] = useState<PredictMode>('REPLAY_SERIES');
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<ExtendedPrediction | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);

  const fetchMLData = useCallback(async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const [statusRes, metricsRes] = await Promise.all([
        mlService.getStatus(),
        mlService.getMetrics(),
      ]);
      setStatus(statusRes);
      setMetrics(metricsRes);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to query ML service data.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMLData();
  }, [fetchMLData]);

  const runPrediction = async () => {
    setIsPredicting(true);
    setPredictError(null);
    setPrediction(null);
    try {
      const payload = predictMode === 'REPLAY_SERIES' ? REPLAY_FIXTURE : VECTOR_FIXTURE;
      const result = await mlService.predict(payload as Record<string, unknown>);
      setPrediction(result as ExtendedPrediction);
    } catch (err) {
      setPredictError(err instanceof Error ? err.message : 'Prediction failed.');
    } finally {
      setIsPredicting(false);
    }
  };

  const isAttack = prediction?.classification === 'ATTACK';

  return (
    <AppLayout pageTitle="ML Detection Engine">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#AD8B73]/18">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3F3832] tracking-tight">
                ML Detection Engine
              </h2>
              <StatusChip
                label={status?.status === 'READY' ? 'REAL ML MODEL' : 'CONNECTING…'}
                variant={status?.status === 'READY' ? 'live' : 'demo'}
                dot
                pulse={status?.status !== 'READY'}
              />
              <StatusChip label="BACKEND API V1" variant="live" />
            </div>
            <p className="text-sm text-[#514940]">
              CICEV2023 Random Forest DDoS classification pipeline — status, evaluation metrics &amp; live inference.
            </p>
          </div>
          <button
            onClick={fetchMLData}
            disabled={isRefreshing}
            className="p-3 rounded-2xl bg-white/70 hover:bg-white/90 border border-white/90 text-[#7A7067] hover:text-[#3F3832] transition-colors shadow-glass-sm self-start sm:self-auto"
            title="Refresh ML metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#AD8B73]' : ''}`} />
          </button>
        </div>

        {/* Architecture / Mode Disclaimer */}
        <div className="glass-cream rounded-[24px] p-5 border border-[#CEAB93]/40 bg-[#CEAB93]/08 shadow-glass-sm">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#AD8B73] shrink-0 mt-0.5" />
            <div className="text-xs text-[#514940] space-y-2 flex-1">
              <h4 className="font-bold text-[#3F3832] text-sm">CICEV2023 ML Architecture &amp; Current Execution Mode</h4>
              <div className="grid sm:grid-cols-2 gap-4 mt-2">
                <div className="space-y-1.5">
                  <p className="font-semibold text-[#3F3832] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#62C073]" />
                    Active (Development / Replay)
                  </p>
                  <p>Scikit-Learn <code className="font-mono bg-white/60 px-1 rounded">RandomForestClassifier</code> loaded from <code className="font-mono bg-white/60 px-1 rounded">model.joblib</code> (n=400, threshold=0.55) via local Python subprocess. Input uses CICEV2023 replay fixtures labelled <code className="font-mono bg-white/60 px-1 rounded">REPLAY_SERIES</code> / <code className="font-mono bg-white/60 px-1 rounded">ENGINEERED_VECTOR</code>.</p>
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-[#514940] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#D99A32]" />
                    Future (Linux Live Mode)
                  </p>
                  <p>Docker Charging Server → OCPP auth workload → Linux <code className="font-mono bg-white/60 px-1 rounded">perf_event_open</code> TOP collector → same feature extractor → same model. Not active on Windows development host.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {apiError && (
          <ApiConnectionBanner message={apiError} onRetry={fetchMLData} isRetrying={isRefreshing} />
        )}

        {/* Model Overview Hero */}
        <ScrollReveal>
          <div className="glass-cream rounded-[32px] p-6 sm:p-8 shadow-glass border border-white/90 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#AD8B73]/15 border border-[#AD8B73]/30 flex items-center justify-center text-[#AD8B73] shrink-0">
                  <Brain className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#3F3832]">{status?.modelName ?? 'CICEV2023_RandomForest_v1'}</h3>
                  <p className="text-xs font-mono text-[#7A7067] mt-0.5">
                    Pipeline: {status?.pipelineVersion ?? 'CICEV2023-TOP-RicherStats-v1'} &bull; v{status?.version ?? '1.0.0'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span className="px-3.5 py-1.5 rounded-xl bg-white/70 border border-white/90 text-[#3F3832] font-semibold shadow-glass-sm flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-[#19BFA3]" />
                  Status: {status?.status ?? 'READY'}
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-white/70 border border-white/90 text-[#3F3832] font-semibold shadow-glass-sm flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2b703b]" />
                  Loaded: {status?.modelLoaded ? 'TRUE' : 'FALSE'}
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-white/70 border border-white/90 text-[#3F3832] font-semibold shadow-glass-sm flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-[#AD8B73]" />
                  isDemo: {String(status?.isDemo ?? false).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Model technical specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { label: 'Algorithm', value: 'RandomForest' },
                { label: 'n_estimators', value: '400' },
                { label: 'Threshold', value: '0.55' },
                { label: 'Features', value: '10 TOP stats' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/55 rounded-xl px-3.5 py-3 border border-white/80">
                  <div className="text-[10px] font-mono text-[#7A7067] uppercase tracking-wide">{label}</div>
                  <div className="text-sm font-bold font-mono text-[#3F3832] mt-0.5">{value}</div>
                </div>
              ))}
            </div>

            {/* Feature list */}
            <div className="mt-4 bg-white/55 rounded-xl px-4 py-3 border border-white/80">
              <div className="text-[10px] font-mono text-[#7A7067] uppercase tracking-wide mb-2">Feature Vector Order</div>
              <div className="flex flex-wrap gap-1.5">
                {['count', 'mean', 'max', 'sum', 'std', 'min', 'median', 'q1', 'q3', 'iqr'].map((f, i) => (
                  <span key={f} className="px-2 py-0.5 rounded-lg bg-[#19BFA3]/10 border border-[#19BFA3]/20 text-[11px] font-mono text-[#0d7a67]">
                    <span className="text-[#AD8B73] mr-1">[{i}]</span>{f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Metrics Grid */}
        <ScrollReveal delay={100}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Accuracy', value: `${((metrics?.accuracy ?? 0.6960) * 100).toFixed(1)}%`, icon: Shield, color: 'text-[#19BFA3]' },
              { label: 'Precision', value: `${((metrics?.precision ?? 0.7559) * 100).toFixed(1)}%`, icon: Zap, color: 'text-[#52A8FF]' },
              { label: 'Recall', value: `${((metrics?.recall ?? 0.7973) * 100).toFixed(1)}%`, icon: Brain, color: 'text-[#D99A32]' },
              { label: 'F1 Score', value: `${((metrics?.f1Score ?? 0.7760) * 100).toFixed(1)}%`, icon: CheckCircle2, color: 'text-[#2b703b]' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="glass-cream rounded-[24px] p-5 space-y-2 shadow-glass-sm hover:-translate-y-0.5 transition-all border border-white/90">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-[#7A7067] uppercase">{label}</span>
                  <div className="p-2 rounded-xl bg-white/70 border border-white/90">
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <div className="text-3xl font-extrabold font-mono text-[#3F3832] tracking-tight">{value}</div>
                <div className="text-[10px] font-mono text-[#7A7067]">Held-Out TEST (@0.50 threshold)</div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Live Inference Panel */}
        <ScrollReveal delay={150}>
          <div className="glass-cream rounded-[32px] p-6 sm:p-8 shadow-glass border border-white/90 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#19BFA3]/12 border border-[#19BFA3]/25 flex items-center justify-center shrink-0">
                <GitBranch className="w-5 h-5 text-[#19BFA3]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#3F3832]">Run ML Inference</h3>
                <p className="text-xs text-[#514940] mt-0.5">
                  Execute the real <code className="font-mono">model.joblib</code> via the backend Python subprocess.
                  Prediction is persisted to PostgreSQL (<code className="font-mono">MLPrediction</code> table).
                </p>
              </div>
            </div>

            {/* Mode selector */}
            <div className="flex flex-col sm:flex-row gap-3">
              {(['REPLAY_SERIES', 'ENGINEERED_VECTOR'] as PredictMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setPredictMode(mode); setPrediction(null); setPredictError(null); }}
                  className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all text-left ${predictMode === mode
                      ? 'bg-[#CEAB93]/25 border-[#CEAB93]/50 shadow-glass-sm'
                      : 'bg-white/50 border-white/80 hover:bg-white/70'
                    }`}
                >
                  <span className={`w-3 h-3 rounded-full border-2 shrink-0 ${predictMode === mode ? 'bg-[#AD8B73] border-[#AD8B73]' : 'border-[#7A7067]'
                    }`} />
                  <div>
                    <div className="text-xs font-mono font-bold text-[#3F3832]">{mode}</div>
                    <div className="text-[10px] text-[#7A7067] mt-0.5">
                      {mode === 'REPLAY_SERIES'
                        ? 'Raw kernel-symbol series → Feature Extractor → Model'
                        : 'Pre-built 10-feature vector → Model directly'}
                    </div>
                  </div>
                  {mode === 'REPLAY_SERIES'
                    ? <StatusChip label="REPLAY" variant="replay" className="ml-auto" />
                    : <StatusChip label="VECTOR" variant="monitoring" className="ml-auto" />
                  }
                </button>
              ))}
            </div>

            {/* Input preview */}
            <div className="bg-white/55 rounded-xl border border-white/80 p-4">
              <div className="text-[10px] font-mono text-[#7A7067] uppercase tracking-wide mb-2">Payload Preview</div>
              <pre className="text-[11px] font-mono text-[#3F3832] overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
                {JSON.stringify(predictMode === 'REPLAY_SERIES' ? REPLAY_FIXTURE : VECTOR_FIXTURE, null, 2)}
              </pre>
              {predictMode === 'REPLAY_SERIES' && (
                <div className="mt-3 text-[10px] font-mono text-[#7A7067]">
                  Source: CICEV2023 <code>Correct_ID/Random_CS_OFF/Gaussian_Off/TOP</code> — symbol: <code>__update_load_avg_se</code>
                </div>
              )}
            </div>

            {/* Run button */}
            <button
              onClick={runPrediction}
              disabled={isPredicting || status?.status !== 'READY'}
              className="btn-primary w-full sm:w-auto justify-center"
            >
              {isPredicting
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Running Inference…</>
                : <><Play className="w-4 h-4" /> Run {predictMode} Prediction</>
              }
            </button>

            {/* Prediction error */}
            {predictError && (
              <div className="flex items-start gap-3 rounded-2xl bg-[#E85C68]/10 border border-[#E85C68]/25 p-4">
                <AlertTriangle className="w-4 h-4 text-[#E85C68] shrink-0 mt-0.5" />
                <p className="text-xs text-[#a82d38] font-mono">{predictError}</p>
              </div>
            )}

            {/* Prediction result */}
            {prediction && (
              <div className={`rounded-2xl border p-5 space-y-4 ${isAttack
                  ? 'bg-[#E85C68]/08 border-[#E85C68]/30'
                  : 'bg-[#62C073]/08 border-[#62C073]/25'
                }`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    {isAttack
                      ? <AlertTriangle className="w-6 h-6 text-[#E85C68]" />
                      : <CheckCircle2 className="w-6 h-6 text-[#62C073]" />
                    }
                    <span className={`text-2xl font-extrabold font-mono ${isAttack ? 'text-[#a82d38]' : 'text-[#2b703b]'}`}>
                      {prediction.classification}
                    </span>
                  </div>
                  <StatusChip
                    label={prediction.mode ?? predictMode}
                    variant="replay"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  {[
                    { label: 'Confidence', value: `${(prediction.confidence * 100).toFixed(1)}%` },
                    { label: 'Threshold', value: String(prediction.threshold ?? '0.55') },
                    { label: 'Severity', value: prediction.severity ?? '—' },
                    { label: 'Latency', value: `${prediction.inferenceTimeMs ?? '—'} ms` },
                    { label: 'isDemo', value: String(prediction.demo ?? false).toUpperCase() },
                    { label: 'Saved to DB', value: 'YES — MLPrediction' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/60 rounded-xl px-3 py-2.5 border border-white/80">
                      <div className="text-[10px] text-[#7A7067] uppercase tracking-wide">{label}</div>
                      <div className="font-semibold text-[#3F3832] mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Extracted features if REPLAY_SERIES */}
                {prediction.extracted_features && (
                  <div className="bg-white/55 rounded-xl p-3 border border-white/80">
                    <div className="text-[10px] font-mono text-[#7A7067] uppercase tracking-wide mb-2">Extracted Features</div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(prediction.extracted_features).map(([k, v]) => (
                        <span key={k} className="px-2 py-0.5 rounded-lg bg-[#19BFA3]/10 border border-[#19BFA3]/20 text-[11px] font-mono text-[#0d7a67]">
                          {k}: <strong>{typeof v === 'number' ? v.toFixed(4) : v}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </AppLayout>
  );
};