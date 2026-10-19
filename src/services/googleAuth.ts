import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { GOOGLE_WEB_CLIENT_ID } from '../config/google';

// Required so auth redirects complete correctly in Expo Go / web
WebBrowser.maybeCompleteAuthSession();

/**
 * Hook wrapper for Google ID-token auth (works in Expo Go).
 * Returns promptAsync + the latest idToken when sign-in succeeds.
 */
export function useGoogleIdTokenAuth() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    // Same web client works for Expo Go proxy flow
    iosClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_WEB_CLIENT_ID,
  });

  const idToken =
    response?.type === 'success'
      ? response.params?.id_token ??
        (response as { authentication?: { idToken?: string } }).authentication
          ?.idToken ??
        null
      : null;

  return {
    ready: Boolean(request),
    response,
    idToken,
    promptAsync,
  };
}
