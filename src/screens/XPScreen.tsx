import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { XPProgress } from '../components/XPProgress';
import { XPActivityCard } from '../components/XPActivityCard';
import { Card } from '../components/Card';
import { colors, typography } from '../config/theme';
import { XPService } from '../services/xpService';
import { UserXP, XPActivity } from '../types/xp';
import { useAuth } from '../hooks/useAuth';
import { Button } from 'react-native-paper';
import { format } from 'date-fns';

export const XPScreen = () => {
  const { user } = useAuth();
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [xpActivities, setXpActivities] = useState<XPActivity[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const xpService = XPService.getInstance();

  useEffect(() => {
    if (!user) return;

    const loadXPData = async () => {
      try {
        setLoading(true);
        const userData = await xpService.getUserXP(user.uid);
        setXpActivities(userData.recentActivities || []);
        setTotalXP(userData.totalXP);
        setUserXP(userData);
      } catch (error) {
        console.error('Error loading XP data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadXPData();
  }, [user]);

  const handleTestXP = async () => {
    if (!user) return;
    
    try {
      await xpService.addXP(user.uid, {
        title: 'Test XP',
        description: 'Test XP added manually',
        xpAmount: 50,
        type: 'TEST'
      });
      
      // Refresh data
      const userData = await xpService.getUserXP(user.uid);
      setXpActivities(userData.recentActivities || []);
      setTotalXP(userData.totalXP);
      setUserXP(userData);
    } catch (error) {
      console.error('Error adding test XP:', error);
    }
  };

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
    <View style={styles.activityItem}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityXP}>+{item.xpAmount} XP</Text>
      </View>
      <Text style={styles.activityDescription}>{item.description}</Text>
      {item.timestamp && (
        <Text style={styles.activityTimestamp}>
          {format(new Date(item.timestamp), 'dd/MM/yyyy HH:mm')}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.totalXPText}>Toplam XP:</Text>
        <Text style={styles.totalXPValue}>{totalXP}</Text>
      </View>

      <FlatList
        data={xpActivities}
        keyExtractor={(item, index) => `${item.title}-${index}`}
        renderItem={renderActivity}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>Henüz hiç XP aktivitesi yok.</Text>
        )}
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

      {/* Test butonu */}
      <Button mode="contained" onPress={handleTestXP}>Test XP Ekle</Button>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  totalXPText: {
    ...typography.body,
    marginRight: 8,
  },
  totalXPValue: {
    ...typography.h1,
    color: colors.primary,
  },
  activityItem: {
    marginBottom: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitle: {
    ...typography.h3,
  },
  activityXP: {
    ...typography.caption,
    color: colors.primary,
  },
  activityDescription: {
    ...typography.body,
  },
  activityTimestamp: {
    ...typography.caption,
    color: colors.textLight,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginTop: 20,
  },
}); 