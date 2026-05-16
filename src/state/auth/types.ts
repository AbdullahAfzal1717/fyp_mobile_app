export type Role = 'USER' | 'SUPERVISOR';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  supervisorCode?: string | null;
};

export type AuthState = {
  status: 'booting' | 'signedOut' | 'signedIn';
  user: AuthUser | null;
};

