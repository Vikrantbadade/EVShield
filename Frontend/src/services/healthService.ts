import { apiClient } from './apiClient';

export interface HealthCheckStatus {
  success: boolean;
  service: string;
  status: string;
  timestamp: string;
  version: string;
  database?: {
    connected: boolean;
    latencyMs: number;
  };
}

export const healthService = {
  getHealth: async (): Promise<HealthCheckStatus> => {
    const response = await apiClient.get<HealthCheckStatus>('/health');
    return response.data;
  },
};
