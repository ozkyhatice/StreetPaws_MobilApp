import React, { useState, useEffect, useRef } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { TaskCard } from '../components/TaskCard';
import { Button } from '../components/Button';
import { colors, typography, spacing, shadows, borderRadius } from '../config/theme';
import { Task, TaskFilter } from '../types/task';
import { TaskService } from '../services/taskService';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Search, Filter, Plus, RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';
import { Text, Chip, Badge, Divider, Card, Avatar, Button as PaperButton, IconButton } from 'react-native-paper';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { EmergencyService, EmergencyRequest } from '../services/emergencyService';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { TaskList } from '../components/TaskList';
import { EmergencyTaskList } from '../components/EmergencyTaskList';
import { TaskProgressCard } from '../components/TaskProgressCard';
import { Award } from 'lucide-react-native';
import { TaskSearch } from '../components/TaskSearch';

// Debug imports
console.log('TaskList imported as:', TaskList);
console.log('EmergencyTaskList imported as:', EmergencyTaskList);
console.log('TaskProgressCard imported as:', TaskProgressCard);

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

type TasksScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type ListItem = {
  type: 'task' | 'emergency';
  data: Task | EmergencyRequest;
};

// Add this utility function to handle date display safely
const safeFormatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('tr-TR');
  } catch (error) {
    console.warn('Invalid date format:', error);
    return 'Tarih bilgisi yok';
    }
};

export default function TasksScreen() {
  const navigation = useNavigation<TasksScreenNavigationProp>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<ListItem[]>([]);
  const [filter, setFilter] = useState<TaskFilter>({
    filterType: 'all'
  });
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [showAwaitingApprovalTasks, setShowAwaitingApprovalTasks] = useState(false);
  const listRef = useRef<FlatList>(null);
  const lastTabPress = useRef<{ [key: string]: number }>({});
  const [completedCount, setCompletedCount] = useState(0);
  const [awaitingApprovalCount, setAwaitingApprovalCount] = useState(0);
  
  // TabView configuration
  const [tabRoutes] = useState([
    { key: 'emergency', title: 'Acil Durumlar' },
    { key: 'regular', title: 'Görevler' }
  ]);

  const taskService = TaskService.getInstance();
  const emergencyService = EmergencyService.getInstance();
  const layout = useWindowDimensions();

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("TasksScreen - Starting data fetch from Firestore");
      
      const taskService = TaskService.getInstance();
      const tasks = await taskService.getTasks();
      
      // Görevleri ListItem formatına dönüştür
      const taskItems: ListItem[] = tasks.map(task => ({
        type: 'task',
        data: task
      }));

      // Acil durumları al
      const emergencies = await emergencyService.getEmergencyRequests();
      const emergencyItems: ListItem[] = emergencies.map(emergency => ({
        type: 'emergency',
        data: emergency
      }));

      // Tüm öğeleri birleştir ve tarihe göre sırala
      const allItems = [...taskItems, ...emergencyItems].sort((a, b) => {
        try {
          const dateA = new Date(a.data.createdAt);
          const dateB = new Date(b.data.createdAt);
          return dateB.getTime() - dateA.getTime();
        } catch (error) {
          console.warn("Error sorting items by date:", error);
          return 0;
        }
      });

      setItems(allItems);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Veri Hatası', 'Veriler yüklenirken bir hata oluştu.');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchData();
    loadTaskCounts();
  }, []);

  // Add a focus listener to refresh data when the screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("TasksScreen focused - refreshing data");
      fetchData();
    });
    
    // Clean up the listener when component unmounts
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleItemPress = (item: ListItem) => {
    if (item.type === 'task') {
      if (!item.data || !(item.data as Task).id) {
        console.error("TasksScreen - Invalid task or missing ID:", item.data);
        return;
      }
      
      const taskId = ((item.data as Task).id || '').toString();
      console.log("TasksScreen - Navigating to TaskDetail with ID:", taskId);
      navigation.navigate('TaskDetail', { taskId: taskId });
    } else {
      // Here you can navigate to an emergency detail screen if you have one
      Alert.alert(
        'Acil Durum Detayı',
        `${item.data.title}\n\n${item.data.description}\n\nKonum: ${item.data.location}`
      );
    }
  };

  const getFilteredItems = () => {
    if (!user) return [];

    return items.filter(item => {
      if (item.type !== 'task') return true; // Acil durumları göster
      const task = item.data as Task;

      // Tamamlanan görevler sayfası
      if (showCompletedTasks) {
        return task.completedBy?.id === user.uid && task.status === 'COMPLETED';
      }

      // Onay bekleyen görevler sayfası
      if (showAwaitingApprovalTasks) {
        return task.completedBy?.id === user.uid && task.status === 'AWAITING_APPROVAL';
      }

      // Filtre uygulanmışsa
      if (filter.filterType !== 'all') {
        // Kategori filtresi
        if (filter.category && task.category !== filter.category) {
          return false;
        }

        // Durum filtresi
        if (filter.status && task.status !== filter.status) {
          return false;
        }

        // Öncelik filtresi
        if (filter.priority && task.priority !== filter.priority) {
          return false;
        }

        // Kullanıcıya atanmış görevler
        if (filter.filterType === 'assigned') {
          return task.assignedTo === user.uid;
        }

        // Kullanıcının tamamladığı görevler
        if (filter.filterType === 'completed') {
          return task.completedBy?.id === user.uid && task.status === 'COMPLETED';
        }

        // Kullanıcının onay bekleyen görevleri
        if (filter.filterType === 'awaiting_approval') {
          return task.completedBy?.id === user.uid && task.status === 'AWAITING_APPROVAL';
        }
      }

      // Arama filtresi
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  };

  const handleCompletedPress = () => {
    setShowCompletedTasks(true);
    setShowAwaitingApprovalTasks(false);
    setTabIndex(1); // Görevler tabına geç
  };

  const handleAwaitingApprovalPress = () => {
    setShowAwaitingApprovalTasks(true);
    setShowCompletedTasks(false);
    setTabIndex(1); // Görevler tabına geç
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
          
          {task.status === 'COMPLETED' && task.completedBy && (
            <View style={styles.completedByContainer}>
              <Text style={styles.completedByLabel}>Tamamlayan:</Text>
              <View style={styles.completedByInfo}>
                <Ionicons name="person" size={14} color={colors.primary} />
                <Text style={styles.completedByText}>{task.completedBy.name}</Text>
              </View>
              <Text style={styles.completedAtText}>
                {safeFormatDate(task.completedBy.completedAt)}
              </Text>
            </View>
          )}
          
          <View style={styles.itemFooter}>
            <Text style={styles.itemDate}>
              {safeFormatDate(task.createdAt)}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: task.status === 'COMPLETED' ? colors.success : colors.primary }
            ]}>
              <Text style={styles.statusText}>
                {task.status === 'COMPLETED' ? 'Tamamlandı' : 'Açık'}
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
                {safeFormatDate(emergency.resolvedBy.resolvedAt)}
              </Text>
            </View>
          )}
          
          <View style={styles.itemFooter}>
            <Text style={styles.itemDate}>
              {safeFormatDate(emergency.createdAt)}
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
    setFilter({
      filterType: 'all'
    });
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
    const chipColor = getChipColor(String(filterKey), value);
    
    return (
      <Chip
        mode={isSelected ? "flat" : "outlined"}
        selected={isSelected}
        selectedColor={isSelected ? "#ffffff" : chipColor}
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

  const toggleAchievements = () => {
    setShowAchievements(!showAchievements);
  };

  // Tab views for regular and emergency tasks
  const EmergencyTasksRoute = () => (
    <View style={{ flex: 1 }}>
      <EmergencyTaskList navigation={navigation} />
    </View>
  );

  const getTaskListFilter = (): TaskFilter => {
    if (showCompletedTasks) {
      return {
        filterType: 'completed',
        completedBy: user ? { id: user.uid } : undefined
      };
    }
    if (showAwaitingApprovalTasks) {
      return {
        filterType: 'awaiting_approval',
        completedBy: user ? { id: user.uid } : undefined,
        status: 'AWAITING_APPROVAL'
      };
    }
    return { filterType: 'all' };
  };

  const RegularTasksRoute = () => {
    const filteredItems = getFilteredItems();
    
    return (
      <View style={{flex: 1}}>
        <TaskList 
          filter={{
            filterType: showCompletedTasks ? 'completed' : 
                       showAwaitingApprovalTasks ? 'awaiting_approval' : 'all',
            completedBy: user ? { id: user.uid } : undefined,
            status: showAwaitingApprovalTasks ? 'AWAITING_APPROVAL' : undefined
          }}
          onFilterChange={(newFilter) => {
            setFilter(newFilter);
            setShowCompletedTasks(newFilter.filterType === 'completed');
            setShowAwaitingApprovalTasks(newFilter.filterType === 'awaiting_approval');
          }}
          navigation={navigation}
        />
        {user && user.uid && (
          <TaskProgressCard 
            userId={user.uid} 
            onBadgePress={toggleAchievements} 
          />
        )}
      </View>
    );
  };

  const renderScene = SceneMap({
    emergency: EmergencyTasksRoute,
    regular: RegularTasksRoute,
  });

  const handleTabPress = (route: string) => {
    const now = Date.now();
    const lastPress = lastTabPress.current[route] || 0;
    
    if (now - lastPress < 300) { // Double tap within 300ms
      // Scroll to top
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
    
    lastTabPress.current[route] = now;
  };

  const handleBack = () => {
    setShowCompletedTasks(false);
    setShowAwaitingApprovalTasks(false);
  };

  const loadTaskCounts = async () => {
    try {
      if (!user) {
        setCompletedCount(0);
        setAwaitingApprovalCount(0);
        return;
      }

      const taskService = TaskService.getInstance();
      const allTasks = await taskService.getTasks();
      
      // Sadece giriş yapmış olan kullanıcının görevlerini filtrele
      const userTasks = allTasks.filter(task => 
        task.completedBy?.id === user.uid
      );

      // Bu kullanıcının tamamladığı görevleri say
      const userCompletedCount = userTasks.filter(task => 
        task.status === 'COMPLETED'
      ).length;
      setCompletedCount(userCompletedCount);

      // Bu kullanıcının onay bekleyen görevlerini say
      const userAwaitingCount = userTasks.filter(task => 
        task.status === 'AWAITING_APPROVAL'
      ).length;
      setAwaitingApprovalCount(userAwaitingCount);

    } catch (error) {
      console.error('Error loading task counts:', error);
      setCompletedCount(0);
      setAwaitingApprovalCount(0);
    }
  };

  // useEffect ile kullanıcı değiştiğinde sayaçları güncelle
  useEffect(() => {
    loadTaskCounts();
  }, [user]);

  // Görevler değiştiğinde sayaçları güncelle
  useEffect(() => {
    if (user) {
      loadTaskCounts();
    }
  }, [items]);

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: colors.primary }}
      style={{ backgroundColor: colors.background }}
      tabStyle={{ paddingVertical: 8 }}
      activeColor={colors.primary}
      inactiveColor={colors.textSecondary}
      onTabPress={({ route }) => handleTabPress(route.key)}
    />
  );

  const handleCompletedTasksPress = () => {
    navigation.navigate('CompletedTasks');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={[styles.header, (showCompletedTasks || showAwaitingApprovalTasks) && styles.specialHeader]}
      >
        {!showCompletedTasks && !showAwaitingApprovalTasks ? (
          <>
            <TaskSearch
              searchText={searchText}
              onSearchChange={setSearchText}
              filter={filter}
              onFilterChange={setFilter}
            />
            <TouchableOpacity 
              style={styles.completedTasksButton}
              onPress={handleCompletedTasksPress}
            >
              <CheckCircle size={20} color="#fff" />
              <Text style={styles.completedTasksButtonText}>Tamamlanan Görevlerim</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.specialHeaderContent}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.specialTitleContainer}>
              {showCompletedTasks ? (
                <CheckCircle size={24} color="#fff" />
              ) : (
                <Clock size={24} color="#fff" />
              )}
              <Text style={styles.specialTitle}>
                {showCompletedTasks ? 'Tamamladığım Görevler' : 'Onay Bekleyen Görevler'}
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {!showCompletedTasks && !showAwaitingApprovalTasks ? (
        <>
          <TabView
            navigationState={{ index: tabIndex, routes: tabRoutes }}
            renderScene={renderScene}
            onIndexChange={setTabIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={renderTabBar}
            style={styles.tabView}
          />
        </>
      ) : (
        <View style={styles.specialContent}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>
                {showCompletedTasks ? 'Toplam Tamamlanan' : 'Onay Bekleyen'}
              </Text>
              <Text style={styles.statValue}>
                {getFilteredItems().length}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Toplam XP</Text>
              <Text style={styles.statValue}>
                {getFilteredItems().reduce((sum, item) => sum + ((item.data as Task).xpReward || 0), 0)}
              </Text>
            </View>
          </View>
          <FlatList
            ref={listRef}
            data={getFilteredItems()}
            renderItem={renderItem}
            keyExtractor={(item) => item.type + '-' + item.data.id}
            contentContainerStyle={styles.specialList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {showCompletedTasks ? (
                  <CheckCircle size={64} color={colors.textTertiary} style={{ opacity: 0.5 }} />
                ) : (
                  <Clock size={64} color={colors.textTertiary} style={{ opacity: 0.5 }} />
                )}
                <Text style={styles.emptyTitle}>
                  {showCompletedTasks ? 'Henüz Görev Tamamlanmamış' : 'Onay Bekleyen Görev Yok'}
                </Text>
                <Text style={styles.emptyText}>
                  {showCompletedTasks 
                    ? 'Tamamladığınız görevler burada listelenecek.'
                    : 'Onay bekleyen görevleriniz burada listelenecek.'}
                </Text>
              </View>
            }
          />
        </View>
      )}

      {!showCompletedTasks && !showAwaitingApprovalTasks && (
        <TouchableOpacity style={styles.fab} onPress={handleCreateTask}>
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
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
    padding: spacing.md,
    borderBottomLeftRadius: borderRadius.large,
    borderBottomRightRadius: borderRadius.large,
    ...shadows.medium,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    height: 48,
    ...shadows.small,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: spacing.sm,
    color: colors.text,
    ...typography.body1,
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
  filterChipsContainer: {
    paddingVertical: spacing.sm,
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: spacing.sm,
    backgroundColor: "#ffffff",
    borderRadius: 50,
    height: 36,
  },
  selectedChip: {
    backgroundColor: colors.secondary,
  },
  chipText: {
    color: colors.text,
  },
  selectedChipText: {
    color: "#ffffff",
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: spacing.xxs,
    elevation: 2,
    borderRadius: borderRadius.medium,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success + '20',
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
  advancedFiltersContainer: {
    // ... existing styles ...
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  fab: {
    position: 'absolute',
    bottom: 100,
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
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
  },
  emptyTitle: {
    fontSize: 24,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  tabs: {
    backgroundColor: colors.background,
  },
  tabIndicator: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  contentText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  contentButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  contentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  specialHeader: {
    paddingBottom: spacing.lg,
  },
  specialHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  specialTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  specialTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  specialContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: '#fff',
    marginBottom: spacing.sm,
    borderRadius: borderRadius.medium,
    margin: spacing.md,
    ...shadows.medium,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  specialList: {
    padding: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  tabView: {
    flex: 1,
  },
  completedTasksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: spacing.sm,
    borderRadius: borderRadius.medium,
    marginTop: spacing.sm,
  },
  completedTasksButtonText: {
    color: '#fff',
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: '500',
  },
});

