import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card } from './Card';
import { colors, typography, spacing, borderRadius, shadows } from '../config/theme';
import { Task } from '../types/task';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
}

export const TaskCard = ({ task, onPress }: TaskCardProps) => {
  const getCategoryIcon = (category: Task['category']) => {
    switch (category) {
      case 'FEEDING':
        return 'food';
      case 'CLEANING':
        return 'broom';
      case 'HEALTH':
        return 'medical-bag';
      case 'SHELTER':
        return 'home';
      default:
        return 'help-circle';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT':
        return colors.error;
      case 'HIGH':
        return colors.secondary;
      case 'MEDIUM':
        return colors.warning;
      case 'LOW':
        return colors.success;
      default:
        return colors.text;
    }
  };

  const getStatusBadgeStyle = (status: Task['status']) => {
    switch (status) {
      case 'OPEN':
        return styles.openBadge;
      case 'IN_PROGRESS':
        return styles.inProgressBadge;
      case 'COMPLETED':
        return styles.completedBadge;
      case 'CANCELLED':
        return styles.cancelledBadge;
      default:
        return {};
    }
  };

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'OPEN':
        return 'Açık';
      case 'IN_PROGRESS':
        return 'Devam Ediyor';
      case 'COMPLETED':
        return 'Tamamlandı';
      case 'CANCELLED':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  return (
    <TouchableOpacity 
      onPress={() => onPress(task)}
      activeOpacity={0.7}
    >
      <Card style={styles.container}>
        <View style={styles.header}>
          <View style={styles.categoryIcon}>
            <Icon
              name={getCategoryIcon(task.category)}
              size={24}
              color={colors.primary}
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{task.title}</Text>
            <Text style={styles.location} numberOfLines={1} ellipsizeMode="tail">{task.location.address}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>{task.priority}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>

        <View style={styles.footer}>
          <View style={[styles.statusBadge, getStatusBadgeStyle(task.status)]}>
            <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
          </View>

          <View style={styles.metadataContainer}>
            <View style={styles.xpContainer}>
              <Icon name="star" size={16} color={colors.primary} />
              <Text style={styles.xpText}>{task.xpReward} XP</Text>
            </View>

            {task.deadline && (
              <View style={styles.deadlineContainer}>
                <Icon name="clock-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.deadlineText}>
                  {new Date(task.deadline).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {task.images && task.images.length > 0 && (
          <Image 
            source={{ uri: task.images[0] }} 
            style={styles.image}
            resizeMode="cover"
          />
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
    ...shadows.small,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.xs,
  },
  title: {
    ...typography.subtitle1,
    color: colors.text,
  },
  location: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  description: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.small,
  },
  priorityText: {
    ...typography.caption,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.small,
  },
  openBadge: {
    backgroundColor: colors.primary + '20',
  },
  inProgressBadge: {
    backgroundColor: colors.warning + '20',
  },
  completedBadge: {
    backgroundColor: colors.success + '20',
  },
  cancelledBadge: {
    backgroundColor: colors.textDisabled + '20',
  },
  statusText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  xpText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xxs,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xxs,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.xs,
    marginTop: spacing.sm,
  },
}); 