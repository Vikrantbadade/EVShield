/**
 * CICEV2023 REAL ML SERVICE CONTRACTS (Phase 10)
 */

export interface MLPredictionRequest {
  // Can be a raw series array or engineered feature values
  data_point?: number[];
  symbol?: string;

  // Standard 10 TOP statistical features
  count?: number;
  mean?: number;
  max?: number;
  sum?: number;
  std?: number;
  min?: number;
  median?: number;
  q1?: number;
  q3?: number;
  iqr?: number;

  // Operational fallback parameters
  requestsPerSecond?: number;
  sourceIp?: string;
  targetNodeId?: string;

  [key: string]: unknown;
}

export interface MLPrediction {
  classification: 'NORMAL' | 'ATTACK';
  confidence: number; // Attack probability from model (0.0 to 1.0)
  threshold?: number;
  mode?: 'REPLAY_SERIES' | 'ENGINEERED_VECTOR' | 'TELEMETRY_FALLBACK';
  attackType?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedNodes?: number;
  inferenceTimeMs?: number;
  timestamp?: string;
  demo?: boolean;
}

export interface MLModelStatus {
  modelLoaded: boolean;
  modelName: string;
  version: string;
  pipelineVersion: string;
  status: 'READY' | 'DEGRADED' | 'UNAVAILABLE' | 'DEMO_MODE';
  lastEvaluationTimestamp: string;
  isDemo: boolean;
}

export interface MLModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc?: number;
  prAuc?: number;
  falsePositiveRatePercent?: number;
  confusionMatrix?: number[][];
  totalPredictionsCount: number;
  avgInferenceLatencyMs: number;
  datasetName: string;
  isDemo: boolean;
}
