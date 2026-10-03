// src/navigation/types.ts
// Updated with all new screens for auth flows, profile image, etc.

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  UserApp: undefined;
  SupervisorApp: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  EmailVerification: { email: string }; // NEW: after signup, verify email
  ForgotPassword: undefined; // NEW: forgot password entry
  ResetPassword: { email: string }; // NEW: enter OTP + new password
};

export type UserTabParamList = {
  UserHome: undefined;
  UserHistory: undefined;
  UserSupervisor: undefined;
  UserNotifications: undefined;
  UserProfile: undefined;
};

export type UserStackParamList = {
  UserTabs: undefined;
  WatchConnect: undefined;
  SendRequest: undefined;
};

export type SupervisorTabParamList = {
  SupervisorOverview: undefined;
  SupervisorAlerts: undefined;
  SupervisorRequests: undefined;
  SupervisorProfile: undefined;
};

export type SupervisorStackParamList = {
  SupervisorTabs: undefined;
  UserDetail: { userId: string; patientName?: string };
};
