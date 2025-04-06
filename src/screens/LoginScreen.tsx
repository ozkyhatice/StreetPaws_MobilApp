"use client"

import { useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Dimensions } from "react-native"
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
import type { RootStackParamList } from '../navigation/AppNavigator';

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
      transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
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

  return (
    <View style={styles.container}>
      <Image source={require("../assets/background.jpg")} style={styles.backgroundImage} />
      <BlurView style={styles.absolute} blurType="light" blurAmount={10} reducedTransparencyFallbackColor="white" />
      <Animated.View style={[styles.content, containerStyle]}>
        <Animated.Image source={require("../assets/pawprint.png")} style={[styles.logo, logoStyle]} />
        <Text style={styles.title}>Sokak Hayvanları Yardım Ağı</Text>
        <TextInput style={styles.input} placeholder="Kullanıcı Adı" placeholderTextColor="#666" />
        <TextInput style={styles.input} placeholder="Şifre" placeholderTextColor="#666" secureTextEntry />
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
        >
          <Text style={styles.buttonText}>Giriş Yap</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRegister}>
          <Text style={styles.linkText}>Hesabınız yok mu? Kayıt olun</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: "80%",
    padding: 20,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    color: "#333",
    marginTop: 20,
    textDecorationLine: "underline",
  },
})

export default LoginScreen


