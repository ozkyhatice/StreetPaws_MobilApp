import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { AuthContextType } from '../types/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type VerifyEmailScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const VerifyEmailScreen = () => {
  const { user, resendVerificationEmail, checkEmailVerification, signOut } = useContext(AuthContext) as AuthContextType;
  const navigation = useNavigation<VerifyEmailScreenNavigationProp>();
  const [isChecking, setIsChecking] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [user, navigation]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (countdown > 0) {
        setCountdown(c => c - 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleCheckVerification = async () => {
    try {
      setIsChecking(true);
      const isVerified = await checkEmailVerification();
      
      if (isVerified) {
        Alert.alert(
          'Başarılı',
          'E-posta adresiniz doğrulandı!',
          [
            {
              text: 'Devam Et',
              onPress: () => navigation.reset({
                index: 0,
                routes: [{ name: 'MainApp', params: { screen: 'Home' } }],
              }),
            },
          ]
        );
      } else {
        Alert.alert('Bilgi', 'E-posta adresiniz henüz doğrulanmamış.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Doğrulama durumu kontrol edilirken bir hata oluştu.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0) return;
    
    try {
      await resendVerificationEmail();
      Alert.alert('Başarılı', 'Doğrulama e-postası tekrar gönderildi.');
      setCountdown(60); // 60 saniyelik bekleme süresi
    } catch (error) {
      Alert.alert('Hata', 'Doğrulama e-postası gönderilemedi.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
    }
  };

  return (
    <LinearGradient
      colors={['#FFD1DC', '#F7CAC9', '#F0E68C']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Ionicons name="mail-unread-outline" size={80} color="#6D435A" />
        
        <Text style={styles.title}>E-posta Doğrulaması</Text>
        
        <Text style={styles.description}>
          Lütfen {user?.email} adresine gönderilen doğrulama e-postasını kontrol edin.
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.checkButton]}
          onPress={handleCheckVerification}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Doğrulama Durumunu Kontrol Et</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.resendButton,
            countdown > 0 && styles.buttonDisabled
          ]}
          onPress={handleResendEmail}
          disabled={countdown > 0}
        >
          <Ionicons name="refresh-outline" size={24} color="#6D435A" style={styles.buttonIcon} />
          <Text style={styles.resendButtonText}>
            {countdown > 0
              ? `Tekrar gönder (${countdown}s)`
              : 'Doğrulama E-postasını Tekrar Gönder'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6D435A',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#6D435A',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    padding: 15,
    width: '100%',
    marginBottom: 15,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButtonText: {
    color: '#6D435A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkButton: {
    backgroundColor: '#6D435A',
  },
  resendButton: {
    backgroundColor: '#FFB6C1',
  },
  signOutButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default VerifyEmailScreen; 