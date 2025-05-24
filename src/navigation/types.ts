import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  TaskDetail: { taskId: string; action?: string };
  Map: undefined;
  Donate: { campaignId: string };
  UserProfile: { userId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 