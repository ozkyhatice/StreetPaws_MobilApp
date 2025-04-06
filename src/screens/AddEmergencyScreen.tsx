import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function AddEmergencyScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Acil Durum Ekle</Text>
      <Text variant="bodyLarge">Yeni bir acil durum bildir</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});
