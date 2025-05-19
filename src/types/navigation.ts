export type MainTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Profile: undefined;
  Map: undefined;
  Volunteers: undefined;
  Rankings: undefined;
  Donations: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  MainApp: { screen?: keyof MainTabParamList };
  Tasks: undefined;
  TaskDetail: { taskId: string; action?: string };
  Settings: undefined;
  AddEmergency: undefined;
  Map: undefined;
  Volunteers: undefined;
  Rankings: undefined;
  Donations: undefined;
  Donate: { campaignId: string };
  ChangePassword: undefined;
  NotificationSettings: undefined;
  ThemeSettings: undefined;
  AuthTest: undefined;
  Profile: undefined;
  VerifyEmail: undefined;
  Verifications: undefined;
  EmergencyHelp: undefined;
  Achievements: undefined;
  DevTools: undefined;
  CompletedTasks: undefined;
  TaskProgress: undefined;
  Notifications: undefined;
  
  // New community screens
  Communities: undefined;
  CommunityDetail: { communityId: string };
  CreateCommunity: undefined;
  CommunityMembers: { communityId: string };
  CommunityChat: { communityId: string };
  JoinByInvite: { inviteCode?: string };

  // New messaging screens
  Messages: undefined;
  Chat: { conversationId: string; recipientId: string; recipientName: string; isCommunityChat?: boolean };
  UserProfile: { userId: string };
}; 