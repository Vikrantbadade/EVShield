import { apiClient, ApiResponseWrapper } from './apiClient';

export interface AnalyticsData {
  attackFrequency: Array<{ date: string; count: number }>;
  attackDistribution: Array<{ type: string; percentage: number }>;
  trafficTrends: Array<{ timestamp: string; requests: number; anomalies: number }>;
  severityDistribution: Array<{ severity: string; count: number }>;
  stationHealthOverview: {
    nominal: number;
    elevated: number;
    critical: number;
  };
  mlPredictionStats: {
    totalEvaluated: number;
    normalCount: number;
    attackCount: number;
    falsePositiveRatePercent: number;
    avgInferenceTimeMs: number;
  };
  isDemo: boolean;
}

export const analyticsService = {
  getAnalytics: async (): Promise<AnalyticsData> => {
    const response = await apiClient.get<ApiResponseWrapper<AnalyticsData>>('/analytics');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to retrieve security analytics data.');
  },
};
