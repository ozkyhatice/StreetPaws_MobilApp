import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { TaskService } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import { Task } from '../types/task';
import { colors, spacing, borderRadius } from '../config/theme';
import { CheckCircle, ArrowLeft } from 'lucide-react-native';

export default function CompletedTasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalXP, setTotalXP] = useState(0);
  const navigation = useNavigation();
  const { user } = useAuth();
  const taskService = TaskService.getInstance();

  useEffect(() => {
    loadCompletedTasks();
  }, []);

  const loadCompletedTasks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allTasks = await taskService.getTasks();
      
      // Filter tasks that are COMPLETED and completed by this user
      const completedTasks = allTasks.filter(task => 
        task.status === 'COMPLETED' && 
        task.completedBy?.id === user.uid
      );
      
      // Calculate total XP from tasks
      const totalTaskXP = completedTasks.reduce((sum, task) => sum + (task.xpReward || 0), 0);
      
      setTasks(completedTasks);
      setTotalXP(totalTaskXP);
      
    } catch (error) {
      console.error('Error loading completed tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Task }) => (
    <TouchableOpacity 
      style={styles.taskCard}
      onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
    >
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <CheckCircle size={20} color={colors.success} />
      </View>
      
      <Text style={styles.taskDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.taskFooter}>
        <Text style={styles.taskDate}>
          Tamamlanma: {new Date(item.completedBy?.completedAt || '').toLocaleDateString('tr-TR')}
        </Text>
        <Text style={styles.taskXP}>+{item.xpReward} XP</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={colors.text} />}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>Tamamladığım Görevler</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Toplam Tamamlanan</Text>
          <Text style={styles.statValue}>{tasks.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Toplam XP</Text>
          <Text style={styles.statValue}>{totalXP}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckCircle size={64} color={colors.textTertiary} style={{ opacity: 0.5 }} />
              <Text style={styles.emptyTitle}>Henüz Görev Tamamlanmamış</Text>
              <Text style={styles.emptyText}>
                Tamamladığınız görevler burada listelenecek.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  taskDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDate: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  taskXP: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.success,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
}); 