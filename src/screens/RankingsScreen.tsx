import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { Text, Card, Avatar, Chip, ActivityIndicator } from 'react-native-paper';
import { Trophy, Medal, Star, Award, Users, Home, Plus } from 'lucide-react-native';
import { colors, spacing, shadows, borderRadius, typography } from '../config/theme';
import { useAuth } from '../hooks/useAuth';
import { User } from '../types/user';
import { UserService } from '../services/userService';
import { useNavigation } from '@react-navigation/native';

// Tabs for different rankings
enum RankingTab {
  VOLUNTEERS = 'volunteers',
  BUSINESSES = 'businesses',
  VETERINARIANS = 'veterinarians',
}

interface RankingUser extends User {
  rank: number;
  score: number;
}

export default function RankingsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<RankingTab>(RankingTab.VOLUNTEERS);
  const [volunteers, setVolunteers] = useState<RankingUser[]>([]);
  const [businesses, setBusinesses] = useState<RankingUser[]>([]);
  const [veterinarians, setVeterinarians] = useState<RankingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userService = UserService.getInstance();

  useEffect(() => {
    const fetchRankings = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const allUsers = await userService.getAllUsers();
        
        // Process volunteers
        const volunteerUsers = allUsers
          .filter(u => !u.isBusinessAccount && (u.role === 'user' || u.role === 'volunteer'))
          .map((u, index) => ({
            ...u,
            rank: index + 1,
            score: u.stats?.xpPoints || 0,
          }))
          .sort((a, b) => b.score - a.score);
        
        // Process businesses
        const businessUsers = allUsers
          .filter(u => u.isBusinessAccount && u.businessType === 'business' && u.isApproved)
          .map((u, index) => ({
            ...u,
            rank: index + 1,
            score: u.rating || 0,
          }))
          .sort((a, b) => b.score - a.score);
        
        // Process veterinarians
        const veterinarianUsers = allUsers
          .filter(u => u.isBusinessAccount && u.businessType === 'healthcare' && u.isApproved)
          .map((u, index) => ({
            ...u,
            rank: index + 1,
            score: u.rating || 0,
          }))
          .sort((a, b) => b.score - a.score);

        setVolunteers(volunteerUsers);
        setBusinesses(businessUsers);
        setVeterinarians(veterinarianUsers);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching rankings:', error);
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, [user]);

  const renderTabBar = () => (
    <View style={styles.tabBarWrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBarScrollContent}
        style={styles.tabBarContainer}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === RankingTab.VOLUNTEERS && styles.activeTab]}
          onPress={() => setActiveTab(RankingTab.VOLUNTEERS)}
        >
          <Users size={22} color={activeTab === RankingTab.VOLUNTEERS ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === RankingTab.VOLUNTEERS && styles.activeTabText]}>
            Gönüllüler
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === RankingTab.BUSINESSES && styles.activeTab]}
          onPress={() => setActiveTab(RankingTab.BUSINESSES)}
        >
          <Home size={22} color={activeTab === RankingTab.BUSINESSES ? colors.warning : colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === RankingTab.BUSINESSES && styles.activeTabText, activeTab === RankingTab.BUSINESSES && styles.businessTabText]}>
            İşletmeler
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === RankingTab.VETERINARIANS && styles.activeTab]}
          onPress={() => setActiveTab(RankingTab.VETERINARIANS)}
        >
          <Plus size={22} color={activeTab === RankingTab.VETERINARIANS ? colors.success : colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === RankingTab.VETERINARIANS && styles.activeTabText, activeTab === RankingTab.VETERINARIANS && styles.veterinarianTabText]}>
            Veterinerler
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case RankingTab.VOLUNTEERS:
        return volunteers;
      case RankingTab.BUSINESSES:
        return businesses;
      case RankingTab.VETERINARIANS:
        return veterinarians;
      default:
        return [];
    }
  };

  const getScoreText = (user: RankingUser) => {
    if (activeTab === RankingTab.VOLUNTEERS) {
      return `${Math.round(user.score)} XP`;
    }
    return `${user.score.toFixed(1)} Puan`;
  };

  const getRankingColor = (rank: number) => {
    switch (rank) {
      case 1: return colors.gold;
      case 2: return colors.silver;
      case 3: return colors.bronze;
      default: return colors.textSecondary;
    }
  };

  const getRankingIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy size={24} color={colors.gold} />;
      case 2: return <Trophy size={24} color={colors.silver} />;
      case 3: return <Trophy size={24} color={colors.bronze} />;
      default: return <Text style={[styles.rankText, { color: colors.textSecondary }]}>{rank}</Text>;
    }
  };

  const handleUserPress = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  const renderRankingCard = ({ item }: { item: RankingUser }) => (
    <TouchableOpacity onPress={() => handleUserPress(item.uid)}>
      <Card 
        style={[
          styles.rankingCard,
          item.rank <= 3 && styles.topRankCard,
          activeTab === RankingTab.BUSINESSES && styles.businessCard,
          activeTab === RankingTab.VETERINARIANS && styles.veterinarianCard,
        ]}
        mode="elevated"
      >
        <View style={styles.rankingContent}>
          <View style={styles.rankContainer}>
            {getRankingIcon(item.rank)}
          </View>

          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              {item.photoURL ? (
                <Avatar.Image 
                  source={{ uri: item.photoURL }} 
                  size={50}
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Icon 
                  icon={activeTab === RankingTab.VOLUNTEERS ? "account" : "domain"}
                  size={50}
                  style={[
                    styles.avatarIcon,
                    activeTab === RankingTab.BUSINESSES && styles.businessAvatar,
                    activeTab === RankingTab.VETERINARIANS && styles.veterinarianAvatar,
                  ]}
                />
              )}
            </View>

            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{item.displayName}</Text>
              <Text style={styles.userRole}>
                {activeTab === RankingTab.VOLUNTEERS ? 'Gönüllü' : 
                 activeTab === RankingTab.BUSINESSES ? 'İşletme' : 
                 'Veteriner'}
              </Text>
            </View>
          </View>

          <View style={styles.scoreContainer}>
            {activeTab === RankingTab.VOLUNTEERS ? (
              <>
                <Star size={16} color={colors.warning} />
                <Text style={styles.scoreText}>{Math.round(item.score)} XP</Text>
              </>
            ) : (
              <>
                <Star size={16} color={colors.warning} />
                <Text style={styles.scoreText}>{item.score.toFixed(1)} Puan</Text>
              </>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../assets/paw.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Sıralama Bulunamadı</Text>
      <Text style={styles.emptyText}>
        {activeTab === RankingTab.VOLUNTEERS ? 
          'Henüz gönüllü sıralaması oluşturulmamış.' :
          activeTab === RankingTab.BUSINESSES ?
          'Henüz işletme sıralaması oluşturulmamış.' :
          'Henüz veteriner sıralaması oluşturulmamış.'}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Sıralama yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.title}>
          {activeTab === RankingTab.VOLUNTEERS ? 'Gönüllü Sıralaması' :
           activeTab === RankingTab.BUSINESSES ? 'İşletme Sıralaması' :
           'Veteriner Sıralaması'}
        </Text>
      </View>

      {renderTabBar()}

      {/* Top 3 Section */}
      {getCurrentData().length > 0 && (
        <View style={styles.topThreeContainer}>
          {/* Second Place */}
          {getCurrentData()[1] && (
            <View style={[styles.topThreeItem, styles.secondPlace]}>
              <View style={styles.topThreeAvatarContainer}>
                {getCurrentData()[1].photoURL ? (
                  <Avatar.Image 
                    source={{ uri: getCurrentData()[1].photoURL }} 
                    size={60}
                    style={styles.topThreeAvatar}
                  />
                ) : (
                  <Avatar.Icon 
                    icon={activeTab === RankingTab.VOLUNTEERS ? "account" : "domain"}
                    size={60}
                    style={[
                      styles.topThreeAvatarIcon,
                      activeTab === RankingTab.BUSINESSES && styles.businessAvatar,
                      activeTab === RankingTab.VETERINARIANS && styles.veterinarianAvatar,
                    ]}
                  />
                )}
                <Trophy size={24} color={colors.silver} style={styles.medalIcon} />
              </View>
              <Text style={styles.topThreeName} numberOfLines={1}>
                {getCurrentData()[1].displayName}
              </Text>
              <Text style={styles.topThreeScore}>
                {getScoreText(getCurrentData()[1])}
              </Text>
            </View>
          )}

          {/* First Place */}
          {getCurrentData()[0] && (
            <View style={[styles.topThreeItem, styles.firstPlace]}>
              <View style={styles.topThreeAvatarContainer}>
                {getCurrentData()[0].photoURL ? (
                  <Avatar.Image 
                    source={{ uri: getCurrentData()[0].photoURL }} 
                    size={80}
                    style={styles.topThreeAvatar}
                  />
                ) : (
                  <Avatar.Icon 
                    icon={activeTab === RankingTab.VOLUNTEERS ? "account" : "domain"}
                    size={80}
                    style={[
                      styles.topThreeAvatarIcon,
                      activeTab === RankingTab.BUSINESSES && styles.businessAvatar,
                      activeTab === RankingTab.VETERINARIANS && styles.veterinarianAvatar,
                    ]}
                  />
                )}
                <Trophy size={32} color={colors.gold} style={styles.medalIcon} />
              </View>
              <Text style={[styles.topThreeName, styles.firstPlaceName]} numberOfLines={1}>
                {getCurrentData()[0].displayName}
              </Text>
              <Text style={[styles.topThreeScore, styles.firstPlaceScore]}>
                {getScoreText(getCurrentData()[0])}
              </Text>
            </View>
          )}

          {/* Third Place */}
          {getCurrentData()[2] && (
            <View style={[styles.topThreeItem, styles.thirdPlace]}>
              <View style={styles.topThreeAvatarContainer}>
                {getCurrentData()[2].photoURL ? (
                  <Avatar.Image 
                    source={{ uri: getCurrentData()[2].photoURL }} 
                    size={60}
                    style={styles.topThreeAvatar}
                  />
                ) : (
                  <Avatar.Icon 
                    icon={activeTab === RankingTab.VOLUNTEERS ? "account" : "domain"}
                    size={60}
                    style={[
                      styles.topThreeAvatarIcon,
                      activeTab === RankingTab.BUSINESSES && styles.businessAvatar,
                      activeTab === RankingTab.VETERINARIANS && styles.veterinarianAvatar,
                    ]}
                  />
                )}
                <Trophy size={24} color={colors.bronze} style={styles.medalIcon} />
              </View>
              <Text style={styles.topThreeName} numberOfLines={1}>
                {getCurrentData()[2].displayName}
              </Text>
              <Text style={styles.topThreeScore}>
                {getScoreText(getCurrentData()[2])}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Rest of the list */}
      <FlatList
        data={getCurrentData().slice(3)}
        renderItem={renderRankingCard}
        keyExtractor={item => item.uid}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmptyList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  tabBarWrapper: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tabBarContainer: {
    flexGrow: 0,
  },
  tabBarScrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.large,
    backgroundColor: colors.surfaceVariant + '20',
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  activeTab: {
    backgroundColor: colors.primaryLight + '30',
  },
  tabText: {
    fontSize: typography.body2.fontSize,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  businessTabText: {
    color: colors.warning,
  },
  veterinarianTabText: {
    color: colors.success,
  },
  list: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  rankingCard: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  topRankCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  businessCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  veterinarianCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  rankingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  avatarContainer: {
    marginRight: spacing.sm,
  },
  avatar: {
    backgroundColor: colors.primaryLight + '30',
  },
  avatarIcon: {
    backgroundColor: colors.primary,
  },
  businessAvatar: {
    backgroundColor: colors.warning,
  },
  veterinarianAvatar: {
    backgroundColor: colors.success,
  },
  nameContainer: {
    flex: 1,
  },
  userName: {
    fontSize: typography.subtitle1.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  userRole: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  scoreText: {
    marginLeft: spacing.xs,
    fontSize: typography.subtitle2.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyImage: {
    width: 100,
    height: 100,
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.text,
  },
  emptyText: {
    fontSize: typography.body1.fontSize,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  topThreeItem: {
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  firstPlace: {
    marginTop: -20,
  },
  secondPlace: {
    marginBottom: 10,
  },
  thirdPlace: {
    marginBottom: 10,
  },
  topThreeAvatarContainer: {
    position: 'relative',
    marginBottom: spacing.xs,
  },
  topThreeAvatar: {
    backgroundColor: colors.primaryLight + '30',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  topThreeAvatarIcon: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  medalIcon: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 2,
  },
  topThreeName: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
    maxWidth: 80,
    textAlign: 'center',
  },
  firstPlaceName: {
    fontSize: typography.body2.fontSize,
    maxWidth: 100,
  },
  topThreeScore: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  firstPlaceScore: {
    fontSize: typography.body2.fontSize,
    fontWeight: '600',
    color: colors.warning,
  },
}); 