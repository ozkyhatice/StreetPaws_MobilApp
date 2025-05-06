import React, { useContext, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { AuthContextType } from '../types/auth';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type AuthGuardNavigationProp = StackNavigationProp<RootStackParamList>;

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useContext(AuthContext) as AuthContextType;
  const navigation = useNavigation<AuthGuardNavigationProp>();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else if (!user.emailVerified) {
        Alert.alert('E-posta Doğrulama', 'Lütfen e-posta adresinizi doğrulayınız.');
        navigation.reset({
          index: 0,
          routes: [{ name: 'VerifyEmail' }],
        });
      }
    }
  }, [user, loading, navigation]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFB6C1" />
      </View>
    );
  }

  if (!user || !user.emailVerified) {
    return null;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 