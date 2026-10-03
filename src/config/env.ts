import Constants from 'expo-constants';

type Extra = {
  apiBaseUrl?: string;
  socketUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

/**
 * Configure from:
 * - app.json -> expo.extra.apiBaseUrl / socketUrl
 * - or environment vars EXPO_PUBLIC_API_BASE_URL / EXPO_PUBLIC_SOCKET_URL
 *
 * On a real device, use your PC LAN IP (not localhost), e.g.
 * http://192.168.1.20:5000
 */
export const env = {
  apiBaseUrl:
    extra.apiBaseUrl ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    'http://localhost:5000',
  socketUrl:
    extra.socketUrl ??
    process.env.EXPO_PUBLIC_SOCKET_URL ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    'http://localhost:5000',
};
