import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageKeys = {
  auth: 'commandx.auth.v1',
  alertsRead: 'commandx.alerts.read.v1',
};

export async function setJson(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function remove(key: string) {
  await AsyncStorage.removeItem(key);
}

