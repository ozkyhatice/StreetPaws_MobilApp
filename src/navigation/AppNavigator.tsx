import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MapPin, User, Map, Heart, Users } from 'lucide-react-native';
import { MainTabParamList } from '../types/navigation';
import { colors, borderRadius, shadows, spacing } from '../config/theme';
import { Platform } from 'react-native';

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

type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  MainApp: undefined;
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
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
    tabBarPosition = "bottom"
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
          tabBarLabel: 'Gönüllüler',
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

const AppNavigator: React.FC<{initialRouteName?: keyof RootStackParamList}> = ({ initialRouteName = "Splash" }) => {
  return (
    // @ts-ignore
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerLeftContainerStyle: {
          paddingLeft: 8,
        },
        cardStyle: {
          backgroundColor: colors.background,
        },
        gestureEnabled: true,
        gestureDirection: "horizontal",
        animation: "slide_from_right",
        presentation: "card"
      }}
    >
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
        name="AuthTest"
        component={AuthTestScreen}
        options={{ title: 'Firebase Auth Test' }}
      />
      <Stack.Screen
        name="MainApp"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Tasks" component={TasksScreen} />
      <Stack.Screen 
        name="TaskDetail" 
        component={TaskDetailScreen}
        options={{ title: 'Görev Detayı' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen 
        name="AddEmergency" 
        component={AddEmergencyScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Map" 
        component={MapScreen}
        options={{ title: 'Haritada Gör' }}
      />
      <Stack.Screen 
        name="Volunteers" 
        component={VolunteersScreen}
        options={{ title: 'Gönüllüler' }}
      />
      <Stack.Screen 
        name="Donations" 
        component={DonationsScreen}
        options={{ title: 'Bağış Yap' }}
      />
      <Stack.Screen 
        name="Donate" 
        component={DonateScreen}
        options={{ title: 'Bağış Bilgileri' }}
      />
      <Stack.Screen 
              name="ChangePassword" 
              component={ChangePasswordScreen}
              options={{ title: 'Şifre Değiştir' }}
            />
            <Stack.Screen 
              name="NotificationSettings" 
              component={NotificationSettingsScreen}
              options={{ title: 'Bildirim Tercihleri' }}
            />
            <Stack.Screen 
              name="ThemeSettings" 
              component={ThemeSettingsScreen}
              options={{ title: 'Tema Ayarları' }}
            />
    </Stack.Navigator>
  );
};

export default AppNavigator; 