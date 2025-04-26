import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../config/theme';

export const Header = () => {
  return (
    <LinearGradient
      colors={[colors.primaryLight + '60', colors.primary + '30']}
      style={styles.headerGradient}
    >
      <View style={styles.header}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text variant="headlineMedium" style={styles.title}>StreetPaws</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Sokak hayvanlarına yardım etmek için bir araya geldik
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
}); 