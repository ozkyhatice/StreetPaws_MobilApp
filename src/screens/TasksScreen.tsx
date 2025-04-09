import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { TaskCard } from '../components/TaskCard';
import { Button } from '../components/Button';
import { colors, typography, spacing, shadows, borderRadius } from '../config/theme';
import { Task, TaskFilter } from '../types/task';
import { TaskService } from '../services/taskService';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Search, Filter, Plus, RefreshCw } from 'lucide-react-native';
import { Text, Chip, Badge, Divider } from 'react-native-paper';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

// Mock task data - servis hazır olmadığında kullanılacak
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Kadıköy Bölgesi Kedi Beslemesi',
    description: 'Kadıköy meydandaki kedilerin beslenmesi ve su kaplarının temizlenmesi',
    category: 'FEEDING',
    status: 'OPEN',
    priority: 'MEDIUM',
    location: {
      address: 'Kadıköy Meydan, İstanbul',
      latitude: 40.9916,
      longitude: 29.0291
    },
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 86400000).toISOString(),
    xpReward: 150,
    createdBy: {
      id: '1',
      name: 'Ahmet Yılmaz'
    },
    images: ['https://picsum.photos/id/237/200/300']
  },
  {
    id: '2',
    title: 'Beşiktaş Sahildeki Köpekler İçin Acil Yardım',
    description: 'Beşiktaş sahil parkındaki yaralı sokak köpeği için veteriner yardımı gerekiyor',
    category: 'HEALTH',
    status: 'OPEN',
    priority: 'URGENT',
    location: {
      address: 'Beşiktaş Sahil Parkı, İstanbul',
      latitude: 41.0451,
      longitude: 29.0047
    },
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 43200000).toISOString(),
    xpReward: 300,
    createdBy: {
      id: '2',
      name: 'Zeynep Demir'
    },
    images: ['https://picsum.photos/id/169/200/300']
  },
  {
    id: '3',
    title: 'Üsküdar Barınak Temizliği',
    description: 'Üsküdar Hayvan Barınağının temizlenmesi ve dezenfekte edilmesi',
    category: 'CLEANING',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    location: {
      address: 'Üsküdar Hayvan Barınağı, İstanbul',
      latitude: 41.0219,
      longitude: 29.0554
    },
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 172800000).toISOString(),
    xpReward: 250,
    createdBy: {
      id: '3',
      name: 'Canan Aksoy'
    }
  },
  {
    id: '4',
    title: 'Bakırköy Sahil Kedileri İçin Yeni Kulübe',
    description: 'Bakırköy sahilindeki kediler için kış öncesi yeni kulübe yapımı',
    category: 'SHELTER',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    location: {
      address: 'Bakırköy Sahil, İstanbul',
      latitude: 40.9795,
      longitude: 28.8730
    },
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 259200000).toISOString(),
    xpReward: 200,
    createdBy: {
      id: '4',
      name: 'Murat Yıldız'
    }
  }
];

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<TaskFilter>({});
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const navigation = useNavigation();
  const taskService = TaskService.getInstance();

  const loadTasks = async () => {
    try {
      setLoading(true);
      // Gerçek API hazır olduğunda burayı aktif edebilirsiniz:
      // const loadedTasks = await taskService.getTasks({
      //   ...filter,
      //   searchText: searchText,
      // });
      // setTasks(loadedTasks);
      
      // Mock veri kullanımı
      const filteredTasks = mockTasks.filter(task => {
        // Arama metni filtrelemesi
        if (searchText && !task.title.toLowerCase().includes(searchText.toLowerCase()) && 
            !task.description.toLowerCase().includes(searchText.toLowerCase())) {
          return false;
        }
        
        // Durum filtrelemesi
        if (filter.status && task.status !== filter.status) {
          return false;
        }
        
        // Kategori filtrelemesi
        if (filter.category && task.category !== filter.category) {
          return false;
        }
        
        // Öncelik filtrelemesi
        if (filter.priority && task.priority !== filter.priority) {
          return false;
        }
        
        return true;
      });
      
      // Filtrelenmiş görevleri set et
      setTimeout(() => {
        setTasks(filteredTasks);
        setLoading(false);
        setRefreshing(false);
      }, 500); // Gerçek veri çekimi simülasyonu için
      
    } catch (error) {
      console.error('Error loading tasks:', error);
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
    navigation.navigate('AddEmergency');
  };

  const clearFilters = () => {
    setFilter({});
    setSearchText('');
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'FEEDING': return 'Besleme';
      case 'CLEANING': return 'Temizlik';
      case 'HEALTH': return 'Sağlık';
      case 'SHELTER': return 'Barınak';
      default: return category;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Açık';
      case 'IN_PROGRESS': return 'Devam Ediyor';
      case 'COMPLETED': return 'Tamamlandı';
      case 'CANCELLED': return 'İptal Edildi';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'Acil';
      case 'HIGH': return 'Yüksek';
      case 'MEDIUM': return 'Orta';
      case 'LOW': return 'Düşük';
      default: return priority;
    }
  };

  const getChipColor = (type: string, value: string) => {
    if (type === 'priority') {
      switch (value) {
        case 'URGENT': return colors.error;
        case 'HIGH': return colors.secondary;
        case 'MEDIUM': return colors.warning;
        case 'LOW': return colors.info;
        default: return colors.primary;
      }
    } else if (type === 'status') {
      switch (value) {
        case 'OPEN': return colors.primary;
        case 'IN_PROGRESS': return colors.warning;
        case 'COMPLETED': return colors.success;
        case 'CANCELLED': return colors.textTertiary;
        default: return colors.primary;
      }
    } else if (type === 'category') {
      switch (value) {
        case 'FEEDING': return colors.info;
        case 'CLEANING': return colors.secondary;
        case 'HEALTH': return colors.error;
        case 'SHELTER': return colors.warning;
        default: return colors.primary;
      }
    }
    return colors.primary;
  };

  const renderFilterChip = (
    label: string,
    filterKey: keyof TaskFilter,
    value: any
  ) => {
    const isSelected = filter[filterKey] === value;
    const chipColor = getChipColor(filterKey, value);
    
    return (
      <Chip
        mode={isSelected ? "flat" : "outlined"}
        selected={isSelected}
        selectedColor={isSelected ? "white" : chipColor}
        style={[
          styles.filterChip,
          isSelected && { backgroundColor: chipColor }
        ]}
        onPress={() =>
          setFilter(prev => ({
            ...prev,
            [filterKey]: prev[filterKey] === value ? undefined : value,
          }))
        }
      >
        {label}
      </Chip>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MapPin size={64} color={colors.textTertiary} style={{ opacity: 0.5 }} />
      <Text style={styles.emptyTitle}>Görev Bulunamadı</Text>
      <Text style={styles.emptyText}>
        Aramanıza veya filtrelere uygun görev bulunamadı.
      </Text>
      <Button
        title="Filtreleri Temizle"
        onPress={clearFilters}
        variant="outline"
      />
    </View>
  );

  const activeFilterCount = Object.values(filter).filter(v => v !== undefined).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Görevler</Text>
        <TouchableOpacity 
          style={styles.createTaskButton}
          onPress={handleCreateTask}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Görev ara..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={colors.textTertiary}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={colors.primary} />
          {activeFilterCount > 0 && (
            <Badge
              style={styles.filterBadge}
              size={18}
            >
              {activeFilterCount}
            </Badge>
          )}
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersWrapper}>
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Durum</Text>
            <ScrollableTags>
              {renderFilterChip('Tümü', 'status', undefined)}
              {renderFilterChip('Açık', 'status', 'OPEN')}
              {renderFilterChip('Devam Eden', 'status', 'IN_PROGRESS')}
              {renderFilterChip('Tamamlanan', 'status', 'COMPLETED')}
            </ScrollableTags>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Öncelik</Text>
            <ScrollableTags>
              {renderFilterChip('Acil', 'priority', 'URGENT')}
              {renderFilterChip('Yüksek', 'priority', 'HIGH')}
              {renderFilterChip('Orta', 'priority', 'MEDIUM')}
              {renderFilterChip('Düşük', 'priority', 'LOW')}
            </ScrollableTags>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Kategori</Text>
            <ScrollableTags>
              {renderFilterChip('Besleme', 'category', 'FEEDING')}
              {renderFilterChip('Temizlik', 'category', 'CLEANING')}
              {renderFilterChip('Sağlık', 'category', 'HEALTH')}
              {renderFilterChip('Barınak', 'category', 'SHELTER')}
            </ScrollableTags>
          </View>
          
          {(activeFilterCount > 0 || searchText.length > 0) && (
            <TouchableOpacity 
              style={styles.clearAllButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearAllText}>Tüm Filtreleri Temizle</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={({ item }) => <TaskCard task={item} onPress={handleTaskPress} />}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 90 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const ScrollableTags = ({ children }) => (
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.scrollableTags}
  >
    {children}
  </ScrollView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.h2,
    fontWeight: 'bold',
    color: colors.text,
  },
  createTaskButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    height: 48,
    ...shadows.small,
  },
  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: spacing.sm,
    color: colors.text,
    ...typography.body1,
  },
  clearButton: {
    color: colors.textTertiary,
    fontSize: 16,
    paddingHorizontal: spacing.xs,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    ...shadows.small,
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.secondary,
  },
  filtersWrapper: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.small,
  },
  filterSection: {
    marginBottom: spacing.sm,
  },
  filterTitle: {
    ...typography.subtitle2,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  scrollableTags: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.lg,
  },
  filterChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  clearAllButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  clearAllText: {
    ...typography.button,
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body2,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
