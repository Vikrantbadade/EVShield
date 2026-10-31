import { apiClient, ApiResponseWrapper } from './apiClient';
import {
  DetectionMethod,
  MLModelStatus,
  ModelBenchmarkMetrics,
  ModelDetail,
  MLComparisonReport,
  DetectorPredictionResult,
  MLPrediction,
  MLPredictionRequest,
} from '../types/ml';

export type {
  DetectionMethod,
  MLModelStatus,
  ModelBenchmarkMetrics,
  ModelDetail,
  MLComparisonReport,
  DetectorPredictionResult,
  MLPrediction,
  MLPredictionRequest,
};

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

  getModelComparison: async (): Promise<MLComparisonReport> => {
    const response = await apiClient.get<ApiResponseWrapper<MLComparisonReport>>('/ml/comparison');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to retrieve model comparison report.');
  },

  triggerEvaluation: async (): Promise<MLComparisonReport> => {
    const response = await apiClient.post<ApiResponseWrapper<MLComparisonReport>>('/ml/evaluate');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to run model evaluation.');
  },

  retrainModels: async (target = 'all'): Promise<{ success: boolean; message: string; report?: MLComparisonReport }> => {
    const response = await apiClient.post<ApiResponseWrapper<{ message: string; report?: MLComparisonReport }>>('/ml/retrain', { target });
    if (response.data.success && response.data.data) {
      return {
        success: true,
        message: response.data.data.message,
        report: response.data.data.report,
      };
    }
    throw new Error('Failed to retrain models.');
  },

  selectDetector: async (detector: DetectionMethod): Promise<{ activeDetector: DetectionMethod }> => {
    const response = await apiClient.post<ApiResponseWrapper<{ activeDetector: DetectionMethod }>>('/ml/select-detector', { detector });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to set active detector.');
  },

  getActiveDetector: async (): Promise<DetectionMethod> => {
    const response = await apiClient.get<ApiResponseWrapper<{ activeDetector: DetectionMethod }>>('/ml/active-detector');
    if (response.data.success && response.data.data) {
      return response.data.data.activeDetector;
    }
    return 'RANDOM_FOREST';
  },

  predict: async (payload: MLPredictionRequest): Promise<MLPrediction> => {
    const response = await apiClient.post<ApiResponseWrapper<MLPrediction>>('/ml/predict', payload);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to execute ML prediction.');
  },
};
