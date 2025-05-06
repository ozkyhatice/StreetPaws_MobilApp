export type MainTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Profile: undefined;
  Map: undefined;
  Volunteers: undefined;
  Donations: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  MainApp: { screen?: keyof MainTabParamList };
  Tasks: undefined;
  TaskDetail: { taskId: string };
  Settings: undefined;
  AddEmergency: undefined;
  Map: undefined;
  Volunteers: undefined;
  Donations: undefined;
  Donate: { campaignId: string };
  ChangePassword: undefined;
  NotificationSettings: undefined;
  ThemeSettings: undefined;
  AuthTest: undefined;
  Profile: undefined;
  VerifyEmail: undefined;
}; 