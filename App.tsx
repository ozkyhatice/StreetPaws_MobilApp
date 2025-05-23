import React, { useState, useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, AuthContext } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { AuthContextType } from './src/types/auth';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';

const Stack = createNativeStackNavigator();

// Import your screens here
// Example:
// import HomeScreen from './src/screens/HomeScreen';
// import TasksScreen from './src/screens/TasksScreen';
// import ProfileScreen from './src/screens/ProfileScreen';

function NavigationWrapper() {
  const { paperTheme, navigationTheme } = useTheme();
  const { loading } = useContext(AuthContext) as AuthContextType;

  // Ana uygulama yüklenirken bekleme ekranı
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: navigationTheme.colors.background }}>
        <ActivityIndicator size="large" color={navigationTheme.colors.primary} />
      </View>
    );
  }

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
        <ReduxProvider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ThemeProvider>
              <AuthProvider>
                <NavigationWrapper />
              </AuthProvider>
            </ThemeProvider>
          </PersistGate>
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
