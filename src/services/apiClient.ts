import axios from 'axios';

import { env } from '../config/env';
import { getAuthToken } from './authToken';

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers = {
      ...(config.headers ?? {}),
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg =
      (err.response?.data as { message?: string } | undefined)?.message ??
      err.message ??
      'Request failed';
    return msg;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

