"use client"

import React, { useEffect, useState, useContext } from "react"
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator
} from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated"
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types/navigation';
import { AuthContext } from '../contexts/AuthContext';
import { AuthContextType } from '../types/auth';
import { useAuthNavigation } from '../hooks/useAuthNavigation';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get("window")

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { signIn, signUp } = useContext(AuthContext) as AuthContextType;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const translateY = useSharedValue(50)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.9)

  useEffect(() => {
    translateY.value = withSequence(
      withTiming(0, { duration: 1000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
    )
    opacity.value = withTiming(1, { duration: 1200 })
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    })
  }, [])

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value } as any,
        { scale: scale.value } as any
      ],
      opacity: opacity.value,
    }
  })

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'E-posta ve şifre alanları boş bırakılamaz.');
      return;
    }
    
    try {
      setIsLoading(true);
      await signIn(email, password);
      // If login is successful, navigate to MainApp
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    } catch (error: any) {
      // Handle login errors
      Alert.alert('Giriş Hatası', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleAdminLogin = async () => {
    try {
      setIsLoading(true);
      // Test amaçlı admin kullanıcı bilgileri
      const adminEmail = "admin@example.com";
      const adminPassword = "admin123";
      
      // UserService'i başlangıçta yükle
      const userService = (await import('../services/userService')).UserService.getInstance();
      
      try {
        // Önce normal giriş deneyin
        await signIn(adminEmail, adminPassword);
      } catch (signInError: any) {
        console.log('Giriş hatası:', signInError.message);
        
        // Kullanıcı bulunamadıysa veya kimlik bilgileri geçersizse otomatik kayıt yap
        if (signInError.message.includes('auth/invalid-credential') || 
            signInError.message.includes('auth/user-not-found')) {
          console.log('Admin kullanıcısı bulunamadı, otomatik kayıt yapılıyor...');
          
          // Önce kullanıcıyı oluştur
          const userCredential = await signUp(adminEmail, adminPassword, "Admin Kullanıcı");
          console.log('Admin kullanıcısı oluşturuldu:', userCredential.uid);
          
          // Kısa bir bekleme ekle
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Admin rolünü ata
          await userService.makeCurrentUserAdmin();
          console.log('Admin rolü atandı');
          
          // Tekrar giriş yap
          await signIn(adminEmail, adminPassword);
          console.log('Admin girişi başarılı');
        } else {
          // Başka bir hata olduysa yeniden fırlat
          throw signInError;
        }
      }
      
      // Giriş başarılıysa admin rolünü kontrol et ve gerekirse ata
      const currentUser = await userService.getCurrentUser();
      if (currentUser && currentUser.role !== 'admin') {
        console.log('Admin rolü atanıyor...');
        await userService.makeCurrentUserAdmin();
      }
      
      console.log('Admin girişi başarılı, görev onaylama sayfasına yönlendiriliyor...');
      
      // Doğrudan görev onaylama sayfasına yönlendirme
      navigation.reset({
        index: 0,
        routes: [
          { 
            name: 'MainApp', 
            params: { screen: 'Verifications' } 
          }
        ],
      });
    } catch (error: any) {
      console.error('Admin login error:', error);
      Alert.alert('Admin Giriş Hatası', `Hata: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    try {
      setIsLoading(true);
      await signIn('ozkyyhatice@gmail.com', '123456');
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    } catch (error: any) {
      // If user doesn't exist, create it
      if (error.message.includes('auth/invalid-credential') || 
          error.message.includes('auth/user-not-found')) {
        try {
          // Try login again
          await signIn('ozkyyhatice@gmail.com', '123456');
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainApp' }],
          });
        } catch (signUpError: any) {
          Alert.alert('Hata', signUpError.message);
        }
      } else {
        Alert.alert('Giriş Hatası', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Oturum kontrolü - Login sayfası için oturum gerekMEZ, oturum varsa MainApp'e yönlendir
  useAuthNavigation(false, 'MainApp');

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[colors.primary.light, colors.primary.main, colors.primary.dark]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          <Animated.View style={[styles.content, containerStyle]}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[colors.accent.light, colors.accent.main]}
                style={styles.logoBackground}
              >
                <Image 
                  source={require("../assets/pawprint.png")} 
                  style={styles.logo}
                />
              </LinearGradient>
              <Text style={styles.title}>Sokak Dostları</Text>
              <Text style={styles.subtitle}>Yardım Ağına Hoş Geldiniz</Text>
            </View>
            
            <View style={styles.formContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="E-posta adresiniz" 
                  placeholderTextColor={colors.text.tertiary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.primary.main} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Şifreniz" 
                  placeholderTextColor={colors.text.tertiary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
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

              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[colors.primary.main, colors.primary.dark]}
                  style={styles.buttonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.text.inverse} />
                  ) : (
                    <Text style={styles.buttonText}>Giriş Yap</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
              >
                <Text style={styles.registerText}>
                  Hesabınız yok mu? <Text style={styles.registerTextBold}>Kayıt Olun</Text>
                </Text>
              </TouchableOpacity>

              <View style={styles.testButtonsContainer}>
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={handleTestLogin}
                >
                  <Text style={styles.testButtonText}>Test Kullanıcı</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.testButton}
                  onPress={handleAdminLogin}
                >
                  <Text style={styles.testButtonText}>Test Admin</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height * 0.4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: height * 0.15,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
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
    width: 70,
    height: 70,
    tintColor: colors.text.inverse,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.text.inverse,
    textAlign: 'center',
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.utility.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: colors.utility.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: colors.primary.main,
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.utility.divider,
  },
  dividerText: {
    color: colors.text.secondary,
    paddingHorizontal: 15,
    fontSize: 14,
  },
  registerButton: {
    alignItems: 'center',
  },
  registerText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  registerTextBold: {
    color: colors.primary.main,
    fontWeight: 'bold',
  },
  testButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.utility.divider,
  },
  testButton: {
    backgroundColor: colors.background.tertiary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary.light,
  },
  testButtonText: {
    color: colors.primary.main,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default LoginScreen


