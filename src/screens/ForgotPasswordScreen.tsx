"use client"

import React, { useContext, useState } from "react"
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  TextInput, 
  Alert,
  ActivityIndicator 
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { AuthContext } from '../contexts/AuthContext';
import { AuthContextType } from '../types/auth';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { resetPassword } = useContext(AuthContext) as AuthContextType;
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girin.');
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(email);
      Alert.alert(
        'Başarılı', 
        'Şifre sıfırlama talimatları e-posta adresinize gönderildi.',
        [{ text: 'Tamam', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#FFD1DC", "#F7CAC9", "#F0E68C"]} style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require("../assets/forgot-password.png")} style={styles.logo} />
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Şifrenizi mi unuttunuz?</Text>
        <Text style={styles.subtitle}>E-posta adresinizi girin, size şifre sıfırlama talimatlarını göndereceğiz.</Text>
        <TextInput
          style={styles.input}
          placeholder="E-posta"
          placeholderTextColor="#B5838D"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#6D435A" />
          ) : (
            <Text style={styles.buttonText}>Şifre Sıfırlama Gönder</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.linkText}>Giriş sayfasına dön</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#FFB6C1",
  },
  formContainer: {
    width: "80%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6D435A",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#6D435A",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 25,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: "#6D435A",
  },
  button: {
    backgroundColor: "#FFB6C1",
    borderRadius: 25,
    padding: 15,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#6D435A",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    color: "#6D435A",
    fontSize: 16,
    textAlign: "center",
  },
})

export default ForgotPasswordScreen

