import { api } from '../apiClient';
import type { ActivityState, RiskLevel } from './types';

export const aiService = {
  async analyze(params: { heartRate: number; temperature: number; spo2: number; activityState: ActivityState }) {
    const { data } = await api.post<{ riskLevel: RiskLevel; riskScore: number; baseline: unknown }>('/ai/analyze', params);
    return data;
  },
  async riskScore(userId: string) {
    const { data } = await api.get<{ userId: string; riskLevel: RiskLevel; riskScore: number; timestamp: string }>(
      `/ai/risk-score/${userId}`,
    );
    return data;
  },
  async baseline(userId: string) {
    const { data } = await api.get<{ userId: string; baseline: { avgHeartRate: number; avgTemp: number } }>(`/ai/baseline/${userId}`);
    return data;
  },
};

