import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Badge } from '../types/badge';
import { colors, typography, spacing, borderRadius, shadows } from '../config/theme';
import { Badge as PaperBadge, Surface, Card } from 'react-native-paper';
import { Star, Trophy, Shield, Award } from 'lucide-react-native';

interface BadgeItemProps {
  badge: Badge;
  onPress?: (badge: Badge) => void;
}

export const BadgeItem = ({ badge, onPress }: BadgeItemProps) => {
  const getBadgeIcon = () => {
    switch (badge.level) {
      case 'BRONZE':
        return <Shield size={32} color="#CD7F32" />;
      case 'SILVER':
        return <Shield size={32} color="#C0C0C0" />;
      case 'GOLD':
        return <Trophy size={32} color="#FFD700" />;
      case 'PLATINUM':
        return <Award size={32} color="#E5E4E2" />;
      case 'DIAMOND':
        return <Star size={32} color="#B9F2FF" />;
      default:
        return <Star size={32} color={colors.primary} />;
    }
  };

  const getLevelBackgroundColor = () => {
    switch (badge.level) {
      case 'BRONZE':
        return '#CD7F32';
      case 'SILVER':
        return '#C0C0C0';
      case 'GOLD':
        return '#FFD700';
      case 'PLATINUM':
        return '#E5E4E2';
      case 'DIAMOND':
        return '#B9F2FF';
      default:
        return colors.primary;
    }
  };

  const getBadgeEmoji = () => {
    if (badge.icon) {
      return (
        <Text style={styles.badgeIcon}>{badge.icon}</Text>
      );
    }
    return null;
  };

  const handlePress = () => {
    if (onPress) {
      onPress(badge);
    }
  };

  const isUnlocked = !!badge.unlockedAt;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={[styles.container, !isUnlocked && styles.lockedContainer]}>
        <Surface style={styles.badgeContent}>
          <View style={[styles.iconContainer, { backgroundColor: getLevelBackgroundColor() + '30' }]}>
            {isUnlocked ? getBadgeIcon() : <Shield size={32} color={colors.textDisabled} />}
            {isUnlocked && getBadgeEmoji()}
          </View>
          
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
                  isUnlocked && { backgroundColor: getLevelBackgroundColor() }
                ]}
              >
                {badge.level}
              </PaperBadge>
              
              {isUnlocked && badge.unlockedAt && (
                <Text style={styles.dateText}>
                  {new Date(badge.unlockedAt).toLocaleDateString('tr-TR')}
                </Text>
              )}
            </View>
          </View>
        </Surface>
        
        {!isUnlocked && (
          <View style={styles.lockedOverlay}>
            <Text style={styles.lockedText}>🔒</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    marginHorizontal: spacing.screenPadding,
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
  },
  badgeIcon: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    fontSize: 20,
  },
  badgeDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeName: {
    ...typography.subtitle1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
  lockedBadgeName: {
    ...typography.subtitle1,
    color: colors.textDisabled,
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
  badgeDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  lockedBadgeDescription: {
    ...typography.body2,
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
    ...typography.caption,
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
}); 