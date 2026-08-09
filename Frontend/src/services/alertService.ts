import { apiClient, ApiResponseWrapper } from './apiClient';

export interface AlertRecord {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  timestamp: string;
  attackId?: string;
  stationId?: string;
  mlConfidence?: number;
  isDemo: boolean;
}

export interface AlertListResponse {
  items: AlertRecord[];
  total: number;
  isDemo?: boolean;
}

export const alertService = {
  getAlerts: async (): Promise<AlertListResponse> => {
    const response = await apiClient.get<ApiResponseWrapper<AlertListResponse>>('/alerts');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to retrieve security alerts.');
  },

  getAlertById: async (id: string): Promise<AlertRecord> => {
    const response = await apiClient.get<ApiResponseWrapper<AlertRecord>>(`/alerts/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(`Alert ${id} not found.`);
  },
};
