/**
 * EVShield Machine Learning & Multi-Detector Types
 */

export type DetectionMethod = 'THRESHOLD' | 'RANDOM_FOREST' | 'ISOLATION_FOREST' | 'ENSEMBLE';

export interface MLPredictionRequest {
  // Network flow features
  packet_rate?: number;
  request_rate?: number;
  new_connection_rate?: number;
  active_connections?: number;
  data_transfer_volume?: number;
  connection_duration?: number;
  request_frequency?: number;

  // Selected detection method
  method?: DetectionMethod | 'ALL';

  // Legacy/operational fallbacks
  requestsPerSecond?: number;
  packetRate?: number;
  dataTransferredBytes?: number;
  activeConnections?: number;
  newConnectionRate?: number;
  avgConnectionDurationMs?: number;
  data_point?: number[];
  symbol?: string;

  [key: string]: unknown;
}

export interface DetectorPredictionResult {
  method: DetectionMethod;
  is_anomaly: boolean;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence?: number;
  probability_attack?: number;
  anomaly_score?: number;
  raw_prediction?: number;
  predicted_class_id?: number;
  class_probabilities?: Record<string, number>;
  contributing_features: string[];
  explanation: string;
  max_deviation_percent?: number;
  latency_ms: number;
  vote_count?: number;
  votes?: Record<string, boolean>;
}

export interface MLPrediction {
  classification: 'NORMAL' | 'ATTACK';
  confidence: number;
  method?: DetectionMethod;
  threshold?: number;
  mode?: string;
  attackType?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedNodes?: number;
  inferenceTimeMs?: number;
  timestamp?: string;
  demo?: boolean;
  active_detector_result?: DetectorPredictionResult;
  all_results?: {
    threshold?: DetectorPredictionResult;
    random_forest?: DetectorPredictionResult;
    isolation_forest?: DetectorPredictionResult;
    ensemble?: DetectorPredictionResult;
  };
  extracted_features?: Record<string, number>;
}

export interface MLModelStatus {
  modelLoaded: boolean;
  modelName: string;
  version: string;
  pipelineVersion: string;
  status: 'READY' | 'DEGRADED' | 'UNAVAILABLE';
  activeDetector: DetectionMethod;
  availableDetectors: DetectionMethod[];
  modelsLoaded: {
    threshold: boolean;
    random_forest: boolean;
    isolation_forest: boolean;
  };
  lastEvaluationTimestamp: string;
  daemonOnline: boolean;
  isDemo: boolean;
}

export interface ModelBenchmarkMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  false_positive_rate: number;
  true_positive_rate: number;
  confusion_matrix: number[][];
  latency_ms: number;
  throughput_samples_per_sec: number;
  multi_class?: {
    accuracy: number;
    macro_f1: number;
    weighted_f1: number;
    confusion_matrix_7x7: number[][];
    classes: string[];
  };
}

export interface ModelDetail {
  id: DetectionMethod;
  name: string;
  type: string;
  status: 'READY' | 'NOT_TRAINED' | 'UNAVAILABLE';
  is_supervised: boolean;
  training_samples: number;
  training_time_seconds: number;
  metrics: ModelBenchmarkMetrics;
  feature_importance?: Record<string, number>;
  score_distribution?: {
    normal: Record<string, number>;
    anomalous: Record<string, number>;
    decision_threshold: number;
  };
  summary: string;
}

export interface MLComparisonReport {
  evaluation_timestamp: string;
  dataset: {
    name: string;
    features: string[];
    classes: Record<string, string> | string[];
    train_samples: number;
    test_samples: number;
    test_normal_count: number;
    test_anomaly_count: number;
    total_test_samples?: number;
    normal_samples?: number;
    anomalous_samples?: number;
    feature_columns?: string[];
  };
  models: {
    threshold?: ModelDetail;
    random_forest?: ModelDetail;
    isolation_forest?: ModelDetail;
    THRESHOLD: ModelDetail;
    RANDOM_FOREST: ModelDetail;
    ISOLATION_FOREST: ModelDetail;
    [key: string]: any;
  };
  summary?: {
    best_accuracy_model: string;
    best_f1_model: string;
    fastest_inference_model: string;
    lowest_fpr_model: string;
  };
  best_performing_method: DetectionMethod;
  comparative_analysis: string;
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
