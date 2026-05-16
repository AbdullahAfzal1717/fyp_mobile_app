export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  UserApp: undefined;
  SupervisorApp: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
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

