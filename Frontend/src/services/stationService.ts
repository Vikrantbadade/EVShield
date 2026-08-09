import { apiClient, ApiResponseWrapper } from './apiClient';
import { DemoStation } from '../types/station';

export interface StationListResponse {
  items: DemoStation[];
  total: number;
  isDemo?: boolean;
}

export const stationService = {
  getStations: async (): Promise<StationListResponse> => {
    const response = await apiClient.get<ApiResponseWrapper<StationListResponse>>('/stations');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to retrieve charging station telemetry.');
  },

  getStationById: async (id: string): Promise<DemoStation> => {
    const response = await apiClient.get<ApiResponseWrapper<DemoStation>>(`/stations/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(`Station ${id} not found.`);
  },
};
