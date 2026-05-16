import { api } from '../apiClient';
import type { ActivityState, Vital } from './types';

export const vitalsService = {
  async upload(params: {
    heartRate: number;
    temperature: number;
    spo2: number;
    activityState: ActivityState;
    timestamp?: string;
  }) {
    const { data } = await api.post<Vital>('/vitals/upload', params);
    return data;
  },

  async syncBulk(params: { dataPoints: Array<Partial<Vital> & { activityState: ActivityState; timestamp?: string }> }) {
    const { data } = await api.post<{ message: string; count: number }>('/vitals/sync', params);
    return data;
  },

  async getLive(userId: string) {
    const { data } = await api.get<Vital>(`/vitals/${userId}/live`);
    return data;
  },

  /** Returns null when no vitals exist (404) or request fails. */
  async getLiveOrNull(userId: string): Promise<Vital | null> {
    try {
      return await this.getLive(userId);
    } catch {
      return null;
    }
  },

  async getHistory(userId: string) {
    const { data } = await api.get<Vital[]>(`/vitals/${userId}/history`);
    return data;
  },
};

