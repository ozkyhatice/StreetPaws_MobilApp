import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Image, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../hooks/useAuth';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Oturum durumu yüklendikten sonra uygun ekrana yönlendir
    if (!loading) {
      setTimeout(() => {
        if (user) {
          // Kullanıcı oturum açmışsa ana ekrana yönlendir
          console.log('Kullanıcı oturum açmış, ana ekrana yönlendiriliyor...');
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainApp' }],
          });
        } else {
          // Kullanıcı oturum açmamışsa giriş ekranına yönlendir
          console.log('Kullanıcı oturum açmamış, giriş ekranına yönlendiriliyor...');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }, 1500); // 1.5 saniye sonra yönlendirme yap
    }
  }, [loading, user, navigation]);

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/pawprint.png')} 
        style={styles.logo}
      />
      <Text style={styles.title}>Street Paws</Text>
      <ActivityIndicator size="large" color="#FF6B6B" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen; 