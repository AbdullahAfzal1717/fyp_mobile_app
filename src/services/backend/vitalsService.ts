import { api } from '../apiClient';
import type { ActivityState, Vital } from './types';
import { vitalsQueue } from '../offline/vitalsQueue';
import { flushVitalsQueue } from '../offline/syncManager';

export type UploadResult = {
  vital: Vital | null;
  /** true when stored locally because network/upload failed */
  buffered: boolean;
  queueSize: number;
};

export const vitalsService = {
  /**
   * Upload one vital reading. On failure, buffers locally (offline Smart-Sync).
   */
  async upload(params: {
    heartRate: number;
    temperature: number;
    spo2: number;
    activityState: ActivityState;
    timestamp?: string;
  }): Promise<UploadResult> {
    try {
      const { data } = await api.post<Vital>('/vitals/upload', params);
      // Opportunistic flush of any older buffered packets
      const flushed = await flushVitalsQueue();
      return {
        vital: data,
        buffered: false,
        queueSize: flushed.remaining,
      };
    } catch {
      await vitalsQueue.enqueue(params);
      return {
        vital: null,
        buffered: true,
        queueSize: await vitalsQueue.count(),
      };
    }
  },

  async syncBulk(params: {
    dataPoints: Array<
      Partial<Vital> & { activityState: ActivityState; timestamp?: string }
    >;
  }) {
    const { data } = await api.post<{ message: string; count: number }>(
      '/vitals/sync',
      params,
    );
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

  async getQueueSize() {
    return vitalsQueue.count();
  },

  async flushQueue() {
    return flushVitalsQueue();
  },
};
