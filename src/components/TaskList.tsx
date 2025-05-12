import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, Divider, Badge } from 'react-native-paper';
import { Task, TaskFilter, TaskStatus, TaskCategory } from '../types/task';
import { TaskService } from '../services/taskService';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import { MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface TaskListProps {
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  navigation: any;
}

export function TaskList({ filter, onFilterChange, navigation }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    loadTasks();
  }, [filter]);
  
  const loadTasks = async () => {
    try {
      setLoading(true);
      const taskService = TaskService.getInstance();
      const loadedTasks = await taskService.getTasks(filter);
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };
  
  const handleTaskPress = (task: Task) => {
    if (!task || !task.id) {
      console.error("TaskList - Invalid task or missing ID:", task);
      return;
    }
    
    const taskId = task.id.toString(); // ID'yi string olarak aldığından emin ol
    console.log("TaskList - Navigating to TaskDetail with ID:", taskId);
    console.log("TaskList - Task object:", JSON.stringify(task));
    
    // Parametreler doğru bir şekilde geçirilsin
    navigation.navigate('TaskDetail', { 
      taskId: taskId 
    });
  };
  
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED': return colors.success;
      case 'IN_PROGRESS': return colors.info;
      case 'OPEN': return colors.primary;
      case 'CANCELLED': return colors.textSecondary;
      case 'AWAITING_APPROVAL': return colors.warning;
      default: return colors.primary;
    }
  };
  
  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED': return 'Tamamlandı';
      case 'IN_PROGRESS': return 'Devam Ediyor';
      case 'OPEN': return 'Açık';
      case 'CANCELLED': return 'İptal Edildi';
      case 'AWAITING_APPROVAL': return 'Onay Bekliyor';
      default: return status;
    }
  };
  
  const getCategoryColor = (category: TaskCategory) => {
    switch (category) {
      case 'FEEDING': return '#4CAF50';
      case 'CLEANING': return '#2196F3';
      case 'HEALTH': return '#F44336';
      case 'SHELTER': return '#FF9800';
      case 'OTHER': return '#9C27B0';
      default: return colors.primary;
    }
  };
  
  const getCategoryLabel = (category: TaskCategory) => {
    switch (category) {
      case 'FEEDING': return 'Besleme';
      case 'CLEANING': return 'Temizlik';
      case 'HEALTH': return 'Sağlık';
      case 'SHELTER': return 'Barınak';
      case 'OTHER': return 'Diğer';
      default: return category;
    }
  };
  
  const renderTask = ({ item }: { item: Task }) => {
    const statusColor = getStatusColor(item.status);
    const categoryColor = getCategoryColor(item.category);
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
                style={[styles.chipCategory, { backgroundColor: categoryColor + '20' }]} 
                textStyle={[styles.chipText, { color: categoryColor }]}
              >
                {getCategoryLabel(item.category)}
              </Chip>
            </View>
          </View>
          
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.locationRow}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={styles.locationText}>
              {typeof item.location === 'object' ? item.location.address : item.location}
            </Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.footer}>
            <View style={styles.infoRow}>
              <Badge 
                style={[styles.statusBadge, { backgroundColor: statusColor }]}
              >{getStatusLabel(item.status)}</Badge>
            </View>
            
            <View style={styles.infoRow}>
              <Clock size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{timeAgo}</Text>
            </View>
          </View>
          
          {item.status === 'COMPLETED' && item.completedBy && (
            <View style={styles.completedByContainer}>
              <CheckCircle size={16} color={colors.success} />
              <Text style={styles.completedByText}>
                {item.completedBy.name} tarafından tamamlandı
              </Text>
            </View>
          )}
          
          {item.status === 'AWAITING_APPROVAL' && (
            <View style={styles.awaitingApproval}>
              <AlertCircle size={16} color={colors.warning} />
              <Text style={styles.awaitingApprovalText}>
                Onay bekleniyor
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };
  
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <CheckCircle size={60} color={colors.textSecondary} style={styles.emptyIcon} />
      <Text style={styles.emptyText}>Görev bulunamadı</Text>
    </View>
  );
  
  return (
    <FlatList
      data={tasks}
      renderItem={renderTask}
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  locationText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  chipCategory: {
    borderRadius: borderRadius.small,
    marginLeft: spacing.sm,
  },
  chipText: {
    ...typography.caption,
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
  statusBadge: {
    borderRadius: borderRadius.small,
  },
  completedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  completedByText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  awaitingApproval: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  awaitingApprovalText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: 'bold',
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