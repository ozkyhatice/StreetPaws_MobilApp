import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const CustomNavbar = ({ title = "Gönüllü Platformu" }) => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Geri Butonu */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Başlık */}
        <Text style={styles.title}>{title}</Text>

        {/* Profil veya Menü Butonu */}
        <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={styles.iconButton}>
          <Ionicons name="person-circle-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#4CAF50",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0, // Çentik veya StatusBar ile hizalama
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#4CAF50",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  iconButton: {
    padding: 5,
  },
});

export default CustomNavbar;
