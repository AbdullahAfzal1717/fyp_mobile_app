import { jwtDecode } from 'jwt-decode';

import { api } from '../apiClient';
import type { AuthUser, Role } from '../../state/auth/types';

type JwtPayload = { id: string; role: Role; iat: number; exp: number };

type LoginResponse = {
  token: string;
  userData: { role: Role; name: string; supervisorCode?: string | null };
};

type SignupResponse = {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    supervisorCode?: string | null;
  };
};

export const authService = {
  async login(params: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: AuthUser }> {
    const { data } = await api.post<LoginResponse>('/auth/login', params);
    console.log(data.token);
    const decoded = jwtDecode<JwtPayload>(data.token);
    console.log(decoded);

    // backend login does not include email/id except in token; fetch /auth/me for complete profile.
    const me = await this.me(data.token);

    return {
      token: data.token,
      user: {
        id: decoded.id,
        role: decoded.role,
        name: me.name ?? data.userData.name,
        email: me.email ?? params.email.trim().toLowerCase(),
        supervisorCode:
          me.supervisorCode ?? data.userData.supervisorCode ?? null,
      },
    };
  },

  async signup(params: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }): Promise<{ token: string; user: AuthUser }> {
    const { data } = await api.post<SignupResponse>('/auth/signup', params);
    // signup endpoint does not return token in backend; do immediate login to obtain token.
    const logged = await this.login({
      email: params.email,
      password: params.password,
    });
    return {
      token: logged.token,
      user: {
        ...logged.user,
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        supervisorCode:
          data.user.supervisorCode ?? logged.user.supervisorCode ?? null,
      },
    };
  },

  async me(tokenOverride?: string) {
    const headers = tokenOverride
      ? { Authorization: `Bearer ${tokenOverride}` }
      : undefined;
    const { data } = await api.get<AuthUser & { password?: never }>(
      '/auth/me',
      { headers },
    );
    return data;
  },

  async updateProfile(updates: Partial<Pick<AuthUser, 'name' | 'email'>>) {
    const { data } = await api.patch<AuthUser>('/users/profile', updates);
    return data;
  },

  async getSupervisorCode() {
    const { data } = await api.get<{ supervisorCode: string }>(
      '/users/supervisor-code',
    );
    return data.supervisorCode;
  },
};
