import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Badge, BadgeLevel } from '../types/badge';
import { colors, typography, spacing, borderRadius, shadows } from '../config/theme';
import { Badge as PaperBadge, Surface, Card, ProgressBar } from 'react-native-paper';
import { Star, Trophy, Shield, Award, Heart, AlertCircle, Calendar, Home, Droplet, Trash2, Activity } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';

interface BadgeItemProps {
  badge: Badge & {
    earnedAt?: string;
    level?: BadgeLevel;
    currentCount?: number;
    maxCount?: number;
    progress?: number;
  };
  onPress?: (badge: Badge) => void;
}

export const BadgeItem = ({ badge, onPress }: BadgeItemProps) => {
  const getBadgeIcon = () => {
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
        // Default icons based on level
        switch (badge.level) {
          case 'BRONZE': return <Shield size={32} color="#CD7F32" />;
          case 'SILVER': return <Shield size={32} color="#C0C0C0" />;
          case 'GOLD': return <Trophy size={32} color="#FFD700" />;
          case 'PLATINUM': return <Award size={32} color="#E5E4E2" />;
          case 'DIAMOND': return <Star size={32} color="#B9F2FF" />;
          default: return <Award size={32} color={colors.primary} />;
        }
    }
  };

  const getLevelColor = (level?: BadgeLevel) => {
    if (!level) return colors.primary;
    
    switch (level) {
      case 'BRONZE': return '#CD7F32';
      case 'SILVER': return '#C0C0C0';
      case 'GOLD': return '#FFD700';
      case 'PLATINUM': return '#E5E4E2';
      case 'DIAMOND': return '#B9F2FF';
      default: return colors.primary;
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(badge);
    }
  };

  const isUnlocked = !!badge.earnedAt;
  const badgeLevel = badge.level || 'BRONZE';
  const progress = badge.progress ? badge.progress / 100 : 0;

  return (
    <Animatable.View 
      animation="fadeIn" 
      duration={500}
      useNativeDriver
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Card style={[styles.container, !isUnlocked && styles.lockedContainer]}>
          <Surface style={styles.badgeContent}>
            <Animatable.View 
              animation={isUnlocked ? "pulse" : undefined}
              iterationCount="infinite"
              duration={2000}
              useNativeDriver
              style={[
                styles.iconContainer, 
                { backgroundColor: getLevelColor(badgeLevel) + '30' }
              ]}
            >
              {isUnlocked ? getBadgeIcon() : <Shield size={32} color={colors.textDisabled} />}
              
              {/* Badge Level */}
              {isUnlocked && (
                <View style={styles.badgeLevelIndicator}>
                  <Text style={styles.badgeLevelText}>{badge.level?.charAt(0)}</Text>
                </View>
              )}
            </Animatable.View>
            
            <View style={styles.badgeDetails}>
              <Text style={isUnlocked ? styles.badgeName : styles.lockedBadgeName}>
                {badge.name}
              </Text>
              <Text style={isUnlocked ? styles.badgeDescription : styles.lockedBadgeDescription} numberOfLines={2}>
                {badge.description}
              </Text>
              
              <View style={styles.levelContainer}>
                <PaperBadge
                  style={[
                    styles.levelBadge, 
                    isUnlocked && { backgroundColor: getLevelColor(badgeLevel) }
                  ]}
                >
                  {badgeLevel}
                </PaperBadge>
                
                {isUnlocked && badge.earnedAt && (
                  <Text style={styles.dateText}>
                    {new Date(badge.earnedAt).toLocaleDateString('tr-TR')}
                  </Text>
                )}
              </View>
              
              {/* Badge Progress Bar */}
              {isUnlocked && (
                <View style={styles.progressContainer}>
                  <ProgressBar 
                    progress={progress} 
                    color={getLevelColor(badgeLevel)} 
                    style={styles.progressBar}
                  />
                  {badge.currentCount !== undefined && badge.maxCount !== undefined && (
                    <Text style={styles.progressText}>
                      {badge.currentCount}/{badge.maxCount}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </Surface>
          
          {!isUnlocked && (
            <View style={styles.lockedOverlay}>
              <Text style={styles.lockedText}>🔒</Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
    ...shadows.small,
  },
  lockedContainer: {
    opacity: 0.7,
    backgroundColor: colors.surface + '70',
  },
  badgeContent: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    position: 'relative',
  },
  badgeIcon: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    fontSize: 20,
  },
  badgeLevelIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeLevelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  badgeDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  lockedBadgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDisabled,
    marginBottom: spacing.xxs,
  },
  badgeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  lockedBadgeDescription: {
    fontSize: 14,
    color: colors.textDisabled,
    marginBottom: spacing.sm,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    backgroundColor: colors.textDisabled,
  },
  dateText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: spacing.sm,
  },
  lockedText: {
    fontSize: 14,
  },
  progressContainer: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  }
}); 