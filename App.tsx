import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import ProfileScreen from './src/screens/ProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import ThemeSettingsScreen from './src/screens/ThemeSettingsScreen';

const Stack = createNativeStackNavigator();

// Import your screens here
// Example:
// import HomeScreen from './src/screens/HomeScreen';
// import TasksScreen from './src/screens/TasksScreen';
// import ProfileScreen from './src/screens/ProfileScreen';

function NavigationWrapper() {
  const { paperTheme, navigationTheme } = useTheme();

  return (
    <NavigationContainer theme={navigationTheme}>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <Stack.Navigator>
            <Stack.Screen 
              name="AppNavigator" 
              component={AppNavigator}
              options={{ headerShown: false }}
            />
            
          </Stack.Navigator>
        </AuthProvider>
      </PaperProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationWrapper />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
