import { api } from '../apiClient';
import type { Vital } from './types';

export type Report = {
  generatedAt: string;
  user: { name: string; email: string } | null;
  summary: {
    totalPoints: number;
    avgHeartRate: number;
    avgSpO2: number;
    avgTemperature: number;
  };
  vitals: Vital[];
};

export const reportsService = {
  async generate(userId: string) {
    const { data } = await api.get<Report>(`/reports/${userId}/generate`);
    return data;
  },
};

