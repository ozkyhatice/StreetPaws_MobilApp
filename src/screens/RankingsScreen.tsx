import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator
} from 'react-native';
import { Text, Card, Avatar, Button, Chip, Divider, SegmentedButtons } from 'react-native-paper';
import { colors, spacing, shadows, borderRadius, typography } from '../config/theme';
import { UserService } from '../services/userService';
import { User } from '../types/user';
import { Award, MapPin, Star, Trophy } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../hooks/useAuth';
import { calculateLevelFromXP, calculateXpForLevel, calculateXpForNextLevel, calculateLevelProgress } from '../utils/levelUtils';

type RankingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type SortBy = 'xp' | 'level' | 'tasksCompleted';

export default function RankingsScreen() {
  const { user: currentUser } = useAuth();
  const navigation = useNavigation<RankingsScreenNavigationProp>();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('xp');

  const userService = UserService.getInstance();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const allUsers = await userService.getAllUsers();
        
        // Filter out users without proper stats
        const validUsers = allUsers.filter(user => 
          user && user.uid && (
            (user.stats && (user.stats.xpPoints > 0 || user.stats.level > 0 || user.stats.tasksCompleted > 0)) || 
            user.xp > 0 || 
            (user.completedTasks && user.completedTasks.length > 0)
          )
        );
        
        setUsers(validUsers);
        sortUsers(validUsers, sortBy);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    sortUsers(users, sortBy);
  }, [sortBy]);

  const sortUsers = (userList: User[], sortType: SortBy) => {
    const sorted = [...userList];
    
    switch (sortType) {
      case 'xp':
        sorted.sort((a, b) => {
          const aXP = a.stats?.xpPoints || a.xp || 0;
          const bXP = b.stats?.xpPoints || b.xp || 0;
          return bXP - aXP;
        });
        break;
      case 'level':
        sorted.sort((a, b) => {
          const aLevel = a.stats?.level || 1;
          const bLevel = b.stats?.level || 1;
          return bLevel - aLevel;
        });
        break;
      case 'tasksCompleted':
        sorted.sort((a, b) => {
          const aTasks = a.stats?.tasksCompleted || (a.completedTasks ? a.completedTasks.length : 0);
          const bTasks = b.stats?.tasksCompleted || (b.completedTasks ? b.completedTasks.length : 0);
          return bTasks - aTasks;
        });
        break;
    }
    
    setFilteredUsers(sorted);
  };

  const getBadgeColor = (index: number) => {
    if (index === 0) return colors.gold;
    if (index === 1) return colors.silver;
    if (index === 2) return colors.bronze;
    return colors.textSecondary;
  };

  const getValueForSort = (user: User) => {
    switch (sortBy) {
      case 'xp':
        return user.stats?.xpPoints || user.xp || 0;
      case 'level':
        const xp = user.stats?.xpPoints || user.xp || 0;
        return calculateLevelFromXP(xp);
      case 'tasksCompleted':
        return user.stats?.tasksCompleted || (user.completedTasks ? user.completedTasks.length : 0);
      default:
        return 0;
    }
  };

  const getLabelForSort = () => {
    switch (sortBy) {
      case 'xp':
        return 'XP';
      case 'level':
        return 'Seviye';
      case 'tasksCompleted':
        return 'Görev';
      default:
        return '';
    }
  };

  const renderUserCard = ({ item, index }: { item: User; index: number }) => {
    const isCurrentUser = currentUser && item.uid === currentUser.uid;
    const xp = item.stats?.xpPoints || item.xp || 0;
    const calculatedLevel = calculateLevelFromXP(xp);
    
    return (
      <Card 
        style={[
          styles.card, 
          isCurrentUser && styles.currentUserCard,
          index < 3 && styles.topRankedCard
        ]}
        mode="elevated"
      >
        <View style={styles.rankBadge}>
          <View style={[styles.rankCircle, { backgroundColor: getBadgeColor(index) }]}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.userInfoRow}>
            <Avatar.Image 
              source={{ uri: item.photoURL || 'https://picsum.photos/200' }} 
              size={60} 
              style={styles.avatar}
            />
            
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.displayName || item.username || 'İsimsiz Gönüllü'}
                {isCurrentUser && ' (Sen)'}
              </Text>
              
              {item.bio && (
                <Text style={styles.userBio} numberOfLines={1}>
                  {item.bio}
                </Text>
              )}
              
              {item.city && (
                <View style={styles.locationContainer}>
                  <MapPin size={12} color={colors.textSecondary} />
                  <Text style={styles.locationText} numberOfLines={1}>{item.city}</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.statsSection}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Star size={16} color={colors.warning} />
                <Text style={styles.statText}>{Math.round(xp)} XP</Text>
              </View>
              
              <View style={styles.statItem}>
                <Award size={16} color={colors.primary} />
                <Text style={styles.statText}>Seviye {calculatedLevel}</Text>
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Trophy size={16} color={colors.secondary} />
                <Text style={styles.statText}>
                  {item.stats?.tasksCompleted || (item.completedTasks ? item.completedTasks.length : 0)} Görev
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.rankValueContainer}>
            <Text style={styles.rankValueText}>
              {getValueForSort(item)} {getLabelForSort()}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../assets/paw.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Gönüllü Bulunamadı</Text>
      <Text style={styles.emptyText}>
        Henüz sıralamada gösterilecek gönüllü yok.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Gönüllüler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Gönüllü Sıralaması</Text>
      </View>
      
      <View style={styles.sortContainer}>
        <SegmentedButtons
          value={sortBy}
          onValueChange={(value) => setSortBy(value as SortBy)}
          buttons={[
            { value: 'xp', label: 'XP' },
            { value: 'level', label: 'Seviye' },
            { value: 'tasksCompleted', label: 'Görevler' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      
      <FlatList
        data={filteredUsers}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmptyList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    color: colors.text,
    fontWeight: '700',
  },
  sortContainer: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
  },
  segmentedButtons: {
    backgroundColor: colors.surface,
  },
  list: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 80,
  },
  card: {
    marginBottom: spacing.md,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: colors.surface,
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  topRankedCard: {
    ...shadows.medium,
  },
  cardContent: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
    paddingBottom: spacing.xl,
    position: 'relative',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.primaryLight + '30',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingRight: 70,
  },
  userName: {
    fontSize: typography.subtitle1.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userBio: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  statsSection: {
    marginTop: spacing.sm,
    paddingRight: 70,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    marginBottom: spacing.xs,
  },
  statText: {
    fontSize: typography.caption.fontSize,
    color: colors.text,
    marginLeft: 4,
  },
  rankBadge: {
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textSecondary,
  },
  rankText: {
    color: 'white',
    fontSize: typography.subtitle2.fontSize,
    fontWeight: 'bold',
  },
  rankValueContainer: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    minWidth: 60,
    alignItems: 'center',
  },
  rankValueText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: typography.subtitle2.fontSize,
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
    marginBottom: spacing.lg,
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
}); 