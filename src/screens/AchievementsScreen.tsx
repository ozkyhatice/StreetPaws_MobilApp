import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Animated, RefreshControl } from 'react-native';
import { Text, Surface, Badge, ProgressBar, Divider, Chip, Button } from 'react-native-paper';
import { colors } from '../config/theme';
import { Award, CheckCircle, Flame, Star, AlertCircle, Medal, Heart, Home, ArrowUp, Filter, ChevronDown } from 'lucide-react-native';
import { BADGES, Badge as BadgeType, BADGE_LEVELS, BadgeCategory } from '../types/badge';
import { BadgeService } from '../services/badgeService';
import { useAuth } from '../hooks/useAuth';

export function AchievementsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<BadgeCategory | 'ALL'>('ALL');
  const [activeLevelFilter, setActiveLevelFilter] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState<'recent' | 'progress'>('recent');
  const [stats, setStats] = useState({ earned: 0, total: 0, percentage: 0 });
  
  // Animation value for filter panel
  const filterHeight = new Animated.Value(0);
  
  useEffect(() => {
    if (user) {
      loadBadges();
    }
  }, [user]);
  
  useEffect(() => {
    // Calculate badge statistics
    if (userBadges.length > 0) {
      const earned = userBadges.length;
      const total = BADGES.length;
      const percentage = Math.round((earned / total) * 100);
      setStats({ earned, total, percentage });
    }
  }, [userBadges]);
  
  // Toggle filter panel with animation
  useEffect(() => {
    Animated.timing(filterHeight, {
      toValue: showFilters ? 180 : 0,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [showFilters]);
  
  const loadBadges = async () => {
    try {
      setLoading(true);
      const badgeService = BadgeService.getInstance();
      
      const badges = await badgeService.getUserBadges(user?.uid || '');
      const progress = await badgeService.getBadgeProgress(user?.uid || '');
      
      setUserBadges(badges);
      setBadgeProgress(progress);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadBadges();
  };
  
  // Helper functions
  const getCategoryLabel = (category: BadgeCategory): string => {
    switch (category) {
      case 'GENERAL': return 'Genel';
      case 'TASK_COMPLETION': return 'Görev Tamamlama';
      case 'CATEGORY_SPECIFIC': return 'Kategori';
      case 'STREAK': return 'Seri';
      case 'EMERGENCY': return 'Acil Durum';
      case 'SPECIAL': return 'Özel';
      default: return '';
    }
  };
  
  const getCategoryIcon = (category: BadgeCategory) => {
    switch (category) {
      case 'GENERAL': return <Heart size={18} color={colors.primary} />;
      case 'TASK_COMPLETION': return <CheckCircle size={18} color={colors.primary} />;
      case 'CATEGORY_SPECIFIC': return <Home size={18} color={colors.primary} />;
      case 'STREAK': return <Flame size={18} color={colors.primary} />;
      case 'EMERGENCY': return <AlertCircle size={18} color={colors.error} />;
      case 'SPECIAL': return <Medal size={18} color={colors.primary} />;
      default: return <Award size={18} color={colors.primary} />;
    }
  };
  
  const getBadgeProgressItem = (badgeId: string) => {
    return badgeProgress.find(item => item.badgeId === badgeId);
  };
  
  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'BRONZE': return '#CD7F32';
      case 'SILVER': return '#C0C0C0';
      case 'GOLD': return '#FFD700';
      case 'PLATINUM': return '#E5E4E2';
      default: return colors.primary;
    }
  };
  
  // Get category counts
  const getCategoryCounts = () => {
    const counts: Record<string, number> = { ALL: userBadges.length };
    
    userBadges.forEach(badge => {
      if (!counts[badge.category]) {
        counts[badge.category] = 0;
      }
      counts[badge.category]++;
    });
    
    return counts;
  };
  
  const categoryCounts = getCategoryCounts();
  
  // Filtering and sorting
  const filterBadges = (badges: any[]) => {
    return badges.filter(badge => 
      (activeCategory === 'ALL' || badge.category === activeCategory) &&
      (activeLevelFilter === 'ALL' || badge.level === activeLevelFilter)
    );
  };
  
  const sortBadges = (badges: any[]) => {
    if (sortOption === 'recent') {
      return [...badges].sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());
    } else {
      // Sort by progress (for unearned badges)
      return [...badges].sort((a, b) => {
        const progressA = getBadgeProgressItem(a.id);
        const progressB = getBadgeProgressItem(b.id);
        const percentA = progressA?.percentage || 0;
        const percentB = progressB?.percentage || 0;
        return percentB - percentA;
      });
    }
  };
  
  const filteredEarnedBadges = sortBadges(filterBadges(userBadges));
  const filteredUnearnedBadges = sortBadges(filterBadges(
    BADGES.filter(badge => !userBadges.some(earned => earned.id === badge.id))
  ));
  
  // Render functions
  const renderBadgeItem = (badge: any, earned: boolean = false, index: number) => {
    const progress = getBadgeProgressItem(badge.id);
    const badgeColor = earned ? getBadgeColor(badge.level) : '#E0E0E0';
    const IconComponent = getCategoryIcon(badge.category);
    
    // Create a truly unique key combining id, earned status and index
    const uniqueKey = `${badge.id}_${earned ? 'earned' : 'unearned'}_${index}`;
    
    return (
      <TouchableOpacity 
        key={uniqueKey}
        style={styles.badgeItem}
        onPress={() => navigation.navigate('BadgeDetail', { badge, earned, progress })}
      >
        <View style={[styles.badgeIconContainer, { backgroundColor: badgeColor + '15' }]}>
          {earned ? (
            <Award size={28} color={badgeColor} />
          ) : (
            React.cloneElement(IconComponent, { size: 28, color: badgeColor })
          )}
          {earned && (
            <Badge style={[styles.badgeLevelIndicator, { backgroundColor: badgeColor }]}>
              {badge.level === 'BRONZE' ? 'B' : badge.level === 'SILVER' ? 'S' : 'G'}
            </Badge>
          )}
        </View>
        <Text style={styles.badgeName}>{badge.name}</Text>
        <Text style={styles.badgeDescription} numberOfLines={2}>{badge.description}</Text>
        {!earned && progress && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { 
                width: `${Math.min(100, progress.percentage)}%`,
                backgroundColor: getBadgeColor(badge.level) 
              }]} />
            </View>
            <Text style={styles.progressText}>{progress.percentage}%</Text>
          </View>
        )}
        {earned && (
          <Text style={styles.earnedDate}>
            {new Date(badge.earnedAt).toLocaleDateString('tr-TR')}
          </Text>
        )}
      </TouchableOpacity>
    );
  };
  
  const renderLevelFilter = () => {
    const levels = ['ALL', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.levelFilters}
      >
        {levels.map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.levelChip,
              activeLevelFilter === level && styles.activeLevelChip
            ]}
            onPress={() => setActiveLevelFilter(level)}
          >
            <Text style={[
              styles.levelChipText,
              activeLevelFilter === level && styles.activeLevelChipText
            ]}>
              {level === 'ALL' ? 'Tümü' : level.charAt(0) + level.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };
  
  const renderCategoryFilter = () => {
    const categories: Array<BadgeCategory | 'ALL'> = ['ALL', 'GENERAL', 'CATEGORY_SPECIFIC', 'STREAK', 'EMERGENCY'];
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryFilters}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              activeCategory === category && styles.activeCategoryChip
            ]}
            onPress={() => setActiveCategory(category as BadgeCategory | 'ALL')}
          >
            {category !== 'ALL' && (
              <View style={styles.categoryIcon}>
                {getCategoryIcon(category as BadgeCategory)}
              </View>
            )}
            <Text style={[
              styles.categoryChipText,
              activeCategory === category && styles.activeCategoryChipText
            ]}>
              {category === 'ALL' ? 'Tümü' : getCategoryLabel(category as BadgeCategory)}
            </Text>
            {categoryCounts[category] > 0 && (
              <View style={styles.countBadge}><Text style={styles.countText}>{categoryCounts[category] || 0}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Render the filter panel
  const renderFilterPanel = () => {
    return (
      <Animated.View style={[styles.filterPanel, { height: filterHeight }]}>
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Seviye</Text>
          <View style={styles.chipGroup}>
            {['ALL', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map(level => (
              <Chip
                key={level}
                selected={activeLevelFilter === level}
                onPress={() => setActiveLevelFilter(level)}
                style={styles.filterChip}
                textStyle={activeLevelFilter === level ? styles.activeChipText : styles.chipText}
              >
                {level === 'ALL' ? 'Tümü' : level.charAt(0) + level.slice(1).toLowerCase()}
              </Chip>
            ))}
          </View>
        </View>
        
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Sıralama</Text>
          <View style={styles.chipGroup}>
            <Chip
              selected={sortOption === 'recent'}
              onPress={() => setSortOption('recent')}
              style={styles.filterChip}
              textStyle={sortOption === 'recent' ? styles.activeChipText : styles.chipText}
            >
              Son Kazanılanlar
            </Chip>
            <Chip
              selected={sortOption === 'progress'}
              onPress={() => setSortOption('progress')}
              style={styles.filterChip}
              textStyle={sortOption === 'progress' ? styles.activeChipText : styles.chipText}
            >
              İlerleme
            </Chip>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Rozetlerim</Text>
          <Text style={styles.subtitle}>
            {stats.earned} / {stats.total} rozet kazanıldı ({stats.percentage}%)
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={22} color={colors.primary} />
          <Text style={styles.filterButtonText}>Filtrele</Text>
          <ChevronDown size={16} color={colors.primary} style={showFilters ? styles.filterButtonIconRotated : styles.filterButtonIcon} />
        </TouchableOpacity>
      </View>
      
      {renderFilterPanel()}
      
      <View style={styles.categoryTabs}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsContent}
        >
          {['ALL', 'GENERAL', 'TASK_COMPLETION', 'CATEGORY_SPECIFIC', 'STREAK', 'EMERGENCY'].map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                activeCategory === category && styles.activeCategoryTab
              ]}
              onPress={() => setActiveCategory(category as BadgeCategory | 'ALL')}
            >
              <Text style={[
                styles.categoryTabText,
                activeCategory === category && styles.activeCategoryTabText
              ]}>
                {category === 'ALL' ? 'Tümü' : getCategoryLabel(category as BadgeCategory)}
              </Text>
              {categoryCounts[category] > 0 && (
                <Badge style={styles.categoryCount}>{categoryCounts[category] || 0}</Badge>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        scrollEventThrottle={16}
      >
        <View style={styles.progressSummary}>
          <Text style={styles.progressTitle}>Toplam İlerleme</Text>
          <ProgressBar
            progress={stats.percentage / 100}
            color={colors.primary}
            style={styles.overallProgress}
          />
          <Text style={styles.progressPercentage}>{stats.percentage}%</Text>
        </View>
        
        {filteredEarnedBadges.length > 0 && (
          <View style={styles.badgesSection}>
            <Text style={styles.sectionTitle}>Kazanılan Rozetler ({filteredEarnedBadges.length})</Text>
            <View style={styles.badgesGrid}>
              {filteredEarnedBadges.map((badge, index) => renderBadgeItem(badge, true, index))}
            </View>
          </View>
        )}
        
        {filteredUnearnedBadges.length > 0 && (
          <View style={styles.badgesSection}>
            <Text style={styles.sectionTitle}>Kilitli Rozetler ({filteredUnearnedBadges.length})</Text>
            <View style={styles.badgesGrid}>
              {filteredUnearnedBadges.map((badge, index) => renderBadgeItem(badge, false, index))}
            </View>
          </View>
        )}
        
        {filteredEarnedBadges.length === 0 && filteredUnearnedBadges.length === 0 && (
          <View style={styles.emptyState}>
            <Award size={64} color="#D1D1D6" />
            <Text style={styles.emptyStateText}>Bu filtre kriterlerine uygun rozet bulunamadı.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginHorizontal: 6,
  },
  filterButtonIcon: {
    transform: [{ rotate: '0deg' }],
  },
  filterButtonIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  filterPanel: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    margin: 4,
  },
  chipText: {
    fontSize: 14,
  },
  activeChipText: {
    color: colors.primary,
    fontWeight: '600',
  },
  categoryTabs: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  categoryTabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeCategoryTab: {
    backgroundColor: colors.primaryLight,
  },
  activeCategoryTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  categoryCount: {
    marginLeft: 6,
    backgroundColor: colors.primary,
    color: 'white',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  levelFilters: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
  },
  levelChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  activeLevelChip: {
    backgroundColor: colors.primaryLight,
  },
  levelChipText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeLevelChipText: {
    color: colors.primary,
    fontWeight: '600',
  },
  categoryFilters: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  activeCategoryChip: {
    backgroundColor: colors.primaryLight,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeCategoryChipText: {
    color: colors.primary,
    fontWeight: '600',
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  countText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  sortOptions: {
    marginTop: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  sortButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 12,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  progressSummary: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  overallProgress: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  progressPercentage: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  badgesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  badgeItem: {
    width: '50%',
    padding: 8,
    marginBottom: 8,
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    alignSelf: 'center',
  },
  badgeLevelIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#EBEBEB',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  earnedDate: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
  },
});