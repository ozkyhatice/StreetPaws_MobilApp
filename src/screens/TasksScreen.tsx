import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { TaskCard } from '../components/TaskCard';
import { Button } from '../components/Button';
import { colors, typography } from '../config/theme';
import { Task, TaskFilter } from '../types/task';
import { TaskService } from '../services/taskService';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Text } from 'react-native-paper';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<TaskFilter>({});
  const [searchText, setSearchText] = useState('');

  const navigation = useNavigation();
  const taskService = TaskService.getInstance();

  const loadTasks = async () => {
    try {
      const loadedTasks = await taskService.getTasks({
        ...filter,
        searchText: searchText,
      });
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filter, searchText]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  const handleCreateTask = () => {
    navigation.navigate('CreateTask');
  };

  const renderFilterButton = (
    label: string,
    filterKey: keyof TaskFilter,
    value: any
  ) => (
    <Button
      title={label}
      onPress={() =>
        setFilter(prev => ({
          ...prev,
          [filterKey]: prev[filterKey] === value ? undefined : value,
        }))
      }
      variant={filter[filterKey] === value ? 'primary' : 'outline'}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Görevler</Text>
      <Text variant="bodyLarge">Yakındaki görevleri görüntüle</Text>

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={24} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Görev ara..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <Button
          title="Görev Ekle"
          onPress={handleCreateTask}
          variant="primary"
        />
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { label: 'Tümü', key: 'status', value: undefined },
            { label: 'Açık', key: 'status', value: 'OPEN' },
            { label: 'Devam Eden', key: 'status', value: 'IN_PROGRESS' },
            { label: 'Tamamlanan', key: 'status', value: 'COMPLETED' },
            { label: 'Acil', key: 'priority', value: 'URGENT' },
            { label: 'Beslenme', key: 'category', value: 'FEEDING' },
            { label: 'Temizlik', key: 'category', value: 'CLEANING' },
            { label: 'Sağlık', key: 'category', value: 'HEALTH' },
            { label: 'Barınak', key: 'category', value: 'SHELTER' },
          ]}
          renderItem={({ item }) => (
            <View style={styles.filterButton}>
              {renderFilterButton(item.label, item.key as keyof TaskFilter, item.value)}
            </View>
          )}
          keyExtractor={(item) => `${item.key}-${item.value}`}
        />
      </View>

      <FlatList
        data={tasks}
        renderItem={({ item }) => <TaskCard task={item} onPress={handleTaskPress} />}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    ...typography.body,
  },
  filterContainer: {
    paddingHorizontal: 8,
  },
  filterButton: {
    marginHorizontal: 4,
  },
  listContent: {
    paddingVertical: 8,
  },
});
