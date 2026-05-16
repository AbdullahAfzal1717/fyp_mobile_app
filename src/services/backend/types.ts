export type ActivityState = 'STATIC' | 'RUNNING' | 'UNCERTAIN';
export type RiskLevel = 'SAFE' | 'WARNING' | 'CRITICAL';

export type Vital = {
  _id: string;
  userId: string;
  heartRate?: number;
  temperature?: number;
  spo2?: number;
  activityState: ActivityState;
  riskScore: number;
  riskLevel: RiskLevel;
  batteryLevel?: number;
  latitude?: number;
  longitude?: number;
  timestamp: string;
  syncTimestamp?: string;
};

export type Alert = {
  _id: string;
  userId: string;
  supervisorId: string;
  riskLevel: 'WARNING' | 'CRITICAL';
  message: string;
  vitalsSnapshot?: {
    heartRate?: number;
    spo2?: number;
    temperature?: number;
    activityState?: ActivityState;
  };
  isRead: boolean;
  createdAt: string;
};

export type Connection = {
  _id: string;
  userId: string;
  supervisorId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
};

export type PatientLite = {
  _id: string;
  name: string;
  email: string;
};

