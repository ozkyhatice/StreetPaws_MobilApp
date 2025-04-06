import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card } from './Card';
import { colors, typography } from '../config/theme';
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
        return '#FF9500';
      case 'MEDIUM':
        return '#FFD60A';
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
    <TouchableOpacity onPress={() => onPress(task)}>
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
            <Text style={styles.title}>{task.title}</Text>
            <Text style={styles.location}>{task.location.address}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>{task.priority}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>

        <View style={styles.footer}>
          <View style={[styles.statusBadge, getStatusBadgeStyle(task.status)]}>
            <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
          </View>

          <View style={styles.xpContainer}>
            <Icon name="star" size={16} color={colors.primary} />
            <Text style={styles.xpText}>{task.xpReward} XP</Text>
          </View>

          {task.deadline && (
            <View style={styles.deadlineContainer}>
              <Icon name="clock-outline" size={16} color={colors.textLight} />
              <Text style={styles.deadlineText}>
                {new Date(task.deadline).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {task.images && task.images.length > 0 && (
          <Image source={{ uri: task.images[0] }} style={styles.image} />
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  location: {
    ...typography.caption,
    color: colors.textLight,
  },
  description: {
    ...typography.body,
    color: colors.text,
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openBadge: {
    backgroundColor: colors.primary,
  },
  inProgressBadge: {
    backgroundColor: colors.warning,
  },
  completedBadge: {
    backgroundColor: colors.success,
  },
  cancelledBadge: {
    backgroundColor: colors.textLight,
  },
  statusText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineText: {
    ...typography.caption,
    color: colors.textLight,
    marginLeft: 4,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 12,
  },
}); 