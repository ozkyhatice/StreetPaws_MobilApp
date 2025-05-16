import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, Image, Animated } from 'react-native';
import { Text, Chip, Surface, Card, Title, Paragraph, ActivityIndicator, Divider } from 'react-native-paper';
import { Badge, BADGES, BadgeCategory, BADGE_LEVELS, BadgeLevel } from '../types/badge';
import { BadgeItem } from './BadgeItem';
import { colors, typography, spacing, borderRadius, shadows } from '../config/theme';
import { BookOpen, X, Award, Shield, Trophy, Star, Heart, AlertCircle, Calendar, Home, Droplet, Trash2, Activity } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

// Fix Badge type to include earnedAt property and handle both string and number level types
interface BadgeWithProgress extends Omit<Badge, 'level'> {
  earnedAt?: string;
  level: BadgeLevel | number;
  currentCount?: number;
  maxCount?: number;
  progress?: number;
}

interface BadgeCollectionProps {
  badges: BadgeWithProgress[];
  loading?: boolean;
  showAllBadges?: boolean;
  onBadgePress?: (badge: BadgeWithProgress) => void;
}

export const BadgeCollection = ({
  badges = [],
  loading = false,
  showAllBadges = false,
  onBadgePress,
}: BadgeCollectionProps) => {
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithProgress | null>(null);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  // Process badges to remove duplicates (keep highest level for each badge id)
  const processedBadges = useMemo(() => {
    // Create a map to track highest level badge for each badge id
    const badgeMap = new Map();
    
    // Process user badges to keep only the highest level for each badge id
    badges.forEach(badge => {
      const baseId = badge.id.split('_').slice(0, -1).join('_'); // Remove level suffix
      
      if (!badgeMap.has(baseId) || 
          (badge.level && badgeMap.get(baseId).level < badge.level)) {
        badgeMap.set(baseId, badge);
      }
    });
    
    // Convert map back to array
    return Array.from(badgeMap.values());
  }, [badges]);
  
  // Group badges by category for better organization
  const badgesByCategory = useMemo(() => {
    const grouped: Record<string, Badge[]> = {};
    const allBadges = showAllBadges ? BADGES : processedBadges;
    
    // Initialize all categories with empty arrays
    grouped['GENERAL'] = [];
    grouped['CATEGORY_SPECIFIC'] = [];
    grouped['STREAK'] = [];
    grouped['EMERGENCY'] = [];
    grouped['SPECIAL'] = [];
    
    allBadges.forEach(badge => {
      if (!grouped[badge.category]) {
        grouped[badge.category] = [];
      }
      grouped[badge.category].push(badge);
    });
    
    return grouped;
  }, [showAllBadges, processedBadges]);
  
  // Apply filters
  const filteredBadges = useMemo(() => {
    let result = showAllBadges ? BADGES : processedBadges;
    
    if (filterLevel) {
      result = result.filter(badge => badge.level === filterLevel);
    }
    
    if (filterCategory) {
      result = result.filter(badge => badge.category === filterCategory);
    }
    
    return result;
  }, [showAllBadges, processedBadges, filterLevel, filterCategory]);
  
  const handleBadgePress = (badge: BadgeWithProgress) => {
    setSelectedBadge(badge);
    if (onBadgePress) {
      onBadgePress(badge);
    }
  };
  
  const closeModal = () => {
    setSelectedBadge(null);
  };
  
  const badgeLevels = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
  const badgeCategories = ['GENERAL', 'CATEGORY_SPECIFIC', 'STREAK', 'EMERGENCY', 'SPECIAL'];
  
  const getLevelColor = (level: string | number | undefined) => {
    if (!level) return colors.primary;
    
    // If level is a number, convert it to the corresponding BadgeLevel string
    if (typeof level === 'number') {
      switch(level) {
        case 1: return '#CD7F32'; // BRONZE
        case 2: return '#C0C0C0'; // SILVER
        case 3: return '#FFD700'; // GOLD
        case 4: return '#E5E4E2'; // PLATINUM
        case 5: return '#B9F2FF'; // DIAMOND
        default: return colors.primary;
      }
    }
    
    // If level is a string
    switch (level) {
      case 'BRONZE': return '#CD7F32';
      case 'SILVER': return '#C0C0C0';
      case 'GOLD': return '#FFD700';
      case 'PLATINUM': return '#E5E4E2';
      case 'DIAMOND': return '#B9F2FF';
      default: return colors.primary;
    }
  };
  
  // Helper function to get level display text
  const getLevelText = (level: string | number | undefined) => {
    if (!level) return '?';
    
    if (typeof level === 'number') {
      switch(level) {
        case 1: return 'B'; // BRONZE
        case 2: return 'S'; // SILVER
        case 3: return 'G'; // GOLD
        case 4: return 'P'; // PLATINUM
        case 5: return 'D'; // DIAMOND
        default: return '?';
      }
    }
    
    return level.charAt(0);
  };
  
  // Helper function to get full level name
  const getLevelName = (level: string | number | undefined) => {
    if (!level) return 'Unknown';
    
    if (typeof level === 'number') {
      switch(level) {
        case 1: return 'Bronze';
        case 2: return 'Silver';
        case 3: return 'Gold';
        case 4: return 'Platinum';
        case 5: return 'Diamond';
        default: return 'Unknown';
      }
    }
    
    return level.charAt(0) + level.slice(1).toLowerCase();
  };
  
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'GENERAL': return 'Genel';
      case 'CATEGORY_SPECIFIC': return 'Kategori';
      case 'STREAK': return 'Seri';
      case 'EMERGENCY': return 'Acil Durum';
      case 'SPECIAL': return 'Özel';
      default: return category;
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'GENERAL': return <Heart size={24} color={colors.primary} />;
      case 'CATEGORY_SPECIFIC': return <Home size={24} color="#4CAF50" />;
      case 'STREAK': return <Calendar size={24} color="#FF9800" />;
      case 'EMERGENCY': return <AlertCircle size={24} color="#F44336" />;
      case 'SPECIAL': return <Star size={24} color="#9C27B0" />;
      default: return <Award size={24} color={colors.primary} />;
    }
  };
  
  const getBadgeIcon = (badge: BadgeWithProgress) => {
    // Return specific icon based on badge category and iconName
    switch (badge.iconName) {
      case 'heart': return <Heart size={32} color={getLevelColor(badge.level)} />;
      case 'food': return <Droplet size={32} color={getLevelColor(badge.level)} />;
      case 'clean': return <Trash2 size={32} color={getLevelColor(badge.level)} />;
      case 'medical': return <Activity size={32} color={getLevelColor(badge.level)} />;
      case 'home': return <Home size={32} color={getLevelColor(badge.level)} />;
      case 'flame': return <Trophy size={32} color={getLevelColor(badge.level)} />;
      case 'alert': return <AlertCircle size={32} color={getLevelColor(badge.level)} />;
      default:
        // Default icons based on level type
        if (typeof badge.level === 'number') {
          switch (badge.level) {
            case 1: return <Shield size={32} color="#CD7F32" />; // BRONZE
            case 2: return <Shield size={32} color="#C0C0C0" />; // SILVER
            case 3: return <Trophy size={32} color="#FFD700" />; // GOLD
            case 4: return <Award size={32} color="#E5E4E2" />; // PLATINUM
            case 5: return <Star size={32} color="#B9F2FF" />; // DIAMOND
            default: return <Award size={32} color={colors.primary} />;
          }
        } else {
          // If level is a string
          switch (badge.level) {
            case 'BRONZE': return <Shield size={32} color="#CD7F32" />;
            case 'SILVER': return <Shield size={32} color="#C0C0C0" />;
            case 'GOLD': return <Trophy size={32} color="#FFD700" />;
            case 'PLATINUM': return <Award size={32} color="#E5E4E2" />;
            case 'DIAMOND': return <Star size={32} color="#B9F2FF" />;
            default: return <Award size={32} color={colors.primary} />;
          }
        }
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: spacing.md }}>Rozetler yükleniyor...</Text>
      </View>
    );
  }
  
  const renderBadgesByCategory = () => {
    return Object.entries(badgesByCategory).map(([category, categoryBadges], index) => {
      if (categoryBadges.length === 0) return null;
      
      // Skip if filtered by a different category
      if (filterCategory && category !== filterCategory) return null;
      
      return (
        <Animatable.View 
          key={category}
          animation="fadeInUp"
          delay={index * 100}
          duration={500}
          style={styles.categorySection}
        >
          <View style={styles.categoryHeader}>
            {getCategoryIcon(category)}
            <Text style={styles.categoryTitle}>{getCategoryName(category)}</Text>
            <Text style={styles.badgeCount}>{categoryBadges.length}</Text>
          </View>
          
          <View style={styles.badgesGrid}>
            {categoryBadges.map((badge: BadgeWithProgress, badgeIndex) => (
              <Animatable.View
                key={badge.id}
                animation="zoomIn"
                delay={300 + badgeIndex * 100}
                duration={400}
                style={styles.badgeWrapper}
              >
                <TouchableOpacity 
                  style={styles.badgeCard}
                  onPress={() => handleBadgePress(badge)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.badgeIconContainer, { backgroundColor: getLevelColor(badge.level) + '20' }]}>
                    {getBadgeIcon(badge)}
                  </View>
                  <Text style={styles.badgeName} numberOfLines={1}>{badge.name}</Text>
                  <View style={[styles.badgeLevelIndicator, { backgroundColor: getLevelColor(badge.level) }]}>
                    <Text style={styles.badgeLevelText}>
                      {getLevelText(badge.level)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animatable.View>
            ))}
          </View>
        </Animatable.View>
      );
    }).filter(Boolean);
  };
  
  return (
    <View style={styles.container}>
      {/* Filter by Level */}
      <Animatable.View 
        animation="fadeInDown"
        duration={600}
        style={styles.filterContainer}
      >
        <Text style={styles.filterTitle}>Rozet Seviyesi</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <Chip
            selected={filterLevel === null}
            onPress={() => setFilterLevel(null)}
            style={[styles.filterChip, { backgroundColor: filterLevel === null ? colors.primary + '30' : colors.surface }]}
            textStyle={{ color: filterLevel === null ? colors.primary : colors.textSecondary }}
          >
            Tümü
          </Chip>
          {badgeLevels.map((level) => (
            <Chip
              key={level}
              selected={filterLevel === level}
              onPress={() => setFilterLevel(filterLevel === level ? null : level)}
              style={[
                styles.filterChip, 
                { backgroundColor: filterLevel === level ? getLevelColor(level) + '30' : colors.surface }
              ]}
              textStyle={{ color: filterLevel === level ? getLevelColor(level) : colors.textSecondary }}
            >
              {getLevelName(level)}
            </Chip>
          ))}
        </ScrollView>
      </Animatable.View>
      
      {/* Filter by Category */}
      <Animatable.View 
        animation="fadeInDown"
        delay={200}
        duration={600}
        style={styles.filterContainer}
      >
        <Text style={styles.filterTitle}>Rozet Kategorisi</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <Chip
            selected={filterCategory === null}
            onPress={() => setFilterCategory(null)}
            style={[styles.filterChip, { backgroundColor: filterCategory === null ? colors.primary + '30' : colors.surface }]}
            textStyle={{ color: filterCategory === null ? colors.primary : colors.textSecondary }}
          >
            Tümü
          </Chip>
          {badgeCategories.map((category) => (
            <Chip
              key={category}
              selected={filterCategory === category}
              onPress={() => setFilterCategory(filterCategory === category ? null : category)}
              style={[
                styles.filterChip, 
                { backgroundColor: filterCategory === category ? colors.primary + '30' : colors.surface }
              ]}
              textStyle={{ color: filterCategory === category ? colors.primary : colors.textSecondary }}
              icon={() => getCategoryIcon(category)}
            >
              {getCategoryName(category)}
            </Chip>
          ))}
        </ScrollView>
      </Animatable.View>
      
      {filteredBadges.length === 0 ? (
        <Animatable.View 
          animation="fadeIn" 
          duration={800}
          style={styles.emptyContainer}
        >
          <Image 
            source={require('../assets/images/empty-badges.png')} 
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyText}>
            {showAllBadges 
              ? 'Seçilen filtrelere uygun rozet bulunamadı.'
              : 'Henüz rozet kazanmadınız. Görevleri tamamlayarak rozetler kazanabilirsiniz.'}
          </Text>
          {!showAllBadges && (
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('MainApp', { screen: 'Tasks' })}
            >
              <Text style={styles.emptyButtonText}>Görevlere Git</Text>
            </TouchableOpacity>
          )}
        </Animatable.View>
      ) : (
        <ScrollView style={styles.scrollContent}>
          {renderBadgesByCategory()}
        </ScrollView>
      )}
      
      <Modal
        visible={selectedBadge !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View
            animation="zoomIn"
            duration={300}
            style={styles.modalContentWrapper}
          >
            <Card style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
              
              {selectedBadge && (
                <View style={styles.badgeDetailContainer}>
                  <View style={[styles.badgeDetailIconContainer, { backgroundColor: getLevelColor(selectedBadge.level) + '30' }]}>
                    {getBadgeIcon(selectedBadge)}
                  </View>
                  
                  <Title style={styles.badgeDetailTitle}>{selectedBadge.name}</Title>
                  <Paragraph style={styles.badgeDetailDescription}>{selectedBadge.description}</Paragraph>
                  
                  <View style={styles.badgeInfoContainer}>
                    <View style={styles.badgeInfoItem}>
                      <Text style={styles.infoLabel}>Seviye:</Text>
                      <View style={[styles.levelBubble, { backgroundColor: getLevelColor(selectedBadge.level) }]}>
                        <Text style={styles.levelBubbleText}>
                          {getLevelName(selectedBadge.level)}
                        </Text>
                      </View>
                    </View>
                    
                    <Divider style={styles.divider} />
                    
                    <View style={styles.badgeInfoItem}>
                      <Text style={styles.infoLabel}>Kategori:</Text>
                      <View style={styles.categoryBubble}>
                        {getCategoryIcon(selectedBadge.category)}
                        <Text style={styles.categoryBubbleText}>
                          {getCategoryName(selectedBadge.category)}
                        </Text>
                      </View>
                    </View>
                    
                    <Divider style={styles.divider} />
                    
                    <View style={styles.badgeInfoItem}>
                      <Text style={styles.infoLabel}>XP Ödülü:</Text>
                      <View style={styles.xpBubble}>
                        <Star size={16} color="#FFD700" style={{ marginRight: 4 }} />
                        <Text style={styles.xpBubbleText}>
                          {selectedBadge.xpReward} XP
                        </Text>
                      </View>
                    </View>
                    
                    <Divider style={styles.divider} />
                    
                    <View style={styles.badgeInfoItem}>
                      <Text style={styles.infoLabel}>Gereksinim:</Text>
                      <Text style={styles.requirementText}>
                        {selectedBadge.requirement.type === 'TASK_COUNT' && `${selectedBadge.requirement.count} görev tamamla`}
                        {selectedBadge.requirement.type === 'CATEGORY_COUNT' && `${selectedBadge.requirement.count} ${selectedBadge.requirement.category?.toLowerCase()} görevi tamamla`}
                        {selectedBadge.requirement.type === 'STREAK_DAYS' && `${selectedBadge.requirement.count} gün üst üste görev tamamla`}
                        {selectedBadge.requirement.type === 'EMERGENCY_COUNT' && `${selectedBadge.requirement.count} acil durum görevi tamamla`}
                      </Text>
                    </View>
                    
                    {selectedBadge.earnedAt && (
                      <>
                        <Divider style={styles.divider} />
                        <View style={styles.badgeInfoItem}>
                          <Text style={styles.infoLabel}>Kazanıldı:</Text>
                          <Text style={styles.earnedAtText}>
                            {new Date(selectedBadge.earnedAt).toLocaleDateString('tr-TR')}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              )}
            </Card>
          </Animatable.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  badgeList: {
    padding: spacing.sm,
  },
  badgeItem: {
    width: '50%',
    padding: spacing.xxs,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: spacing.md,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: typography.body1.fontSize,
    lineHeight: typography.body1.lineHeight,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterContainer: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  filterTitle: {
    fontSize: typography.subtitle2.fontSize,
    fontWeight: '600',
    lineHeight: typography.subtitle2.lineHeight,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  filterScrollContent: {
    paddingVertical: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContentWrapper: {
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    padding: spacing.lg,
    borderRadius: borderRadius.medium,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
  },
  badgeDetailContainer: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  badgeDetailIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  badgeDetailIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    fontSize: 24,
  },
  badgeDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  badgeDetailDescription: {
    fontSize: typography.body1.fontSize,
    lineHeight: typography.body1.lineHeight,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  badgeInfoContainer: {
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.background,
  },
  badgeInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.body2.fontSize,
    lineHeight: typography.body2.lineHeight,
    color: colors.textSecondary,
  },
  levelBubble: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  levelBubbleText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  categoryBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  categoryBubbleText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  xpBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  xpBubbleText: {
    color: '#DAA520',
    fontWeight: 'bold',
    fontSize: 12,
  },
  requirementText: {
    fontSize: typography.body2.fontSize,
    lineHeight: typography.body2.lineHeight,
    color: colors.text,
  },
  earnedAtText: {
    fontSize: typography.body2.fontSize,
    lineHeight: typography.body2.lineHeight,
    color: colors.success,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  scrollContent: {
    flex: 1,
  },
  categorySection: {
    marginBottom: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
    flex: 1,
  },
  badgeCount: {
    backgroundColor: colors.primary + '20',
    color: colors.primary,
    fontWeight: 'bold',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
    fontSize: 12,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.sm,
  },
  badgeWrapper: {
    width: '33.33%',
    padding: spacing.xs,
  },
  badgeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.sm,
    alignItems: 'center',
    ...shadows.small,
    position: 'relative',
    aspectRatio: 0.9,
    justifyContent: 'center',
  },
  badgeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  badgeName: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  badgeLevelIndicator: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  badgeLevelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
}); 