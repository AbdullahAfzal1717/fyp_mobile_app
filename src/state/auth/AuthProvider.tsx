// src/state/auth/AuthProvider.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { authService } from '../../services/backend/authService';
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
} from '../../services/authToken';
import { getJson, setJson, remove, storageKeys } from '../../services/storage';
import {
  connectSocket,
  disconnectSocket,
} from '../../services/realtime/socket';
import type { AuthState, AuthUser, Role } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type AuthContextValue = {
  state: AuthState;
  // Existing
  login: (params: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (
    updates: Partial<Pick<AuthUser, 'name' | 'email'>>,
  ) => Promise<void>;

  // UPDATED: signup no longer auto-logs in — it returns email for verification screen
  signup: (params: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) => Promise<{ email: string }>;

  // NEW: verify OTP sent to email after signup
  verifyEmail: (params: { email: string; otp: string }) => Promise<void>;

  // NEW: resend the OTP (user didn't get the email)
  resendVerificationOtp: (email: string) => Promise<void>;

  // NEW: step 1 of forgot password — send OTP to email
  forgotPassword: (email: string) => Promise<void>;

  // NEW: step 2 — verify OTP + set new password
  resetPassword: (params: {
    email: string;
    otp: string;
    newPassword: string;
  }) => Promise<void>;

  // NEW: sign in with Google
  googleSignIn: (idToken: string) => Promise<void>;

  // NEW: upload profile picture
  uploadAvatar: (localUri: string) => Promise<void>;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'booting',
    user: null,
  });

  // ── On app boot: check if user was already logged in ──────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await getJson<{ user: AuthUser }>(storageKeys.auth);
      const token = await getAuthToken();

      if (!alive) return;

      if (saved?.user && token) {
        // Both exist — auto login
        connectSocket(token);
        setState({ status: 'signedIn', user: saved.user });
      } else {
        // Inconsistent or no data — go to login
        await clearAuthToken();
        await remove(storageKeys.auth);
        setState({ status: 'signedOut', user: null });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ── Helper: save user to AsyncStorage ────────────────────────────────────
  const persist = useCallback(async (user: AuthUser | null) => {
    if (user) await setJson(storageKeys.auth, { user });
    else await remove(storageKeys.auth);
  }, []);

  // ── Helper: finalize login after getting token + user ────────────────────
  // This is shared between login, verifyEmail, and googleSignIn so we don't repeat ourselves
  const finalizeLogin = useCallback(
    async (token: string, user: AuthUser) => {
      await setAuthToken(token);
      connectSocket(token);
      setState({ status: 'signedIn', user });
      await persist(user);
    },
    [persist],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // EXISTING: Email + Password Login
  // ─────────────────────────────────────────────────────────────────────────
  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      const { token, user } = await authService.login({ email, password });
      await finalizeLogin(token, user);
    },
    [finalizeLogin],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // UPDATED: Signup — now just creates account + triggers email OTP
  // No longer logs the user in directly.
  // Returns { email } so the calling screen can navigate to EmailVerificationScreen.
  // ─────────────────────────────────────────────────────────────────────────
  const signup = useCallback(
    async ({
      name,
      email,
      password,
      role,
    }: {
      name: string;
      email: string;
      password: string;
      role: Role;
    }): Promise<{ email: string }> => {
      await authService.signup({ name, email, password, role });
      // Backend sends verification email. We return email so the screen
      // can pass it as a param to EmailVerificationScreen.
      return { email };
    },
    [],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // NEW: Verify Email OTP
  // Called from EmailVerificationScreen after user enters the code.
  // On success, logs the user in (same as normal login).
  // ─────────────────────────────────────────────────────────────────────────
  const verifyEmail = useCallback(
    async ({ email, otp }: { email: string; otp: string }) => {
      const { token, user } = await authService.verifyEmail({ email, otp });
      await finalizeLogin(token, user);
    },
    [finalizeLogin],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // NEW: Resend OTP
  // ─────────────────────────────────────────────────────────────────────────
  const resendVerificationOtp = useCallback(async (email: string) => {
    await authService.resendVerificationOtp(email);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // NEW: Forgot Password — Step 1
  // Just sends an OTP to the email. No state change needed.
  // ─────────────────────────────────────────────────────────────────────────
  const forgotPassword = useCallback(async (email: string) => {
    await authService.forgotPassword(email);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // NEW: Reset Password — Step 2
  // Verifies OTP + sets new password. On success, navigates to Login (done in screen).
  // ─────────────────────────────────────────────────────────────────────────
  const resetPassword = useCallback(
    async ({
      email,
      otp,
      newPassword,
    }: {
      email: string;
      otp: string;
      newPassword: string;
    }) => {
      await authService.resetPassword({ email, otp, newPassword });
      // We do NOT log in after reset — user must log in manually with new password
    },
    [],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // NEW: Google Sign-In
  // Receives the Google idToken from the Google Sign-In SDK (called in the screen).
  // Sends it to YOUR backend which verifies it and returns your app's JWT.
  // ─────────────────────────────────────────────────────────────────────────
  const googleSignIn = useCallback(
    async (idToken: string) => {
      const { token, user } = await authService.googleSignIn(idToken);
      await finalizeLogin(token, user);
    },
    [finalizeLogin],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // EXISTING: Logout
  // ─────────────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setState({ status: 'signedOut', user: null });
    await persist(null);
    await clearAuthToken();
    disconnectSocket();
  }, [persist]);

  // ─────────────────────────────────────────────────────────────────────────
  // EXISTING: Update profile text fields (name, email)
  // ─────────────────────────────────────────────────────────────────────────
  const updateProfile = useCallback(
    async (updates: Partial<Pick<AuthUser, 'name' | 'email'>>) => {
      if (!state.user) return;
      const updated = await authService.updateProfile(updates);
      const next = { ...state.user, ...updated };
      setState({ status: 'signedIn', user: next });
      await persist(next);
    },
    [persist, state.user],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // NEW: Upload Avatar
  // Picks image → uploads to backend → backend returns URL → update state + storage
  // ─────────────────────────────────────────────────────────────────────────
  const uploadAvatar = useCallback(
    async (localUri: string) => {
      if (!state.user) return;
      const { avatarUrl } = await authService.uploadAvatar(localUri);
      const next = { ...state.user, avatarUrl };
      setState({ status: 'signedIn', user: next });
      await persist(next);
    },
    [persist, state.user],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────────────────────────────────────────────────
  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      login,
      signup,
      verifyEmail,
      resendVerificationOtp,
      forgotPassword,
      resetPassword,
      googleSignIn,
      logout,
      updateProfile,
      uploadAvatar,
    }),
    [
      state,
      login,
      signup,
      verifyEmail,
      resendVerificationOtp,
      forgotPassword,
      resetPassword,
      googleSignIn,
      logout,
      updateProfile,
      uploadAvatar,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
