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
  Image,
  Alert,
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
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { EmergencyService, EmergencyRequest } from '../services/emergencyService';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

type TasksScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type ListItem = {
  type: 'task' | 'emergency';
  data: Task | EmergencyRequest;
};

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
    },
    completedBy: {
      id: '5',
      name: 'Ayşe Kaya',
      completedAt: new Date().toISOString(),
    }
  }
];

export default function TasksScreen() {
  const navigation = useNavigation<TasksScreenNavigationProp>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<ListItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'tasks' | 'emergencies' | 'completed'>('all');
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const taskService = TaskService.getInstance();
  const emergencyService = EmergencyService.getInstance();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasks, emergencies] = await Promise.all([
        taskService.getTasks(),
        emergencyService.getEmergencyRequests()
      ]);

      const taskItems: ListItem[] = tasks.map(task => ({
        type: 'task',
        data: task
      }));

      const emergencyItems: ListItem[] = emergencies.map(emergency => ({
        type: 'emergency',
        data: emergency
      }));

      const allItems = [...taskItems, ...emergencyItems].sort((a, b) => {
        const dateA = new Date(a.data.createdAt);
        const dateB = new Date(b.data.createdAt);
        return dateB.getTime() - dateA.getTime(); // Sort by newest first
      });

      setItems(allItems);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleItemPress = (item: ListItem) => {
    if (item.type === 'task') {
      navigation.navigate('TaskDetail', { taskId: item.data.id! });
    } else {
      // Here you can navigate to an emergency detail screen if you have one
      Alert.alert(
        'Acil Durum Detayı',
        `${item.data.title}\n\n${item.data.description}\n\nKonum: ${item.data.location}`
      );
    }
  };

  const getFilteredItems = () => {
    if (filter === 'all') return items;
    if (filter === 'tasks') return items.filter(item => item.type === 'task' && !(item.data as Task).completed);
    if (filter === 'emergencies') return items.filter(item => item.type === 'emergency');
    if (filter === 'completed') return items.filter(item => 
      item.type === 'task' && (item.data as Task).completed || 
      (item.type === 'emergency' && (item.data as EmergencyRequest).status === 'resolved')
    );
    
    return items;
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'task') {
      const task = item.data as Task;
      return (
        <TouchableOpacity
          style={[styles.itemCard, styles.taskCard]}
          onPress={() => handleItemPress(item)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.itemTitle}>{task.title}</Text>
            <View style={[styles.badgeContainer, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>Görev</Text>
            </View>
          </View>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {task.description}
          </Text>
          <Text style={styles.itemLocation}>
            <Ionicons name="location-outline" size={14} /> {typeof task.location === 'object' ? task.location.address : task.location}
          </Text>
          
          {task.completed && task.completedBy && (
            <View style={styles.completedByContainer}>
              <Text style={styles.completedByLabel}>Tamamlayan:</Text>
              <View style={styles.completedByInfo}>
                <Ionicons name="person" size={14} color={colors.primary} />
                <Text style={styles.completedByText}>{task.completedBy.name}</Text>
              </View>
              <Text style={styles.completedAtText}>
                {new Date(task.completedBy.completedAt).toLocaleDateString('tr-TR')}
              </Text>
            </View>
          )}
          
          <View style={styles.itemFooter}>
            <Text style={styles.itemDate}>
              {new Date(task.createdAt).toLocaleDateString('tr-TR')}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: task.completed ? colors.success : colors.primary }
            ]}>
              <Text style={styles.statusText}>
                {task.completed ? 'Tamamlandı' : 'Açık'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    } else {
      const emergency = item.data as EmergencyRequest;
      return (
        <TouchableOpacity
          style={[styles.itemCard, styles.emergencyCard]}
          onPress={() => handleItemPress(item)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.itemTitle}>{emergency.title}</Text>
            <View style={[styles.badgeContainer, { backgroundColor: '#FF3B30' }]}>
              <Text style={styles.badgeText}>Acil</Text>
            </View>
          </View>
          
          {emergency.imageUrl && (
            <Image 
              source={{ uri: emergency.imageUrl }} 
              style={styles.emergencyImage} 
              resizeMode="cover"
            />
          )}
          
          <Text style={styles.itemDescription} numberOfLines={2}>
            {emergency.description}
          </Text>
          <Text style={styles.itemLocation}>
            <Ionicons name="location-outline" size={14} /> {emergency.location}
          </Text>
          
          <View style={styles.urgencyContainer}>
            <Text style={styles.urgencyLabel}>Aciliyet:</Text>
            <View style={[
              styles.urgencyBadge, 
              { 
                backgroundColor: 
                  emergency.urgency === 'high' ? '#FF3B30' : 
                  emergency.urgency === 'medium' ? '#FF9500' : 
                  '#34C759'
              }
            ]}>
              <Text style={styles.urgencyText}>
                {emergency.urgency === 'high' ? 'Yüksek' : 
                 emergency.urgency === 'medium' ? 'Orta' : 'Düşük'}
              </Text>
            </View>
          </View>
          
          {emergency.status === 'resolved' && emergency.resolvedBy && (
            <View style={styles.completedByContainer}>
              <Text style={styles.completedByLabel}>Çözümleyen:</Text>
              <View style={styles.completedByInfo}>
                <Ionicons name="person" size={14} color="#34C759" />
                <Text style={styles.completedByText}>{emergency.resolvedBy.name}</Text>
              </View>
              <Text style={styles.completedAtText}>
                {new Date(emergency.resolvedBy.resolvedAt).toLocaleDateString('tr-TR')}
              </Text>
            </View>
          )}
          
          <View style={styles.itemFooter}>
            <Text style={styles.itemDate}>
              {new Date(emergency.createdAt).toLocaleDateString('tr-TR')}
            </Text>
            <View style={[
              styles.statusBadge,
              { 
                backgroundColor: 
                  emergency.status === 'pending' ? '#FF9500' :
                  emergency.status === 'in-progress' ? '#5AC8FA' :
                  emergency.status === 'resolved' ? '#34C759' : '#FF3B30'
              }
            ]}>
              <Text style={styles.statusText}>
                {emergency.status === 'pending' ? 'Bekliyor' :
                 emergency.status === 'in-progress' ? 'İşlemde' :
                 emergency.status === 'resolved' ? 'Çözüldü' : 'İptal Edildi'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  };

  const handleCreateTask = () => {
    navigation.navigate('AddEmergency');
  };

  const clearFilters = () => {
    setFilter('all');
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Görevler ve Acil Durumlar</Text>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilterButton]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            Tümü
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'tasks' && styles.activeFilterButton]}
          onPress={() => setFilter('tasks')}
        >
          <Text style={[styles.filterText, filter === 'tasks' && styles.activeFilterText]}>
            Görevler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'emergencies' && styles.activeFilterButton]}
          onPress={() => setFilter('emergencies')}
        >
          <Text style={[styles.filterText, filter === 'emergencies' && styles.activeFilterText]}>
            Acil Durumlar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.activeFilterButton]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.activeFilterText]}>
            Tamamlananlar
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={getFilteredItems()}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.type}-${item.data.id}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Gösterilecek öğe bulunamadı</Text>
            </View>
          }
        />
      )}
      
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => navigation.navigate('EmergencyHelp')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: spacing.xs,
  },
  activeFilterButton: {
    borderBottomColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeFilterText: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  completedByContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    flexDirection: 'column',
  },
  completedByLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  completedByInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedByText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginLeft: spacing.xs,
  },
  completedAtText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  taskCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  emergencyCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
    marginLeft: spacing.sm,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  itemLocation: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDate: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  statusBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emergencyImage: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.sm,
  },
  urgencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  urgencyLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
  },
  urgencyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
