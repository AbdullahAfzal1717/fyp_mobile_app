import Constants from 'expo-constants';

type Extra = {
  googleWebClientId?: string;
  apiBaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

/**
 * Google OAuth Web Client ID (same as backend GOOGLE_CLIENT_ID).
 * Used by expo-auth-session to get an id_token that the backend verifies.
 */
export const GOOGLE_WEB_CLIENT_ID =
  extra.googleWebClientId ??
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  '146798997938-ef4dk83lk4rn6qm24lvs1i61cmu6b50e.apps.googleusercontent.com';
