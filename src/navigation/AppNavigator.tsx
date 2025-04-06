import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MapPin, User, Map, Heart, Users } from 'lucide-react-native';
import { MainTabParamList } from '../types/navigation';

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
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          height: 60, // Daha büyük
          paddingBottom: 10, // Alt boşluk
          paddingTop: 5, // Üst boşluk
        },
        tabBarLabelStyle: {
          fontSize: 12, // Label boyutu
        }
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          title: 'Ana Sayfa',
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
          title: 'Görevler',
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
          title: 'Harita',
        }}
      />
      <Tab.Screen
        name="Volunteers"
        component={VolunteersScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          title: 'Gönüllüler',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          title: 'Profil',
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
          backgroundColor: '#FF6B6B',
        },
        headerTintColor: '#fff',
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
      <Stack.Screen name="AddEmergency" component={AddEmergencyScreen} />
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