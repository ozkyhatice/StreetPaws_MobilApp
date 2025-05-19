import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../../config/theme';
import { StatsService, GlobalStats } from '../../services/statsService';

export type StatsSectionRefHandle = {
  fetchStats: () => Promise<void>;
};

export const StatsSection = forwardRef<StatsSectionRefHandle, {}>((props, ref) => {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Expose fetchStats method to parent component
  useImperativeHandle(ref, () => ({
    fetchStats: async () => {
      await fetchStats();
    },
  }));

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const statsService = StatsService.getInstance();
      const globalStats = await statsService.getGlobalStats();
      setStats(globalStats);
    } catch (error) {
      console.error('Error fetching global stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format numbers for display
  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) {
      return '0';
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.statsSection}>
      <Text variant="titleLarge" style={styles.sectionTitle}>İstatistikler</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.cardContainer}>
          <View style={styles.statCard}>
            <Text variant="headlineMedium" style={styles.statNumber}>
              {formatNumber(stats?.activeTasksCount)}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>Aktif Görev</Text>
          </View>
        </View>
        
        <View style={styles.cardContainer}>
          <View style={styles.statCard}>
            <Text variant="headlineMedium" style={styles.statNumber}>
              {formatNumber(stats?.totalVolunteers)}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>Gönüllü</Text>
          </View>
        </View>
        
        <View style={styles.cardContainer}>
          <View style={styles.statCard}>
            <Text variant="headlineMedium" style={styles.statNumber}>
              {formatNumber(stats?.totalTasksCompleted)}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>Tamamlanan Görev</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

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
  cardContainer: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
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
  loadingContainer: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 