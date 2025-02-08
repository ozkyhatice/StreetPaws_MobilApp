// "use client"

// import React from "react"
// import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, Alert } from "react-native"
// import { LinearGradient } from "expo-linear-gradient"

// const LoginScreen = ({ navigation }) => {
//   const [username, setUsername] = React.useState("")
//   const [password, setPassword] = React.useState("")

//   const handleLogin = () => {
//     if (username === "admin" && password === "admin") {
//       // Successful login
//       navigation.navigate("Home")
//     } else {
//       // Failed login
//       Alert.alert("Hata", "Kullanıcı adı veya şifre hatalı!")
//     }
//   }

//   return (
//     <LinearGradient colors={["#FFD1DC", "#F7CAC9", "#F0E68C"]} style={styles.container}>
//       <View style={styles.logoContainer}>
//         <Image source={require("../assets/login.png")} style={styles.logo} />
//       </View>
//       <View style={styles.formContainer}>
//         <TextInput
//           style={styles.input}
//           placeholder="Kullanıcı Adı"
//           placeholderTextColor="#B5838D"
//           value={username}
//           onChangeText={setUsername}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Şifre"
//           placeholderTextColor="#B5838D"
//           secureTextEntry
//           value={password}
//           onChangeText={setPassword}
//         />
//         <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Home")}>
//           <Text style={styles.buttonText}>Giriş Yap </Text>
//         </TouchableOpacity>
//         <View style={styles.linkContainer}>
//           <TouchableOpacity onPress={() => navigation.navigate("Register")}>
//             <Text style={styles.linkText}>Kayıt Ol</Text>
//           </TouchableOpacity>
//           <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
//             <Text style={styles.linkText}>Şifremi Unuttum</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </LinearGradient>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   logoContainer: {
//     marginBottom: 50,
//   },
//   logo: {
//     width: 150,
//     height: 150,
//     borderRadius: 75,
//     borderWidth: 3,
//     borderColor: "#FFB6C1",
//   },
//   formContainer: {
//     width: "80%",
//   },
//   input: {
//     backgroundColor: "rgba(255, 255, 255, 0.8)",
//     borderRadius: 25,
//     padding: 15,
//     marginBottom: 15,
//     fontSize: 16,
//     color: "#6D435A",
//   },
//   button: {
//     backgroundColor: "#FFB6C1",
//     borderRadius: 25,
//     padding: 15,
//     alignItems: "center",
//     marginBottom: 15,
//   },
//   buttonText: {
//     color: "#6D435A",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   linkContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   linkText: {
//     color: "#6D435A",
//     fontSize: 16,
//   },
// })

// export default LoginScreen
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

const { width, height } = Dimensions.get("window")

const LoginScreen = ({ navigation }) => {
  const translateY = useSharedValue(height)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)
  const rotation = useSharedValue(0)

  useEffect(() => {
    translateY.value = withSpring(0)
    opacity.value = withTiming(1, { duration: 1000 })
    scale.value = withSpring(1)
    rotation.value = withRepeat(withTiming(360, { duration: 20000, easing: Easing.linear }), -1, false)
  }, [opacity]) // Added opacity to the dependency array

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
          onPress={() => {
            // Kayıt işlemi burada gerçekleştirilecek
            navigation.navigate('Home');
          }}
        >
          <Text style={styles.buttonText}>Giriş Yap</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
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


