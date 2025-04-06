import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { colors, typography } from '../config/theme';
import { XPActivity } from '../types/xp';

interface XPActivityCardProps {
  activity: XPActivity;
}

export const XPActivityCard = ({ activity }: XPActivityCardProps) => {
  const getActivityIcon = (type: XPActivity['type']) => {
    switch (type) {
      case 'TASK_COMPLETION':
        return '✅';
      case 'DONATION':
        return '💝';
      case 'EMERGENCY_HELP':
        return '🚨';
      case 'DAILY_LOGIN':
        return '📅';
      case 'ACHIEVEMENT':
        return '🏆';
      default:
        return '⭐';
    }
  };

  return (
    <Card variant="outlined" style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getActivityIcon(activity.type)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.description}>{activity.description}</Text>
        <Text style={styles.timestamp}>
          {new Date(activity.timestamp).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.xpContainer}>
        <Text style={styles.xpAmount}>+{activity.xpAmount}</Text>
        <Text style={styles.xpLabel}>XP</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  description: {
    ...typography.caption,
    color: colors.textLight,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: 4,
  },
  xpContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  xpAmount: {
    ...typography.h3,
    color: colors.primary,
  },
  xpLabel: {
    ...typography.caption,
    color: colors.textLight,
  },
}); 