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
  Modal,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { AuthContext } from '../contexts/AuthContext';
import { AuthContextType } from '../types/auth';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const { width } = Dimensions.get('window');

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { signUp, resendVerificationEmail } = useContext(AuthContext) as AuthContextType;
  
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    dateOfBirth: '',
    city: '',
    bio: '',
    profilePicture: null as string | null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword ||
        !formData.firstName || !formData.lastName) {
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

    if (formData.dateOfBirth) {
      const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
      if (!dateRegex.test(formData.dateOfBirth)) {
        Alert.alert('Hata', 'Geçerli bir doğum tarihi girin (GG/AA/YYYY).');
        return false;
      }
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const { user } = await signUp(formData.email, formData.password, formData.username);
      
      // Create user profile in Firestore
      const userProfile = {
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phoneNumber: formData.phoneNumber || null,
        dateOfBirth: formData.dateOfBirth || null,
        city: formData.city || null,
        bio: formData.bio || null,
        profilePicture: formData.profilePicture || null,
        createdAt: new Date().toISOString(),
        xp: 0,
        badges: [],
        completedTasks: [],
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
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
          <Ionicons name="mail-outline" size={50} color={colors.primary.main} style={styles.modalIcon} />
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
        colors={[colors.background.primary, colors.background.secondary, colors.background.tertiary]}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[colors.primary.light, colors.primary.main]}
              style={styles.logoBackground}
            >
              <Image source={require('../assets/register.png')} style={styles.logo} />
            </LinearGradient>
            <Text style={styles.title}>Sokak Dostlarına Katıl</Text>
            <Text style={styles.subtitle}>Yardıma ihtiyacı olan dostlarımız için bir adım at</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Kullanıcı Adı"
                  placeholderTextColor={colors.text.tertiary}
                  value={formData.username}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                />
              </View>

              <View style={styles.rowContainer}>
                <View style={[styles.inputWrapper, styles.halfInput]}>
                  <Ionicons name="person-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ad"
                    placeholderTextColor={colors.text.tertiary}
                    value={formData.firstName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                  />
                </View>

                <View style={[styles.inputWrapper, styles.halfInput]}>
                  <Ionicons name="person-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Soyad"
                    placeholderTextColor={colors.text.tertiary}
                    value={formData.lastName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                  />
                </View>
              </View>

              <View style={styles.rowContainer}>
                <View style={[styles.inputWrapper, styles.halfInput]}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Doğum Tarihi"
                    placeholderTextColor={colors.text.tertiary}
                    value={formData.dateOfBirth}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, dateOfBirth: text }))}
                  />
                </View>

                <View style={[styles.inputWrapper, styles.halfInput]}>
                  <Ionicons name="location-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Şehir"
                    placeholderTextColor={colors.text.tertiary}
                    value={formData.city}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                  />
                </View>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>İletişim Bilgileri</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="E-posta"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Telefon (İsteğe bağlı)"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="phone-pad"
                  value={formData.phoneNumber}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Profil Bilgileri</Text>
              <View style={[styles.inputWrapper, styles.bioWrapper]}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary.main} style={[styles.inputIcon, styles.bioIcon]} />
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  placeholder="Kendini tanıt..."
                  placeholderTextColor={colors.text.tertiary}
                  value={formData.bio}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Güvenlik</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifre"
                  placeholderTextColor={colors.text.tertiary}
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
                    color={colors.primary.main}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifre Tekrar"
                  placeholderTextColor={colors.text.tertiary}
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
                    color={colors.primary.main}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[colors.primary.main, colors.primary.dark]}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.text.inverse} />
                ) : (
                  <Text style={styles.buttonText}>Kayıt Ol</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              style={styles.loginLink}
            >
              <Text style={styles.linkText}>Zaten hesabın var mı? <Text style={styles.linkTextBold}>Giriş yap</Text></Text>
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
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
  },
  formSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 15,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: colors.utility.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  halfInput: {
    width: (width - 50) / 2,
  },
  inputIcon: {
    width: 24,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: colors.text.primary,
    fontSize: 16,
  },
  bioWrapper: {
    height: 100,
    alignItems: 'flex-start',
  },
  bioIcon: {
    marginTop: 12,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    marginBottom: 20,
  },
  linkText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  linkTextBold: {
    color: colors.primary.main,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 25,
    width: '90%',
    alignItems: 'center',
    shadowColor: colors.utility.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalIcon: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: colors.primary.main,
    borderRadius: 12,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: colors.primary.dark,
  },
  modalButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
