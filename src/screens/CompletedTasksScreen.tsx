import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  ImageBackground,
  Alert,
} from 'react-native';
import { Text, IconButton, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { TaskService } from '../services/taskService';
import { XPService } from '../services/xpService';
import { useAuth } from '../hooks/useAuth';
import { Task } from '../types/task';
import { colors, spacing, borderRadius } from '../config/theme';
import { CheckCircle, ArrowLeft, Award, Trophy, Star, Target, Calendar, TrendingUp } from 'lucide-react-native';
import LottieView from 'lottie-react-native';

export default function CompletedTasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalXP, setTotalXP] = useState(0);
  const [statsCategoryCount, setStatsCategoryCount] = useState<{[key: string]: number}>({});
  const [streak, setStreak] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navigation = useNavigation();
  const { user } = useAuth();
  const taskService = TaskService.getInstance();
  const xpService = XPService.getInstance();

  // Animasyon değerleri
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  
  // Lottie referansları
  const confettiRef = useRef<LottieView>(null);
  const trophyRef = useRef<LottieView>(null);

  // Item animation references - define these at the component level, not inside render functions
  const itemFades = useRef<{[key: string]: Animated.Value}>({}).current;
  const itemSlides = useRef<{[key: string]: Animated.Value}>({}).current;
  
  // Category animation references
  const categoryFades = useRef<{[key: string]: Animated.Value}>({}).current;
  const categoryScales = useRef<{[key: string]: Animated.Value}>({}).current;

  useEffect(() => {
    // Animasyonları başlat
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    loadCompletedTasks();
  }, []);

  // Lottie animasyonlarını oynat
  useEffect(() => {
    if (!loading && tasks.length > 0) {
      confettiRef.current?.play();
      trophyRef.current?.play();
      
      // Stats animasyonunu gecikmeyle başlat
      setTimeout(() => {
        Animated.timing(statsOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, 500);
    }
  }, [loading, tasks]);

  // Initialize item animations whenever tasks change
  useEffect(() => {
    // Create animations for each task item
    tasks.forEach((task, index) => {
      const itemDelay = index * 150;
      
      // Create animation values if they don't exist
      if (!itemFades[task.id]) {
        itemFades[task.id] = new Animated.Value(0);
      }
      if (!itemSlides[task.id]) {
        itemSlides[task.id] = new Animated.Value(50);
      }
      
      // Start animations
      Animated.parallel([
        Animated.timing(itemFades[task.id], {
          toValue: 1,
          duration: 500,
          delay: itemDelay,
          useNativeDriver: true,
        }),
        Animated.timing(itemSlides[task.id], {
          toValue: 0,
          duration: 400,
          delay: itemDelay,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [tasks]);

  // Initialize category animations when category counts change
  useEffect(() => {
    // Create animations for each category
    Object.keys(statsCategoryCount).forEach((category, index) => {
      if (statsCategoryCount[category] === 0) return;
      
      const delay = 300 + index * 100;
      
      // Create animation values if they don't exist
      if (!categoryFades[category]) {
        categoryFades[category] = new Animated.Value(0);
      }
      if (!categoryScales[category]) {
        categoryScales[category] = new Animated.Value(0.8);
      }
      
      // Start animations
      Animated.parallel([
        Animated.timing(categoryFades[category], {
          toValue: 1,
          duration: 400,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.spring(categoryScales[category], {
          toValue: 1,
          friction: 6,
          tension: 40,
          delay: delay,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [statsCategoryCount]);

  const loadCompletedTasks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allTasks = await taskService.getTasks();
      
      // Tamamlanan ve bu kullanıcı tarafından yapılan görevleri filtrele
      const completedTasks = allTasks.filter(task => 
        task.status === 'COMPLETED' && 
        task.completedBy?.id === user.uid
      );
      
      // Görevleri son tamamlanma tarihine göre sırala (en yeni en üstte)
      completedTasks.sort((a, b) => {
        const dateA = new Date(a.completedBy?.completedAt || 0).getTime();
        const dateB = new Date(b.completedBy?.completedAt || 0).getTime();
        return dateB - dateA;
      });
      
      // Toplam XP hesapla
      const totalTaskXP = completedTasks.reduce((sum, task) => sum + (task.xpReward || 0), 0);
      console.log("CompletedTasksScreen - Calculated XP from completed tasks:", totalTaskXP);
      
      // XP servisinden görev ilerleme bilgisini al
      const taskProgress = await xpService.getTaskProgress(user.uid);
      
      setTasks(completedTasks);
      setTotalXP(totalTaskXP);
      setStreak(taskProgress.totalStreakDays);
      setStatsCategoryCount(taskProgress.currentTasksCount);
      
    } catch (error) {
      console.error('Error loading completed tasks:', error);
      Alert.alert('Hata', 'Görev bilgileri yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadCompletedTasks();
  };

  // Kategori renklerini belirle
  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'FEEDING': return '#4CAF50';
      case 'HEALTH': return '#F44336';
      case 'SHELTER': return '#FF9800';
      case 'CLEANING': return '#2196F3';
      default: return '#9C27B0';
    }
  };
  
  // Kategori adlarını Türkçe'ye çevir
  const getCategoryName = (category: string) => {
    switch(category) {
      case 'FEEDING': return 'Besleme';
      case 'HEALTH': return 'Sağlık';
      case 'SHELTER': return 'Barınak';
      case 'CLEANING': return 'Temizlik';
      default: return 'Diğer';
    }
  };

  const renderItem = ({ item, index }: { item: Task, index: number }) => {
    return (
      <Animated.View style={{ 
        opacity: itemFades[item.id] || 0,
        transform: [{ translateY: itemSlides[item.id] || 50 }]
      }}>
        <TouchableOpacity 
          style={styles.taskCard}
          onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.taskHeader}>
            <View style={styles.taskTitleContainer}>
              <View style={[styles.categoryIndicator, { backgroundColor: getCategoryColor(item.category) }]} />
              <Text style={styles.taskTitle}>{item.title}</Text>
            </View>
            <CheckCircle size={20} color={colors.success} />
          </View>
          
          <Text style={styles.taskDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.taskFooter}>
            <View style={styles.footerLeft}>
              <Calendar size={14} color={colors.textTertiary} style={styles.footerIcon} />
              <Text style={styles.taskDate}>
                {new Date(item.completedBy?.completedAt || '').toLocaleDateString('tr-TR')}
              </Text>
            </View>
            <View style={styles.xpBadge}>
              <Star size={14} color="#FFD700" style={{ marginRight: 4 }} />
              <Text style={styles.taskXP}>+{item.xpReward} XP</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Header animasyonu
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 170],
    outputRange: [210, 70],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100, 170],
    outputRange: [1, 0.7, 0.3],
    extrapolate: 'clamp',
  });

  // Kategori istatistikleri elemanlarını oluştur
  const renderCategoryStats = () => {
    return Object.keys(statsCategoryCount).map((category, index) => {
      // Kategori adını kontrol et
      if (statsCategoryCount[category] === 0) return null;
      
      return (
        <Animated.View 
          key={category}
          style={[
            styles.categoryItem,
            { 
              opacity: categoryFades[category] || 0,
              transform: [{ scale: categoryScales[category] || 0.8 }]
            }
          ]}
        >
          <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(category) }]} />
          <Text style={styles.categoryLabel}>{getCategoryName(category)}</Text>
          <Text style={styles.categoryCount}>{statsCategoryCount[category]}</Text>
        </Animated.View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Animasyonlu header */}
      <Animated.View 
        style={[
          styles.animatedHeader, 
          { 
            height: headerHeight,
            opacity: headerOpacity
          }
        ]}
      >
        <ImageBackground 
          source={require('../assets/images/task-completed-bg.jpg')} 
          style={styles.headerBackground}
          imageStyle={{ opacity: 0.6 }}
        >
          <View style={styles.headerOverlay}>
            <View style={styles.headerTop}>
              <IconButton
                icon={() => <ArrowLeft size={24} color="#fff" />}
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              />
              <Text style={styles.headerTitle}>Tamamlanan Görevler</Text>
            </View>
            
            <View style={styles.headerInfo}>
              <LottieView 
                ref={trophyRef}
                source={require('../assets/animations/trophy.json')} 
                style={styles.trophyAnimation}
                autoPlay={false}
                loop={false}
              />
              
              <Animated.View
                style={[
                  styles.statsContainer,
                  {
                    transform: [
                      { scale: scaleAnim }
                    ],
                    opacity: fadeAnim
                  }
                ]}
              >
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{tasks.length}</Text>
                  <Text style={styles.statLabel}>Tamamlanan Görev</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{totalXP}</Text>
                  <Text style={styles.statLabel}>Toplam XP</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{streak}</Text>
                  <Text style={styles.statLabel}>Gün Serisi</Text>
                </View>
              </Animated.View>
            </View>
          </View>
        </ImageBackground>
      </Animated.View>
      
      {/* Başlık - scrollda gösterilecek */}
      <Animated.View 
        style={[
          styles.fixedTitle,
          {
            opacity: scrollY.interpolate({
              inputRange: [120, 160],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            })
          }
        ]}
      >
        <Text style={styles.fixedTitleText}>Tamamladığım Görevler</Text>
        <Text style={styles.fixedSubtitle}>{tasks.length} görev</Text>
      </Animated.View>
      
      {/* Kategori istatistikleri */}
      <Animated.View 
        style={[
          styles.categoriesCard,
          {
            opacity: statsOpacity,
            transform: [
              { translateY: statsOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })}
            ]
          }
        ]}
      >
        <View style={styles.categoriesHeader}>
          <Target size={18} color={colors.primary} />
          <Text style={styles.categoriesTitle}>Kategori Dağılımı</Text>
        </View>
        <View style={styles.categoriesContent}>
          {renderCategoryStats()}
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : (
        <>
          <LottieView 
            ref={confettiRef}
            source={require('../assets/animations/confetti.json')} 
            style={styles.confettiAnimation}
            autoPlay={false}
            loop={false}
          />
          
          <FlatList
            data={tasks}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            refreshing={isRefreshing}
            onRefresh={onRefresh}
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
        </>
      )}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  animatedHeader: {
    width: '100%',
    overflow: 'hidden',
    zIndex: 10,
  },
  headerBackground: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: spacing.sm,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: -20,
    marginBottom: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: colors.divider,
    marginHorizontal: spacing.sm,
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
    paddingTop: 80, // Kategori kartı için yer
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  taskTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIndicator: {
    width: 4,
    height: '80%',
    borderRadius: 4,
    marginRight: spacing.sm,
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
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    marginRight: 4,
  },
  taskDate: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  taskXP: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.warning,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
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
  confettiAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    zIndex: 20,
    pointerEvents: 'none',
  },
  trophyAnimation: {
    width: 120,
    height: 120,
    marginBottom: -30,
  },
  fixedTitle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: spacing.md,
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  fixedTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  fixedSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  categoriesCard: {
    position: 'absolute',
    top: 220,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: spacing.xs,
  },
  categoriesContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    width: '48%',
    marginVertical: 4,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  categoryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
}); 