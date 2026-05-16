import { api } from '../apiClient';
import type { Connection, PatientLite } from './types';

export const connectionsService = {
  async sendRequest(supervisorCode: string) {
    const { data } = await api.post<Connection>('/connections/request', { supervisorCode });
    return data;
  },

  async pendingForSupervisor() {
    // backend populates userId with {name,email}
    const { data } = await api.get<Array<Connection & { userId: PatientLite }>>('/connections/pending');
    return data;
  },

  async accept(connectionId: string) {
    const { data } = await api.patch<Connection>(`/connections/${connectionId}/accept`);
    return data;
  },

  async reject(connectionId: string) {
    const { data } = await api.patch<Connection>(`/connections/${connectionId}/reject`);
    return data;
  },

  async myUsers() {
    const { data } = await api.get<PatientLite[]>('/connections/my-users');
    return data;
  },
};

