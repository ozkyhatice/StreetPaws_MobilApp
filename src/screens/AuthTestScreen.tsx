import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../contexts/AuthContext';
import { AuthContextType } from '../types/auth';
import { auth } from '../config/firebase';

const AuthTestScreen = () => {
  const { user, signIn, signOut } = useContext(AuthContext) as AuthContextType;
  const [authState, setAuthState] = useState('Kontrol ediliyor...');
  
  useEffect(() => {
    checkAuthState();
  }, []);
  
  const checkAuthState = () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setAuthState(`Oturum açık: ${currentUser.email}`);
    } else {
      setAuthState('Oturum kapalı');
    }
  };
  
  const handleTestSignIn = async () => {
    try {
      // Test kullanıcısı ile giriş yap
      await signIn('test@example.com', 'password123');
      Alert.alert('Başarılı', 'Test kullanıcısı ile giriş yapıldı');
      checkAuthState();
    } catch (error) {
      Alert.alert('Giriş Hatası', `${error}`);
    }
  };
  
  const handleTestSignOut = async () => {
    try {
      await signOut();
      Alert.alert('Başarılı', 'Oturum kapatıldı');
      checkAuthState();
    } catch (error) {
      Alert.alert('Çıkış Hatası', `${error}`);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Firebase Auth Test</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.label}>Auth Durumu:</Text>
          <Text style={styles.value}>{authState}</Text>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.label}>Context User:</Text>
          <Text style={styles.value}>
            {user ? `${user.email} (${user.uid})` : 'Giriş yapılmamış'}
          </Text>
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleTestSignIn}
          >
            <Text style={styles.buttonText}>Test Giriş</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleTestSignOut}
          >
            <Text style={styles.buttonText}>Test Çıkış</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.refreshButton]}
            onPress={checkAuthState}
          >
            <Text style={styles.buttonText}>Durumu Yenile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
  },
  buttonsContainer: {
    marginTop: 20,
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#DB4437',
  },
  refreshButton: {
    backgroundColor: '#0F9D58',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AuthTestScreen; 