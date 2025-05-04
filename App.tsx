import React, { useState, useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, AuthContext } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'react-native';
import { AuthContextType } from './src/types/auth';

const Stack = createNativeStackNavigator();

// Import your screens here
// Example:
// import HomeScreen from './src/screens/HomeScreen';
// import TasksScreen from './src/screens/TasksScreen';
// import ProfileScreen from './src/screens/ProfileScreen';

function NavigationWrapper() {
  const { paperTheme, navigationTheme } = useTheme();
  const { loading } = useContext(AuthContext) as AuthContextType;

  return (
    <NavigationContainer theme={navigationTheme}>
      <PaperProvider theme={paperTheme}>
        <StatusBar 
          backgroundColor={navigationTheme.colors.background}
          barStyle={navigationTheme.dark ? 'light-content' : 'dark-content'}
        />
        {/* Yükleniyor durumu SplashScreen tarafından ele alınacak */}
        <AppNavigator initialRouteName="Splash" />
      </PaperProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavigationWrapper />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
