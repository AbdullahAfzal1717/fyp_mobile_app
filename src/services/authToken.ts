import { getJson, remove, setJson } from './storage';

const tokenKey = 'vitalsync.auth.token.v1';

export async function getAuthToken() {
  const data = await getJson<{ token: string }>(tokenKey);
  return data?.token ?? null;
}

export async function setAuthToken(token: string) {
  await setJson(tokenKey, { token });
}

export async function clearAuthToken() {
  await remove(tokenKey);
}
