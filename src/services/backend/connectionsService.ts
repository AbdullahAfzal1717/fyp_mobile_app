// src/services/backend/connectionsService.ts
import { api } from '../apiClient';
import type { Connection, PatientLite } from './types';

// ── NEW: type for what "my supervisor" endpoint returns ──
export type MySupervisorResult = {
  connectionId: string;
  supervisorId: string;
  supervisorName: string;
  supervisorEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
} | null; // null = no connection exists at all

export const connectionsService = {
  // ─────────────────────────────────────────────────────────────
  // EXISTING: Send a connection request using supervisor code
  // ─────────────────────────────────────────────────────────────
  async sendRequest(supervisorCode: string) {
    const { data } = await api.post<Connection>('/connections/request', {
      supervisorCode,
    });
    return data;
  },

  // ─────────────────────────────────────────────────────────────
  // EXISTING: Get pending requests (supervisor side)
  // ─────────────────────────────────────────────────────────────
  async pendingForSupervisor() {
    const { data } = await api.get<Array<Connection & { userId: PatientLite }>>(
      '/connections/pending',
    );
    return data;
  },

  // ─────────────────────────────────────────────────────────────
  // EXISTING: Accept / Reject a connection
  // ─────────────────────────────────────────────────────────────
  async accept(connectionId: string) {
    const { data } = await api.patch<Connection>(
      `/connections/${connectionId}/accept`,
    );
    return data;
  },

  async reject(connectionId: string) {
    const { data } = await api.patch<Connection>(
      `/connections/${connectionId}/reject`,
    );
    return data;
  },

  // ─────────────────────────────────────────────────────────────
  // EXISTING: Get all accepted patients (supervisor side)
  // ─────────────────────────────────────────────────────────────
  async myUsers() {
    const { data } = await api.get<PatientLite[]>('/connections/my-users');
    return data;
  },

  // ─────────────────────────────────────────────────────────────
  // NEW: Get the supervisor this user is connected to (user side)
  // ─────────────────────────────────────────────────────────────
  /**
   * GET /connections/my-supervisor
   * Returns the supervisor the logged-in user sent a request to.
   * Returns null if no connection exists (user hasn't sent any request yet).
   *
   * Backend should:
   *   - Find Connection where userId = req.user.id
   *   - Populate supervisorId with { name, email }
   *   - Return { connectionId, supervisorId, supervisorName, supervisorEmail, status }
   *   - Return 404 or { data: null } if no connection found
   */
  async mySupervisor(): Promise<MySupervisorResult> {
    try {
      const { data } = await api.get<MySupervisorResult>(
        '/connections/my-supervisor',
      );
      return data;
    } catch {
      // 404 = no connection exists yet — not an error, just means not connected
      return null;
    }
  },

  // ─────────────────────────────────────────────────────────────
  // NEW: Cancel a pending connection request (user side)
  // ─────────────────────────────────────────────────────────────
  /**
   * DELETE /connections/:connectionId
   * Lets a user cancel a pending request before it's accepted.
   */
  async cancelRequest(connectionId: string) {
    const { data } = await api.delete<{ message: string }>(
      `/connections/${connectionId}`,
    );
    return data;
  },
};
