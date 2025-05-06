'use client';

import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  TextInput, 
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { AuthContext } from '../contexts/AuthContext';
import { AuthContextType } from '../types/auth';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../config/theme';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { signUp, resendVerificationEmail } = useContext(AuthContext) as AuthContextType;
  
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      Alert.alert('Hata', 'Lütfen zorunlu alanları doldurun.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girin.');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return false;
    }

    if (formData.phoneNumber && !/^\+?[0-9]{10,}$/.test(formData.phoneNumber)) {
      Alert.alert('Hata', 'Geçerli bir telefon numarası girin.');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await signUp(formData.email, formData.password, formData.username);
      setShowVerificationModal(true);
    } catch (error: any) {
      let errorMessage = 'Kayıt sırasında bir hata oluştu.';
      
      if (error.message.includes('email-already-in-use')) {
        errorMessage = 'Bu e-posta adresi zaten kullanımda.';
      } else if (error.message.includes('invalid-email')) {
        errorMessage = 'Geçersiz e-posta adresi.';
      } else if (error.message.includes('operation-not-allowed')) {
        errorMessage = 'E-posta/şifre girişi etkin değil.';
      } else if (error.message.includes('weak-password')) {
        errorMessage = 'Şifre çok zayıf.';
      }
      
      Alert.alert('Kayıt Hatası', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      Alert.alert('Başarılı', 'Doğrulama e-postası tekrar gönderildi.');
    } catch (error: any) {
      Alert.alert('Hata', 'Doğrulama e-postası gönderilemedi.');
    }
  };

  const VerificationModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showVerificationModal}
      onRequestClose={() => setShowVerificationModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Ionicons name="mail-outline" size={50} color={colors.primary} style={styles.modalIcon} />
          <Text style={styles.modalTitle}>E-posta Doğrulaması</Text>
          <Text style={styles.modalText}>
            Kaydınız başarıyla oluşturuldu. Lütfen {formData.email} adresine gönderilen doğrulama e-postasını kontrol edin.
          </Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={handleResendVerification}
          >
            <Text style={styles.modalButtonText}>Doğrulama E-postasını Tekrar Gönder</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.loginButton]}
            onPress={() => {
              setShowVerificationModal(false);
              navigation.navigate('Login');
            }}
          >
            <Text style={styles.modalButtonText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#FFD1DC', '#F7CAC9', '#F0E68C']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image source={require('../assets/register.png')} style={styles.logo} />
            <Text style={styles.title}>Kayıt Ol</Text>
            <Text style={styles.subtitle}>Sokak Dostları ailesine katıl</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#B5838D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Kullanıcı Adı"
                placeholderTextColor="#B5838D"
                value={formData.username}
                onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
              />
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#B5838D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ad"
                placeholderTextColor="#B5838D"
                value={formData.displayName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
              />
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#B5838D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Soyad"
                placeholderTextColor="#B5838D"
              />
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#B5838D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-posta"
                placeholderTextColor="#B5838D"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#B5838D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Telefon (İsteğe bağlı)"
                placeholderTextColor="#B5838D"
                keyboardType="phone-pad"
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#B5838D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Şifre"
                placeholderTextColor="#B5838D"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#B5838D"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#B5838D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Şifre Tekrar"
                placeholderTextColor="#B5838D"
                secureTextEntry={!showConfirmPassword}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#B5838D"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#6D435A" />
              ) : (
                <Text style={styles.buttonText}>Kayıt Ol</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              style={styles.loginLink}
            >
              <Text style={styles.linkText}>Zaten hesabınız var mı? Giriş yapın</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
      <VerificationModal />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6D435A',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6D435A',
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#6D435A',
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    backgroundColor: '#FFB6C1',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#6D435A',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
  },
  linkText: {
    color: '#6D435A',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6D435A',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#6D435A',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#FFB6C1',
    borderRadius: 25,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: '#6D435A',
  },
  modalButtonText: {
    color: '#6D435A',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
