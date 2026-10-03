// src/services/backend/authService.ts
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
  // ─────────────────────────────────────────────────────────────
  // EXISTING: Email / Password Login
  // ─────────────────────────────────────────────────────────────
  async login(params: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: AuthUser }> {
    const { data } = await api.post<LoginResponse>('/auth/login', params);
    const decoded = jwtDecode<JwtPayload>(data.token);
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
        avatarUrl: me.avatarUrl ?? null, // NEW: profile image
      },
    };
  },

  // ─────────────────────────────────────────────────────────────
  // EXISTING: Email / Password Signup
  // ─────────────────────────────────────────────────────────────
  async signup(params: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }): Promise<{ message: string }> {
    // CHANGED: signup now just creates the account and sends verification email.
    // It no longer auto-logs in. The app navigates to EmailVerificationScreen instead.
    const { data } = await api.post<{ message: string }>(
      '/auth/signup',
      params,
    );
    return data;
  },

  // ─────────────────────────────────────────────────────────────
  // NEW: Email OTP Verification (after signup)
  // ─────────────────────────────────────────────────────────────
  /**
   * POST /auth/verify-email
   * Body: { email, otp }
   * Backend verifies OTP, marks account as verified, returns token + user
   */
  async verifyEmail(params: {
    email: string;
    otp: string;
  }): Promise<{ token: string; user: AuthUser }> {
    const { data } = await api.post<LoginResponse & { user?: AuthUser }>(
      '/auth/verify-email',
      params,
    );
    // After verification, backend should return token so user is immediately logged in
    const decoded = jwtDecode<JwtPayload>(data.token);
    const me = await this.me(data.token);
    return {
      token: data.token,
      user: {
        id: decoded.id,
        role: decoded.role,
        name: me.name,
        email: me.email,
        supervisorCode: me.supervisorCode ?? null,
        avatarUrl: me.avatarUrl ?? null,
      },
    };
  },

  // ─────────────────────────────────────────────────────────────
  // NEW: Resend Verification OTP
  // ─────────────────────────────────────────────────────────────
  async resendVerificationOtp(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      '/auth/resend-verification',
      { email },
    );
    return data;
  },

  // ─────────────────────────────────────────────────────────────
  // NEW: Forgot Password — sends OTP to email
  // ─────────────────────────────────────────────────────────────
  /**
   * POST /auth/forgot-password
   * Body: { email }
   * Backend sends a password-reset OTP to the email
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      '/auth/forgot-password',
      { email },
    );
    return data;
  },

  // ─────────────────────────────────────────────────────────────
  // NEW: Reset Password — verify OTP + set new password
  // ─────────────────────────────────────────────────────────────
  /**
   * POST /auth/reset-password
   * Body: { email, otp, newPassword }
   * Backend verifies OTP, resets password
   */
  async resetPassword(params: {
    email: string;
    otp: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      '/auth/reset-password',
      params,
    );
    return data;
  },

  // ─────────────────────────────────────────────────────────────
  // NEW: Google OAuth Sign-In
  // ─────────────────────────────────────────────────────────────
  /**
   * POST /auth/google
   * Body: { idToken } — the token from Google Sign-In SDK
   * Backend verifies with Google, creates/finds user, returns your app's JWT
   *
   * FRONTEND SETUP:
   * 1. Install: npx expo install @react-native-google-signin/google-signin
   * 2. Configure in app.json (see README)
   * 3. Call GoogleSignin.signIn() to get idToken
   * 4. Pass idToken to this function
   */
  async googleSignIn(
    idToken: string,
  ): Promise<{ token: string; user: AuthUser }> {
    const { data } = await api.post<LoginResponse>('/auth/google', { idToken });
    const decoded = jwtDecode<JwtPayload>(data.token);
    const me = await this.me(data.token);
    return {
      token: data.token,
      user: {
        id: decoded.id,
        role: decoded.role,
        name: me.name,
        email: me.email,
        supervisorCode: me.supervisorCode ?? null,
        avatarUrl: me.avatarUrl ?? null,
      },
    };
  },

  // ─────────────────────────────────────────────────────────────
  // EXISTING: Get current user profile
  // ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  // EXISTING: Update profile name/email
  // ─────────────────────────────────────────────────────────────
  async updateProfile(updates: Partial<Pick<AuthUser, 'name' | 'email'>>) {
    const { data } = await api.patch<AuthUser>('/users/profile', updates);
    return data;
  },

  // ─────────────────────────────────────────────────────────────
  // NEW: Upload profile avatar image
  // ─────────────────────────────────────────────────────────────
  /**
   * PATCH /users/avatar
   * Body: FormData with field "avatar" containing the image file
   * Backend stores image (Cloudinary/S3), returns { avatarUrl }
   *
   * HOW TO USE:
   *   const result = await ImagePicker.launchImageLibraryAsync({ ... });
   *   if (!result.canceled) {
   *     await authService.uploadAvatar(result.assets[0].uri);
   *   }
   */
  async uploadAvatar(localUri: string): Promise<{ avatarUrl: string }> {
    // Build FormData — this is how you send files to a backend
    const formData = new FormData();
    formData.append('avatar', {
      uri: localUri,
      type: 'image/jpeg', // or detect from file extension
      name: 'avatar.jpg',
    } as any); // React Native's FormData doesn't perfectly match browser FormData types

    const { data } = await api.patch<{ avatarUrl: string }>(
      '/users/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data', // override JSON default for file upload
        },
      },
    );
    return data;
  },

  // ─────────────────────────────────────────────────────────────
  // EXISTING: Get supervisor code
  // ─────────────────────────────────────────────────────────────
  async getSupervisorCode() {
    const { data } = await api.get<{ supervisorCode: string }>(
      '/users/supervisor-code',
    );
    return data.supervisorCode;
  },
};
