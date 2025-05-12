import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, ProgressBar, Surface, Badge, Divider, Avatar, IconButton } from 'react-native-paper';
import { colors, typography, spacing, borderRadius, shadows } from '../config/theme';
import { Award, CheckCircle, Flame, Star, AlertCircle, Medal, Lock } from 'lucide-react-native';
import { BADGES, Badge as BadgeType, BADGE_LEVELS, BadgeCategory } from '../types/badge';
import { BadgeService } from '../services/badgeService';
import { XPService } from '../services/xpService';
import { useAuth } from '../hooks/useAuth';

export function AchievementsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<BadgeCategory | 'ALL'>('ALL');
  
  useEffect(() => {
    if (user) {
      loadBadges();
    }
  }, [user]);
  
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
    }
  };
  
  const getCategoryLabel = (category: BadgeCategory): string => {
    switch (category) {
      case 'GENERAL': return 'Genel';
      case 'TASK_COMPLETION': return 'Görev Tamamlama';
      case 'CATEGORY_SPECIFIC': return 'Kategori Uzmanlığı';
      case 'STREAK': return 'Seriler';
      case 'EMERGENCY': return 'Acil Durumlar';
      case 'SPECIAL': return 'Özel';
      default: return '';
    }
  };
  
  const getCategoryIcon = (category: BadgeCategory) => {
    switch (category) {
      case 'GENERAL': return <CheckCircle size={18} color={colors.primary} />;
      case 'TASK_COMPLETION': return <CheckCircle size={18} color={colors.primary} />;
      case 'CATEGORY_SPECIFIC': return <Star size={18} color={colors.warning} />;
      case 'STREAK': return <Flame size={18} color="#FF9800" />;
      case 'EMERGENCY': return <AlertCircle size={18} color={colors.error} />;
      case 'SPECIAL': return <Medal size={18} color="#9C27B0" />;
      default: return <Award size={18} color={colors.primary} />;
    }
  };
  
  const getBadgeProgressItem = (badgeId: string) => {
    return badgeProgress.find(item => item.badgeId === badgeId);
  };
  
  const filterBadges = (badges: BadgeType[]) => {
    if (activeCategory === 'ALL') {
      return badges;
    }
    return badges.filter(badge => badge.category === activeCategory);
  };
  
  const renderEarnedBadge = (badge: any) => {
    const badgeLevel = BADGE_LEVELS[badge.level];
    
    return (
      <Card key={badge.id} style={styles.badgeCard}>
        <Card.Content>
          <View style={styles.badgeHeader}>
            <View style={[styles.badgeIcon, { backgroundColor: badgeLevel.color }]}>
              <Award size={24} color="#FFFFFF" />
            </View>
            <View style={styles.badgeInfo}>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeDescription}>{badge.description}</Text>
              <Text style={styles.badgeEarnedAt}>
                {new Date(badge.earnedAt).toLocaleDateString('tr-TR')} tarihinde kazanıldı
              </Text>
            </View>
          </View>
          <View style={styles.badgeFooter}>
            <Badge style={[styles.levelBadge, { backgroundColor: badgeLevel.color }]}>
              {badge.level}
            </Badge>
            <Text style={styles.xpReward}>+{badge.xpReward} XP</Text>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  const renderUnearnedBadge = (badge: BadgeType) => {
    const badgeLevel = BADGE_LEVELS[badge.level];
    const progress = getBadgeProgressItem(badge.id);
    
    return (
      <Card key={badge.id} style={[styles.badgeCard, styles.unearnedBadge]}>
        <Card.Content>
          <View style={styles.badgeHeader}>
            <View style={[styles.badgeIcon, { backgroundColor: colors.disabled }]}>
              <Lock size={24} color="#FFFFFF" />
            </View>
            <View style={styles.badgeInfo}>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeDescription}>{badge.description}</Text>
              {progress && (
                <View style={styles.progressContainer}>
                  <ProgressBar 
                    progress={progress.percentage / 100} 
                    color={badgeLevel.color} 
                    style={styles.progressBar} 
                  />
                  <Text style={styles.progressText}>
                    {progress.currentCount}/{progress.requiredCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.badgeFooter}>
            <Badge style={[styles.levelBadge, { backgroundColor: badgeLevel.color }]}>
              {badge.level}
            </Badge>
            <Text style={styles.xpReward}>+{badge.xpReward} XP</Text>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  const renderCategoryFilter = () => {
    const categories: Array<BadgeCategory | 'ALL'> = ['ALL', 'GENERAL', 'CATEGORY_SPECIFIC', 'STREAK', 'EMERGENCY', 'SPECIAL'];
    
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
              activeCategory === category && styles.activeCategory
            ]}
            onPress={() => setActiveCategory(category)}
          >
            {category !== 'ALL' && (
              <View style={styles.categoryIcon}>
                {getCategoryIcon(category)}
              </View>
            )}
            <Text style={[
              styles.categoryText,
              activeCategory === category && styles.activeCategoryText
            ]}>
              {category === 'ALL' ? 'Tümü' : getCategoryLabel(category)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };
  
  // Tüm rozetleri bul
  const allBadges = BADGES;
  const earnedBadgeIds = userBadges.map(badge => badge.id);
  const unearnedBadges = allBadges.filter(badge => !earnedBadgeIds.includes(badge.id));
  
  // Filtreleme
  const filteredEarnedBadges = filterBadges(userBadges);
  const filteredUnearnedBadges = filterBadges(unearnedBadges);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Başarılar</Text>
        <IconButton
          icon={() => <CheckCircle size={24} color={colors.primary} />}
          onPress={loadBadges}
          size={24}
        />
      </View>
      
      {renderCategoryFilter()}
      
      <ScrollView style={styles.content}>
        {filteredEarnedBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kazanılan Rozetler</Text>
            {filteredEarnedBadges.map(badge => renderEarnedBadge(badge))}
          </View>
        )}
        
        {filteredUnearnedBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kilidini Aç</Text>
            {filteredUnearnedBadges.map(badge => renderUnearnedBadge(badge))}
          </View>
        )}
        
        {filteredEarnedBadges.length === 0 && filteredUnearnedBadges.length === 0 && (
          <View style={styles.emptyContainer}>
            <Award size={60} color={colors.disabled} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>Bu kategoride rozet bulunamadı</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  badgeCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  unearnedBadge: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    opacity: 0.8,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    ...typography.subtitle1,
    color: colors.text,
    fontWeight: 'bold',
  },
  badgeDescription: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  badgeEarnedAt: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  progressContainer: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: borderRadius.pill,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    minWidth: 40,
  },
  badgeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  levelBadge: {
    borderRadius: borderRadius.small,
  },
  xpReward: {
    ...typography.caption,
    color: colors.success,
    fontWeight: 'bold',
  },
  categoryFilters: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeCategory: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryIcon: {
    marginRight: spacing.xs,
  },
  categoryText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  activeCategoryText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
}); 