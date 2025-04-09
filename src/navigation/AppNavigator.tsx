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

type RootStackParamList = {
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
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
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
          left: 0,
          right: 0,
          bottom: 0,
          ...Platform.select({
            ios: {
              shadowColor: 'rgba(0,0,0,0.2)',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
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
          marginTop: -5,
        },
        tabBarIconStyle: {
          marginTop: 0,
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
          tabBarIcon: ({ color, size }) => <Home color={color} size={size-4} />,
          title: 'Ana Sayfa',
          tabBarLabel: 'Ana Sayfa',
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MapPin color={color} size={size-4} />,
          title: 'Görevler',
          tabBarLabel: 'Görevler',
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Map color={color} size={size-4} />,
          title: 'Harita',
          tabBarLabel: 'Harita',
        }}
      />
      <Tab.Screen
        name="Volunteers"
        component={VolunteersScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Users color={color} size={size-4} />,
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

const AppNavigator: React.FC = () => {
  return (
    // @ts-ignore
    <Stack.Navigator
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
        headerBackTitleVisible: false,
        headerLeftContainerStyle: {
          paddingLeft: 8,
        },
        cardStyle: {
          backgroundColor: colors.background,
        },
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: ({ current, layouts, next }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
                {
                  scale: next
                    ? next.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0.95],
                      })
                    : 1,
                },
              ],
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          };
        },
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
        },
      }}
    >
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
    </Stack.Navigator>
  );
};

export default AppNavigator; 