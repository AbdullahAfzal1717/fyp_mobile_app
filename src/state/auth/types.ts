// src/state/auth/types.ts

export type Role = 'USER' | 'SUPERVISOR';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  supervisorCode?: string | null;
  avatarUrl?: string | null; // NEW: profile picture URL from backend/Cloudinary
};

export type AuthState =
  | { status: 'booting'; user: null }
  | { status: 'signedOut'; user: null }
  | { status: 'signedIn'; user: AuthUser };
