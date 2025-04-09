"use client"

import React, { useEffect } from "react"
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
  ScrollView
} from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated"
import { BlurView } from "@react-native-community/blur"
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing, borderRadius, shadows } from '../config/theme';
import { RootStackParamList } from '../types/navigation';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get("window")

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const translateY = useSharedValue(height)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)
  const rotation = useSharedValue(0)

  useEffect(() => {
    translateY.value = withSpring(0)
    opacity.value = withTiming(1, { duration: 1000 })
    scale.value = withSpring(1)
    rotation.value = withRepeat(withTiming(360, { duration: 20000, easing: Easing.linear }), -1, false)
  }, [opacity])

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    }
  })

  const logoStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ] as any,
    }
  })

  const handleLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainApp' }],
    });
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

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
          <Image source={require("../assets/background.jpg")} style={styles.backgroundImage} />
          <BlurView style={styles.absolute} blurType="light" blurAmount={10} reducedTransparencyFallbackColor="white" />
          
          <Animated.View style={[styles.content, containerStyle]}>
            <Animated.Image 
              source={require("../assets/pawprint.png")} 
              style={[styles.logo, logoStyle as any]} 
            />
            <Text style={styles.title}>Sokak Hayvanları Yardım Ağı</Text>
            
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input} 
                placeholder="Kullanıcı Adı" 
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
              />
              <TextInput 
                style={styles.input} 
                placeholder="Şifre" 
                placeholderTextColor={colors.textTertiary} 
                secureTextEntry
              />
            </View>
            
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Şifremi unuttum</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>Giriş Yap</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.registerLink}
              onPress={handleRegister}
            >
              <Text style={styles.linkText}>Hesabınız yok mu? Kayıt olun</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundImage: {
    width,
    height,
    position: "absolute",
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  content: {
    width: "85%",
    maxWidth: 400,
    padding: spacing.lg,
    borderRadius: borderRadius.large,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    alignItems: "center",
    ...shadows.medium,
    marginVertical: spacing.lg,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: spacing.sm,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    color: colors.secondary,
    fontSize: 14,
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  registerLink: {
    marginTop: spacing.lg,
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: 16,
    textDecorationLine: "underline",
  },
})

export default LoginScreen


