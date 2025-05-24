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
import { db, auth } from '../config/firebase';
import { sendEmailVerification, fetchSignInMethodsForEmail, updateProfile } from 'firebase/auth';
import { UserService } from '../services/userService';

const { width } = Dimensions.get('window');

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { signUp, resendVerificationEmail } = useContext(AuthContext) as AuthContextType;
  
  const [userType, setUserType] = useState<'individual' | 'business'>('individual');
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
    // Business/Healthcare fields
    businessName: '',
    businessType: '' as 'business' | 'healthcare' | '',
    taxNumber: '',
    registrationNumber: '',
    address: '',
    businessPhoneNumber: '',
    businessEmail: '',
    businessWebsite: '',
    businessDescription: '',
    documents: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const emailToValidate = userType === 'individual' ? formData.email : formData.businessEmail;
    
    if (!validateEmail(emailToValidate)) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
      return false;
    }

    if (userType === 'individual') {
      if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword ||
          !formData.firstName || !formData.lastName) {
        Alert.alert('Hata', 'Lütfen zorunlu alanları doldurun.');
        return false;
      }
    } else {
      if (!formData.businessName || !formData.businessType || !formData.taxNumber || 
          !formData.registrationNumber || !formData.address || !formData.businessPhoneNumber ||
          !formData.businessEmail || !formData.password || !formData.confirmPassword) {
        Alert.alert('Hata', 'Lütfen zorunlu alanları doldurun.');
        return false;
      }
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
      const email = userType === 'individual' ? formData.email.trim().toLowerCase() : formData.businessEmail.trim().toLowerCase();
      
      // Test veteriner hesabı için e-posta kontrolünü atlıyoruz
      // Create user account with additional profile data
      const displayName = userType === 'individual' ? formData.username : formData.businessName;
      const additionalData = userType === 'individual' ? {
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber || null,
        dateOfBirth: formData.dateOfBirth || null,
        city: formData.city || null,
        bio: formData.bio || null,
        userType: 'individual',
        role: 'user' as const
      } : {
        businessName: formData.businessName,
        businessType: formData.businessType,
        taxNumber: formData.taxNumber,
        registrationNumber: formData.registrationNumber,
        address: formData.address,
        phoneNumber: formData.businessPhoneNumber,
        website: formData.businessWebsite || null,
        description: formData.businessDescription || null,
        documents: formData.documents,
        userType: 'business',
        role: 'user' as const,
        status: 'approved', // Test için direkt onaylı
        isApproved: true, // Test için direkt onaylı
        emailVerified: true // Test için direkt doğrulanmış
      };

      const { user } = await signUp(email, formData.password, displayName);
      
      if (!user) {
        throw new Error('Kullanıcı oluşturulamadı');
      }

      // Update user profile with additional data
      try {
        const userService = UserService.getInstance();
        await userService.updateUser(user.uid, additionalData);
        
        // Test için kullanıcıyı direkt onaylı ve doğrulanmış olarak işaretliyoruz
        if (userType === 'business') {
          await setDoc(doc(db, 'users', user.uid), { emailVerified: true }, { merge: true });
        }
      } catch (error) {
        console.error('Error updating user profile:', error);
      }
      
      // Test hesabı için doğrulama modalını göstermiyoruz
      if (userType === 'business') {
        navigation.navigate('Login');
      } else {
        setShowVerificationModal(true);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Kayıt sırasında bir hata oluştu.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Bu e-posta adresi zaten kullanımda. Lütfen farklı bir e-posta adresi deneyin.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Geçerli bir e-posta adresi girin.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'E-posta/şifre girişi etkin değil.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Şifre çok zayıf. En az 6 karakter kullanın.';
          break;
        default:
          errorMessage = error.message || 'Kayıt işlemi başarısız oldu. Lütfen daha sonra tekrar deneyin.';
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
            <View style={styles.userTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'individual' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('individual')}
              >
                <Ionicons 
                  name="person-outline" 
                  size={24} 
                  color={userType === 'individual' ? colors.text.inverse : colors.text.primary} 
                />
                <Text style={[
                  styles.userTypeText,
                  userType === 'individual' && styles.userTypeTextActive
                ]}>Bireysel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'business' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('business')}
              >
                <Ionicons 
                  name="business-outline" 
                  size={24} 
                  color={userType === 'business' ? colors.text.inverse : colors.text.primary} 
                />
                <Text style={[
                  styles.userTypeText,
                  userType === 'business' && styles.userTypeTextActive
                ]}>İşletme/Sağlık Kurumu</Text>
              </TouchableOpacity>
            </View>

            {userType === 'individual' ? (
              <>
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
              </>
            ) : (
              <>
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>İşletme Bilgileri</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="business-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="İşletme Adı"
                      placeholderTextColor={colors.text.tertiary}
                      value={formData.businessName}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, businessName: text }))}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Ionicons name="list-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                    <View style={styles.pickerWrapper}>
                      <TouchableOpacity
                        style={[
                          styles.businessTypeButton,
                          formData.businessType === 'business' && styles.businessTypeButtonActive
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, businessType: 'business' }))}
                      >
                        <Text style={[
                          styles.businessTypeText,
                          formData.businessType === 'business' && styles.businessTypeTextActive
                        ]}>İşletme</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.businessTypeButton,
                          formData.businessType === 'healthcare' && styles.businessTypeButtonActive
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, businessType: 'healthcare' }))}
                      >
                        <Text style={[
                          styles.businessTypeText,
                          formData.businessType === 'healthcare' && styles.businessTypeTextActive
                        ]}>Sağlık Kurumu</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Ionicons name="card-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Vergi Numarası"
                      placeholderTextColor={colors.text.tertiary}
                      keyboardType="numeric"
                      value={formData.taxNumber}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, taxNumber: text }))}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Ionicons name="document-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Ruhsat/Tescil Numarası"
                      placeholderTextColor={colors.text.tertiary}
                      value={formData.registrationNumber}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, registrationNumber: text }))}
                    />
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>İletişim Bilgileri</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="location-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Adres"
                      placeholderTextColor={colors.text.tertiary}
                      multiline
                      numberOfLines={3}
                      value={formData.address}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Ionicons name="call-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Telefon"
                      placeholderTextColor={colors.text.tertiary}
                      keyboardType="phone-pad"
                      value={formData.businessPhoneNumber}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, businessPhoneNumber: text }))}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="E-posta"
                      placeholderTextColor={colors.text.tertiary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={formData.businessEmail}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, businessEmail: text }))}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Ionicons name="globe-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Website (İsteğe bağlı)"
                      placeholderTextColor={colors.text.tertiary}
                      autoCapitalize="none"
                      value={formData.businessWebsite}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, businessWebsite: text }))}
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
              </>
            )}

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
                  <Text style={styles.buttonText}>
                    {userType === 'individual' ? 'Kayıt Ol' : 'Başvuru Yap'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              style={styles.loginLink}
            >
              <Text style={styles.linkText}>
                Zaten hesabın var mı? <Text style={styles.linkTextBold}>Giriş yap</Text>
              </Text>
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
  userTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  userTypeButtonActive: {
    backgroundColor: colors.primary.main,
  },
  userTypeText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  userTypeTextActive: {
    color: colors.text.inverse,
  },
  pickerWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 10,
  },
  businessTypeButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
  },
  businessTypeButtonActive: {
    backgroundColor: colors.primary.main,
  },
  businessTypeText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  businessTypeTextActive: {
    color: colors.text.inverse,
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
