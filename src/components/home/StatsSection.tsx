import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../../config/theme';

export const StatsSection = () => {
  return (
    <View style={styles.statsSection}>
      <Text variant="titleLarge" style={styles.sectionTitle}>İstatistikler</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text variant="headlineMedium" style={styles.statNumber}>156</Text>
          <Text variant="bodyMedium" style={styles.statLabel}>Aktif Görev</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text variant="headlineMedium" style={styles.statNumber}>843</Text>
          <Text variant="bodyMedium" style={styles.statLabel}>Gönüllü</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text variant="headlineMedium" style={styles.statNumber}>1.2k</Text>
          <Text variant="bodyMedium" style={styles.statLabel}>Tamamlanan Görev</Text>
        </View>
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsSection: {
    padding: 15,
  },
  sectionTitle: {
    marginBottom: 15,
    color: colors.text,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statNumber: {
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 12,
  },
}); 