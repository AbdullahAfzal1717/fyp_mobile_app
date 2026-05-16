import { api } from '../apiClient';
import type { Alert } from './types';

export const alertsService = {
  async listByUser(userId: string) {
    const { data } = await api.get<Alert[]>(`/alerts/${userId}`);
    return data;
  },

  /** Merge alerts for multiple patients (supervisor dashboard). */
  async listForPatients(patientIds: string[]) {
    if (!patientIds.length) return [];
    const batches = await Promise.all(
      patientIds.map(async (id) => {
        try {
          return await this.listByUser(id);
        } catch {
          return [];
        }
      }),
    );
    const merged = batches.flat();
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return merged;
  },

  async markRead(alertId: string) {
    const { data } = await api.patch<Alert>(`/alerts/${alertId}/read`);
    return data;
  },
};

