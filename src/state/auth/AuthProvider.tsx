import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getJson, remove, setJson, storageKeys } from '../../services/storage';
import { authService } from '../../services/backend/authService';
import { clearAuthToken, getAuthToken, setAuthToken } from '../../services/authToken';
import { connectSocket, disconnectSocket } from '../../services/realtime/socket';
import type { AuthState, AuthUser, Role } from './types';

type AuthContextValue = {
  state: AuthState;
  login: (params: { email: string; password: string }) => Promise<void>;
  signup: (params: { name: string; email: string; password: string; role: Role }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<AuthUser, 'name' | 'email'>>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'booting', user: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await getJson<{ user: AuthUser }>(storageKeys.auth);
      const token = await getAuthToken();
      if (!alive) return;
      if (saved?.user && token) {
        connectSocket(token);
        setState({ status: 'signedIn', user: saved.user });
      } else if (saved?.user && !token) {
        await clearAuthToken();
        setState({ status: 'signedOut', user: null });
        await remove(storageKeys.auth);
      } else {
        setState({ status: 'signedOut', user: null });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback(async (user: AuthUser | null) => {
    if (user) await setJson(storageKeys.auth, { user });
    else await remove(storageKeys.auth);
  }, []);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      const { token, user } = await authService.login({ email, password });
      await setAuthToken(token);
      connectSocket(token);
      setState({ status: 'signedIn', user });
      await persist(user);
    },
    [persist],
  );

  const signup = useCallback(
    async ({ name, email, password, role }: { name: string; email: string; password: string; role: Role }) => {
      const { token, user } = await authService.signup({ name, email, password, role });
      await setAuthToken(token);
      connectSocket(token);
      setState({ status: 'signedIn', user });
      await persist(user);
    },
    [persist],
  );

  const logout = useCallback(async () => {
    setState({ status: 'signedOut', user: null });
    await persist(null);
    await clearAuthToken();
    disconnectSocket();
  }, [persist]);

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

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      login,
      signup,
      logout,
      updateProfile,
    }),
    [login, logout, signup, state, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

