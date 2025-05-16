import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Clock, CheckCircle } from 'lucide-react-native';
import { colors, spacing, typography } from '../config/theme';
import { Task } from '../types/task';
import { EmergencyRequest } from '../services/emergencyService';

type TaskSummaryCardsProps = {
  items: Array<{ type: 'task' | 'emergency'; data: Task | EmergencyRequest }>;
  onCompletedPress?: () => void;
  onAwaitingApprovalPress?: () => void;
};

export function TaskSummaryCards({ items, onCompletedPress, onAwaitingApprovalPress }: TaskSummaryCardsProps) {
  const awaitingApprovalCount = items.filter(item => 
    item.type === 'task' && (item.data as Task).status === 'AWAITING_APPROVAL'
  ).length;

  const completedCount = items.filter(item => 
    item.type === 'task' && (item.data as Task).status === 'COMPLETED'
  ).length;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onAwaitingApprovalPress} style={styles.cardWrapper}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryContent}>
              <View style={styles.summaryIconContainer}>
                <Clock size={24} color={colors.warning} />
              </View>
              <View>
                <Text style={styles.summaryTitle}>Onay Bekleyen</Text>
                <Text style={styles.summaryCount}>{awaitingApprovalCount}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      <TouchableOpacity onPress={onCompletedPress} style={styles.cardWrapper}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryContent}>
              <View style={[styles.summaryIconContainer, { backgroundColor: colors.success + '20' }]}>
                <CheckCircle size={24} color={colors.success} />
              </View>
              <View>
                <Text style={styles.summaryTitle}>Tamamlanan</Text>
                <Text style={styles.summaryCount}>{completedCount}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardWrapper: {
    flex: 1,
    marginHorizontal: spacing.xxs,
  },
  summaryCard: {
    elevation: 2,
    borderRadius: 12,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  summaryTitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
}); 