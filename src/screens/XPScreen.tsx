import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { XPProgress } from '../components/XPProgress';
import { XPActivityCard } from '../components/XPActivityCard';
import { Card } from '../components/Card';
import { colors, typography } from '../config/theme';
import { XPService } from '../services/xpService';
import { UserXP, XPActivity } from '../types/xp';
import { useAuth } from '../hooks/useAuth'; // Bu hook'u oluşturmanız gerekecek

export const XPScreen = () => {
  const { user } = useAuth();
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const xpService = XPService.getInstance();

  useEffect(() => {
    const loadUserXP = async () => {
      if (user?.uid) {
        const xpData = await xpService.getUserXP(user.uid);
        setUserXP(xpData);
      }
    };

    loadUserXP();
  }, [user]);

  if (!userXP) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  const renderAchievementCard = () => (
    <Card style={styles.achievementCard}>
      <Text style={styles.achievementTitle}>Başarımlar</Text>
      <View style={styles.achievementStats}>
        <View style={styles.achievementItem}>
          <Text style={styles.achievementValue}>{userXP.currentLevel}</Text>
          <Text style={styles.achievementLabel}>Seviye</Text>
        </View>
        <View style={styles.achievementItem}>
          <Text style={styles.achievementValue}>{userXP.totalXP}</Text>
          <Text style={styles.achievementLabel}>Toplam XP</Text>
        </View>
        <View style={styles.achievementItem}>
          <Text style={styles.achievementValue}>
            {userXP.recentActivities.length}
          </Text>
          <Text style={styles.achievementLabel}>Aktivite</Text>
        </View>
      </View>
    </Card>
  );

  const renderActivity = ({ item }: { item: XPActivity }) => (
    <XPActivityCard activity={item} />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={userXP.recentActivities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {renderAchievementCard()}
            <XPProgress
              level={userXP.currentLevel}
              progress={userXP.currentLevelXP / (userXP.currentLevelXP + userXP.xpToNextLevel)}
              totalXP={userXP.totalXP}
            />
            <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
          </>
        }
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  loadingText: {
    ...typography.body,
    textAlign: 'center',
    marginTop: 20,
  },
  achievementCard: {
    marginBottom: 16,
  },
  achievementTitle: {
    ...typography.h2,
    marginBottom: 16,
  },
  achievementStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  achievementItem: {
    alignItems: 'center',
  },
  achievementValue: {
    ...typography.h1,
    color: colors.primary,
  },
  achievementLabel: {
    ...typography.caption,
    color: colors.textLight,
  },
  sectionTitle: {
    ...typography.h3,
    marginVertical: 16,
  },
}); 