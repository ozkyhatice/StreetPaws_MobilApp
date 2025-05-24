import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MapPin, User, Map, Heart, Users, Trophy } from 'lucide-react-native';
import { MainTabParamList, RootStackParamList } from '../types/navigation';
import { colors, borderRadius, shadows, spacing } from '../config/theme';
import { Platform } from 'react-native';
import { AuthGuard } from '../components/AuthGuard';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { Text } from 'react-native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import TasksScreen from '../screens/TasksScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddEmergencyScreen from '../screens/AddEmergencyScreen';
import MapScreen from '../screens/MapScreen';
import VolunteersScreen from '../screens/VolunteersScreen';
import DonationsScreen from '../screens/DonationsScreen';
import DonateScreen from '../screens/DonateScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import ThemeSettingsScreen from '../screens/ThemeSettingsScreen';
import AuthTestScreen from '../screens/AuthTestScreen';
import SplashScreen from '../screens/SplashScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import VerificationsScreen from '../screens/VerificationsScreen';
import EmergencyHelpScreen from '../screens/EmergencyHelpScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import DevToolsScreen from '../screens/DevToolsScreen';
import TaskProgressScreen from '../screens/TaskProgressScreen';
import CompletedTasksScreen from '../screens/CompletedTasksScreen';
import CreateCommunityScreen from '../screens/CreateCommunityScreen';
import ChatScreen from '../screens/ChatScreen';
import CommunityDetailScreen from '../screens/CommunityDetailScreen';
import CommunityMembersScreen from '../screens/CommunityMembersScreen';
import JoinByInviteScreen from '../screens/JoinByInviteScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import RankingsScreen from '../screens/RankingsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
        tabBarStyle: {
          height: 50,
          paddingBottom: 5,
          paddingTop: 5,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          position: 'absolute',
          left: 5,
          right: 5,
          bottom: 20,
          ...Platform.select({
            ios: {
              shadowColor: 'rgba(0,0,0,0.08)',
              shadowOffset: { width: 2, height: -2 },
              shadowOpacity: 0.6,
              shadowRadius: 0,
            },
            android: {
              elevation: 4,
              height: 54,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          paddingBottom: 0,
          marginTop: 0.6,
        },
        
        tabBarAllowFontScaling: false,
        tabBarLabelPosition: 'below-icon',
      }}
      sceneContainerStyle={{ 
        marginBottom: 50,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          title: 'Ana Sayfa',
          tabBarLabel: 'Ana Sayfa',
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
          title: 'Görevler',
          tabBarLabel: 'Görevler',
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
          title: 'Harita',
          tabBarLabel: 'Harita',
        }}
      />
      <Tab.Screen
        name="Volunteers"
        component={VolunteersScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          title: 'Gönüllüler',
          tabBarLabel: 'Topluluk',
        }}
      />
      <Tab.Screen
        name="Rankings"
        component={RankingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
          title: 'Sıralama',
          tabBarLabel: 'Sıralama',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size-4} />,
          title: 'Profil',
          tabBarLabel: 'Profil',
        }}
      />
    </Tab.Navigator>
  );
}

// Korumalı TabNavigator bileşeni
const ProtectedTabNavigator = () => (
  <AuthGuard>
    <TabNavigator />
  </AuthGuard>
);

interface TaskDetailScreenProps {
  taskId: string;
}

interface DonateScreenProps {
  campaignId: string;
}

const AppNavigator: React.FC<{initialRouteName?: keyof RootStackParamList}> = ({ initialRouteName = "Splash" }) => {
  const navigation = useNavigation();
  
  return (
    <Stack.Navigator
      id={undefined}
      initialRouteName={initialRouteName}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#000000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        animation: 'slide_from_right',
      }}
    >
      {/* Kimlik doğrulama gerektirmeyen ekranlar */}
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
        options={{ 
          headerShown: false,
          gestureEnabled: false
        }}
      />

      {/* Kimlik doğrulama gerektiren ekranlar */}
      <Stack.Screen
        name="MainApp"
        component={ProtectedTabNavigator}
        options={{ headerShown: false }}
      />
      
      {/* Korumalı sayfaları Screen.children yaklaşımıyla tanımlama */}
      <Stack.Screen 
        name="AuthTest"
        options={{ title: 'Firebase Auth Test' }}
      >
        {() => (
          <AuthGuard>
            <AuthTestScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="Tasks"
        options={{ title: 'Görevler' }}
      >
        {() => (
          <AuthGuard>
            <TasksScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="TaskProgress"
        options={{ title: 'Görev İlerlemen' }}
      >
        {() => (
          <AuthGuard>
            <TaskProgressScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="TaskDetail"
        options={{ headerShown: false }}
      >
        {({ route }) => {
          console.log("AppNavigator - TaskDetail route params:", route.params);
          const taskId = route.params?.taskId?.toString() || '';
          console.log("AppNavigator - Parsed taskId:", taskId);
          
          return (
            <AuthGuard>
              <TaskDetailScreen taskId={taskId} />
            </AuthGuard>
          );
        }}
      </Stack.Screen>
      
      <Stack.Screen 
        name="Settings"
        options={{ title: 'Ayarlar' }}
      >
        {() => (
          <AuthGuard>
            <SettingsScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="AddEmergency"
        options={{ headerShown: false }}
      >
        {() => (
          <AuthGuard>
            <AddEmergencyScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="Map"
        options={{ title: 'Haritada Gör' }}
      >
        {() => (
          <AuthGuard>
            <MapScreen navigation={navigation} />
          </AuthGuard>
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="Volunteers"
        options={{ title: 'Gönüllüler' }}
      >
        {() => (
          <AuthGuard>
            <VolunteersScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="Donations"
        options={{ title: 'Bağış Yap' }}
      >
        {() => (
          <AuthGuard>
            <DonationsScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="Donate"
        options={{ title: 'Bağış Bilgileri' }}
      >
        {({ route }) => (
          <AuthGuard>
            <DonateScreen campaignId={route.params.campaignId} />
          </AuthGuard>
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="ChangePassword"
        options={{ title: 'Şifre Değiştir' }}
      >
        {() => (
          <AuthGuard>
            <ChangePasswordScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="NotificationSettings"
        options={{ title: 'Bildirim Tercihleri' }}
      >
        {() => (
          <AuthGuard>
            <NotificationSettingsScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="ThemeSettings"
        options={{ title: 'Tema Ayarları' }}
      >
        {() => (
          <AuthGuard>
            <ThemeSettingsScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="Verifications"
        options={{ title: 'Görev Onayları' }}
      >
        {() => (
          <AuthGuard>
            <VerificationsScreen />
          </AuthGuard>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="EmergencyHelp"
        component={EmergencyHelpScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="DevTools"
        component={DevToolsScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen 
        name="CompletedTasks"
        options={{ title: 'Tamamlanan Görevler' }}
      >
        {() => (
          <AuthGuard>
            <CompletedTasksScreen />
          </AuthGuard>
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="Notifications"
        options={{ headerShown: false }}
      >
        {() => (
          <AuthGuard>
            <NotificationsScreen />
          </AuthGuard>
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="CreateCommunity"
        options={{ headerShown: false }}
      >
        {() => (
          <AuthGuard>
            <CreateCommunityScreen />
          </AuthGuard>
        )}
      </Stack.Screen>

      <Stack.Screen 
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen 
        name="CommunityDetail"
        component={CommunityDetailScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen 
        name="CommunityMembers"
        component={CommunityMembersScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen 
        name="CommunityChat"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      
      <Stack.Screen 
        name="JoinByInvite"
        component={JoinByInviteScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen 
        name="UserProfile"
        options={{ headerShown: true, title: 'Kullanıcı Profili', headerBackTitle: '' }}
      >
        {({ route }) => (
          <AuthGuard>
            <UserProfileScreen />
          </AuthGuard>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default AppNavigator; 