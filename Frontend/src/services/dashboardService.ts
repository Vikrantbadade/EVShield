import { apiClient, ApiResponseWrapper } from './apiClient';

export interface DashboardSummaryData {
  totalRequests: number;
  requestsAnalyzed: number;
  attacksDetected: number;
  activeThreats: number;
  protectedChargers: number;
  totalChargers: number;
  mlAccuracy: number;
  networkHealth: number;
  requestsPerSecond: number;
  affectedNodes: number;
  securityStatus: 'PROTECTED' | 'THREAT DETECTED';
  isDemo: boolean;
}

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummaryData> => {
    const response = await apiClient.get<ApiResponseWrapper<DashboardSummaryData>>('/dashboard');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to retrieve dashboard summary metrics.');
  },
};
