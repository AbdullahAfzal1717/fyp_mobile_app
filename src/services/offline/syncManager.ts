import { api } from '../apiClient';
import { vitalsQueue } from './vitalsQueue';

let flushing = false;

/**
 * Flush locally buffered vitals to POST /vitals/sync.
 * Uses api directly (not vitalsService) to avoid a require cycle.
 */
export async function flushVitalsQueue(): Promise<{
  synced: number;
  remaining: number;
}> {
  if (flushing) {
    return { synced: 0, remaining: await vitalsQueue.count() };
  }

  flushing = true;
  try {
    const pending = await vitalsQueue.peekAll();
    if (!pending.length) {
      return { synced: 0, remaining: 0 };
    }

    await api.post('/vitals/sync', {
      dataPoints: pending.map((p) => ({
        heartRate: p.heartRate,
        temperature: p.temperature,
        spo2: p.spo2,
        activityState: p.activityState,
        timestamp: p.timestamp,
        riskLevel: p.riskLevel,
      })),
    });

    await vitalsQueue.clear();
    return { synced: pending.length, remaining: 0 };
  } catch {
    return { synced: 0, remaining: await vitalsQueue.count() };
  } finally {
    flushing = false;
  }
}
