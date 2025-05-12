import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, Divider } from 'react-native-paper';
import { TaskService } from '../services/taskService';
import { Task, EmergencyLevel } from '../types/task';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import { AlertCircle, Clock } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface EmergencyTaskListProps {
  navigation: any;
}

export function EmergencyTaskList({ navigation }: EmergencyTaskListProps) {
  const [emergencyTasks, setEmergencyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    loadEmergencyTasks();
  }, []);
  
  const loadEmergencyTasks = async () => {
    try {
      setLoading(true);
      const taskService = TaskService.getInstance();
      if (typeof taskService.getEmergencyTasks === 'function') {
        const tasks = await taskService.getEmergencyTasks();
        setEmergencyTasks(tasks);
      } else {
        console.error('getEmergencyTasks method does not exist on TaskService');
        setEmergencyTasks([]);
      }
    } catch (error) {
      console.error('Error loading emergency tasks:', error);
      setEmergencyTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadEmergencyTasks();
  };
  
  const handleTaskPress = (task: Task) => {
    if (!task || !task.id) {
      console.error("EmergencyTaskList - Invalid task or missing ID:", task);
      return;
    }
    
    const taskId = task.id.toString(); // ID'yi string olarak aldığından emin ol
    console.log("EmergencyTaskList - Navigating to TaskDetail with ID:", taskId);
    console.log("EmergencyTaskList - Task object:", JSON.stringify(task));
    
    // Parametreler doğru bir şekilde geçirilsin
    navigation.navigate('TaskDetail', { 
      taskId: taskId 
    });
  };
  
  const getEmergencyLevelColor = (level: EmergencyLevel) => {
    switch (level) {
      case 'CRITICAL': return colors.error;
      case 'URGENT': return colors.warning;
      default: return colors.info;
    }
  };
  
  const getEmergencyLevelText = (level: EmergencyLevel) => {
    switch (level) {
      case 'CRITICAL': return 'KRİTİK';
      case 'URGENT': return 'ACİL';
      default: return 'NORMAL';
    }
  };
  
  const renderEmergencyTask = ({ item }: { item: Task }) => {
    const emergencyLevel = item.emergencyLevel || 'NORMAL';
    const levelColor = getEmergencyLevelColor(emergencyLevel);
    const timeAgo = formatDistanceToNow(new Date(item.createdAt), { 
      addSuffix: true,
      locale: tr 
    });
    
    return (
      <Card 
        style={styles.card} 
        onPress={() => handleTaskPress(item)}
      >
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Chip 
                style={[styles.chipLevel, { backgroundColor: levelColor }]} 
                textStyle={styles.chipText}
              >
                {getEmergencyLevelText(emergencyLevel)}
              </Chip>
            </View>
          </View>
          
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
          
          <Divider style={styles.divider} />
          
          <View style={styles.footer}>
            <View style={styles.infoRow}>
              <AlertCircle size={16} color={levelColor} />
              <Text style={styles.infoText}>
                {item.xpReward + (emergencyLevel === 'URGENT' ? 100 : emergencyLevel === 'CRITICAL' ? 200 : 0)} XP Ödül
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Clock size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{timeAgo}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <AlertCircle size={60} color={colors.textSecondary} style={styles.emptyIcon} />
      <Text style={styles.emptyText}>Şu anda acil durum bulunmuyor</Text>
    </View>
  );
  
  return (
    <FlatList
      data={emergencyTasks}
      renderItem={renderEmergencyTask}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          colors={[colors.primary]}
        />
      }
      ListEmptyComponent={renderEmptyList}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: 100, // Extra padding for FAB
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.subtitle1,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  description: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chipLevel: {
    borderRadius: borderRadius.small,
    marginLeft: spacing.sm,
  },
  chipText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
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