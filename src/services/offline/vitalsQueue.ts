import { getJson, setJson } from '../storage';
import type { ActivityState, RiskLevel } from '../backend/types';

const QUEUE_KEY = 'vitalsync.vitals.queue.v1';

export type QueuedVital = {
  id: string;
  heartRate: number;
  temperature: number;
  spo2: number;
  activityState: ActivityState;
  timestamp: string;
  /** Optional local estimate so Smart-Sync can prioritize before server analysis */
  riskLevel?: RiskLevel;
};

function estimateLocalRisk(point: Omit<QueuedVital, 'id' | 'riskLevel'>): RiskLevel {
  if (point.spo2 < 91 || point.temperature > 39.8) return 'CRITICAL';
  if (point.activityState === 'STATIC' && point.heartRate > 100) return 'WARNING';
  if (point.activityState === 'RUNNING' && point.heartRate > 160) return 'CRITICAL';
  if (point.heartRate > 100) return 'WARNING';
  return 'SAFE';
}

function priority(level?: RiskLevel) {
  if (level === 'CRITICAL') return 0;
  if (level === 'WARNING') return 1;
  return 2;
}

async function readQueue(): Promise<QueuedVital[]> {
  return (await getJson<QueuedVital[]>(QUEUE_KEY)) ?? [];
}

async function writeQueue(items: QueuedVital[]) {
  await setJson(QUEUE_KEY, items);
}

export const vitalsQueue = {
  async count() {
    return (await readQueue()).length;
  },

  async enqueue(
    point: Omit<QueuedVital, 'id' | 'riskLevel' | 'timestamp'> & {
      timestamp?: string;
    },
  ) {
    const entry: QueuedVital = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      heartRate: point.heartRate,
      temperature: point.temperature,
      spo2: point.spo2,
      activityState: point.activityState,
      timestamp: point.timestamp ?? new Date().toISOString(),
    };
    entry.riskLevel = estimateLocalRisk(entry);

    const queue = await readQueue();
    queue.push(entry);
    // Keep newest prioritized for next flush
    queue.sort((a, b) => priority(a.riskLevel) - priority(b.riskLevel));
    await writeQueue(queue);
    return entry;
  },

  async peekAll() {
    const queue = await readQueue();
    return [...queue].sort(
      (a, b) => priority(a.riskLevel) - priority(b.riskLevel),
    );
  },

  async clear() {
    await writeQueue([]);
  },

  async replace(items: QueuedVital[]) {
    await writeQueue(items);
  },
};
