import { apiClient, ApiResponseWrapper } from './apiClient';

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
  totalPredictionsCount: number;
  avgInferenceLatencyMs: number;
  datasetName: string;
  isDemo: boolean;
}

export interface MLPrediction {
  classification: 'NORMAL' | 'ATTACK';
  confidence: number;
  attackType?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedNodes?: number;
  inferenceTimeMs?: number;
  timestamp?: string;
  demo?: boolean;
}

export const mlService = {
  getStatus: async (): Promise<MLModelStatus> => {
    const response = await apiClient.get<ApiResponseWrapper<MLModelStatus>>('/ml/status');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to retrieve ML model status.');
  },

  getMetrics: async (): Promise<MLModelMetrics> => {
    const response = await apiClient.get<ApiResponseWrapper<MLModelMetrics>>('/ml/metrics');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to retrieve ML evaluation metrics.');
  },

  predict: async (payload: Record<string, unknown>): Promise<MLPrediction> => {
    const response = await apiClient.post<ApiResponseWrapper<MLPrediction>>('/ml/predict', payload);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to execute ML prediction.');
  },
};
