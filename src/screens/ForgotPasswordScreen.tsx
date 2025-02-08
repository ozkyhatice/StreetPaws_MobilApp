"use client"

import React from "react"
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = React.useState("")

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
          value={email}
          onChangeText={setEmail}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            // Şifre sıfırlama e-postası gönderme işlemi burada gerçekleştirilecek
            navigation.navigate("Login")
          }}
        >
          <Text style={styles.buttonText}>Şifre Sıfırlama Gönder</Text>
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

