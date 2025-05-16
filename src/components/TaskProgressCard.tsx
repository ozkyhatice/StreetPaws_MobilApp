import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { Text, Card, ProgressBar, Surface, Badge, Divider, Avatar } from 'react-native-paper';
import { colors, typography, spacing, borderRadius, shadows } from '../config/theme';
import { CheckCircle, Award, Flame, Calendar, Star, Shield, AlertTriangle, Target, Medal } from 'lucide-react-native';
import { BADGES, BADGE_LEVELS } from '../types/badge';
import { XPService } from '../services/xpService';
import { TaskService } from '../services/taskService';
import { Task, TaskPriority } from '../types/task';
import LottieView from 'lottie-react-native';

interface TaskProgressCardProps {
  userId: string;
  onBadgePress?: () => void;
}

// Define the ref interface
export interface TaskProgressCardRefHandle {
  refresh: () => void;
}

interface ProgressState {
  completedTasks: number;
  totalStreakDays: number;
  currentTasksCount: {
    FEEDING: number;
    CLEANING: number;
    HEALTH: number;
    SHELTER: number;
    OTHER: number;
    [key: string]: number;
  };
  priorityCount: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    [key: string]: number;
  };
}

export const TaskProgressCard = forwardRef<TaskProgressCardRefHandle, TaskProgressCardProps>(
  ({ userId, onBadgePress }, ref) => {
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState<ProgressState>({
      completedTasks: 0,
      totalStreakDays: 0,
      currentTasksCount: { 
        FEEDING: 0, 
        CLEANING: 0, 
        HEALTH: 0, 
        SHELTER: 0, 
        OTHER: 0 
      },
      priorityCount: {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      }
    });
    const [recentTasks, setRecentTasks] = useState<Task[]>([]);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const badgeScaleAnim = useRef(new Animated.Value(0.8)).current;
    const confettiRef = useRef<LottieView>(null);

    // Expose refresh method to parent component
    useImperativeHandle(ref, () => ({
      refresh: () => {
        console.log('TaskProgressCard - Refreshing data for user:', userId);
        if (userId) {
          loadProgress();
          loadRecentTasks();
          
          // Trigger confetti animation on refresh if there are achievements
          if (progress.totalStreakDays > 0 || progress.completedTasks > 4) {
            confettiRef.current?.play();
          }
        }
      }
    }));

    useEffect(() => {
      if (userId) {
        loadProgress();
        loadRecentTasks();

        // Start animations
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(badgeScaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          })
        ]).start(() => {
          // Play confetti animation if user has achievements
          if (progress.totalStreakDays > 0 || progress.completedTasks > 4) {
            confettiRef.current?.play();
          }
        });
      }
    }, [userId]);

    const loadProgress = async () => {
      try {
        setLoading(true);
        const xpService = XPService.getInstance();
        const progressData = await xpService.getTaskProgress(userId);
        
        // Create proper default data structure with existing keys
        const defaultTaskCounts = {
          FEEDING: 0, 
          CLEANING: 0, 
          HEALTH: 0, 
          SHELTER: 0, 
          OTHER: 0
        };
        
        // Ensure all required fields exist with proper types
        const validatedData: ProgressState = {
          completedTasks: progressData?.completedTasks || 0,
          totalStreakDays: progressData?.totalStreakDays || 0,
          currentTasksCount: { 
            ...defaultTaskCounts,
            ...(progressData?.currentTasksCount || {})
          },
          priorityCount: {
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0
          }
        };
        
        setProgress(validatedData);
      } catch (error) {
        console.error('Error loading progress:', error);
        // Keep default values in case of error
      } finally {
        setLoading(false);
      }
    };

    const loadRecentTasks = async () => {
      try {
        const taskService = TaskService.getInstance();
        const allTasks = await taskService.getTasks();
        
        // Filter tasks that are completed by this user
        const userCompletedTasks = allTasks.filter(
          task => task.status === 'COMPLETED' && task.completedBy?.id === userId
        );
        
        // Sort by completion date (most recent first)
        userCompletedTasks.sort((a, b) => {
          const dateA = new Date(a.completedBy?.completedAt || 0).getTime();
          const dateB = new Date(b.completedBy?.completedAt || 0).getTime();
          return dateB - dateA;
        });

        // Count priorities
        const priorityCounts: ProgressState['priorityCount'] = {
          HIGH: 0,
          MEDIUM: 0,
          LOW: 0
        };
        
        // Count by categories to double check the data
        const categoryCounts: ProgressState['currentTasksCount'] = {
          FEEDING: 0,
          CLEANING: 0,
          HEALTH: 0,
          SHELTER: 0,
          OTHER: 0
        };
        
        userCompletedTasks.forEach(task => {
          // Count by priority
          if (task.priority) {
            priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
          }
          
          // Count by category
          if (task.category) {
            categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
          }
        });

        console.log('Found completed tasks by user:', userCompletedTasks.length);
        console.log('Priority counts:', priorityCounts);
        console.log('Category counts:', categoryCounts);

        // Get only the 5 most recent tasks
        setRecentTasks(userCompletedTasks.slice(0, 5));
        
        // Update the progress state with the counted data
        setProgress(prev => ({
          ...prev,
          priorityCount: priorityCounts,
          // Update completed tasks count in case the API data is not accurate
          completedTasks: userCompletedTasks.length,
          // Only update category counts if they're significantly different from API data
          ...(userCompletedTasks.length > prev.completedTasks ? { currentTasksCount: categoryCounts } : {})
        }));
      } catch (error) {
        console.error('Error loading recent tasks:', error);
      }
    };

    const calculateBadgeProgress = (badgeId: string) => {
      switch (badgeId) {
        case 'helper_bronze':
          return Math.min(progress.completedTasks / 5, 1);
        case 'feeding_specialist':
          return Math.min(progress.currentTasksCount.FEEDING / 10, 1);
        case 'health_hero':
          return Math.min(progress.currentTasksCount.HEALTH / 10, 1);
        case 'shelter_builder':
          return Math.min(progress.currentTasksCount.SHELTER / 10, 1);
        default:
          return 0;
      }
    };

    const getCategoryLabel = (category: string) => {
      switch (category) {
        case 'FEEDING': return 'Besleme';
        case 'CLEANING': return 'Temizlik';
        case 'HEALTH': return 'Sağlık';
        case 'SHELTER': return 'Barınak';
        default: return 'Diğer';
      }
    };

    const getCategoryColor = (category: string) => {
      switch (category) {
        case 'FEEDING': return '#4CAF50'; // Green
        case 'CLEANING': return '#2196F3'; // Blue
        case 'HEALTH': return '#F44336';   // Red
        case 'SHELTER': return '#FF9800';  // Orange
        case 'OTHER': return '#9C27B0';    // Purple
        default: return colors.primary;
      }
    };

    const getPriorityLabel = (priority: TaskPriority) => {
      switch (priority) {
        case 'HIGH': return 'ACİL';
        case 'MEDIUM': return 'ÖNEMLİ';
        case 'LOW': return 'DÜŞÜK ÖNCELİK';
        default: return 'NORMAL';
      }
    };

    const getPriorityColor = (priority: TaskPriority) => {
      switch (priority) {
        case 'HIGH': return colors.error;
        case 'MEDIUM': return colors.warning;
        case 'LOW': return colors.info;
        default: return colors.primary;
      }
    };

    const renderBadge = (
      title: string, 
      count: number, 
      maxCount: number,
      color: string,
      icon: React.ReactNode,
      delay: number = 0
    ) => {
      const isComplete = count >= maxCount;
      const scaleAnim = useRef(new Animated.Value(0.8)).current;
      const opacityAnim = useRef(new Animated.Value(0)).current;
      
      useEffect(() => {
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 500,
            delay,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            delay,
            useNativeDriver: true,
          })
        ]).start();
      }, []);

      return (
        <Animated.View 
          style={[
            styles.badgeContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Surface style={[styles.badgeCircle, isComplete && { backgroundColor: color }]}>
            {icon}
            {isComplete && (
              <View style={styles.badgeStar}>
                <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            )}
          </Surface>
          <Text style={styles.badgeTitle}>{title}</Text>
          <Text style={[styles.badgeCount, isComplete && { color }]}>
            {count}/{maxCount}
          </Text>
          <ProgressBar 
            progress={Math.min(count / maxCount, 1)} 
            color={color} 
            style={styles.badgeProgress} 
          />
        </Animated.View>
      );
    };

    const renderPriorityBadges = () => {
      return (
        <View style={styles.badgesRow}>
          {renderBadge(
            'ACİL',
            progress.priorityCount.HIGH,
            5,
            colors.error,
            <Shield size={20} color={progress.priorityCount.HIGH >= 5 ? "#FFFFFF" : colors.error} />,
            200
          )}
          {renderBadge(
            'ÖNEMLİ',
            progress.priorityCount.MEDIUM,
            10,
            colors.warning,
            <AlertTriangle size={20} color={progress.priorityCount.MEDIUM >= 10 ? "#FFFFFF" : colors.warning} />,
            300
          )}
          {renderBadge(
            'DÜŞÜK',
            progress.priorityCount.LOW,
            15,
            colors.info,
            <Target size={20} color={progress.priorityCount.LOW >= 15 ? "#FFFFFF" : colors.info} />,
            400
          )}
        </View>
      );
    };

    const renderStreakBadges = () => {
export function TaskProgressCard({ userId, onBadgePress }: TaskProgressCardProps) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressState>({
    completedTasks: 0,
    totalStreakDays: 0,
    currentTasksCount: { 
      FEEDING: 0, 
      CLEANING: 0, 
      HEALTH: 0, 
      SHELTER: 0, 
      OTHER: 0 
    },
    priorityCount: {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    }
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const badgeScaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiRef = useRef<LottieView>(null);

  useEffect(() => {
    if (userId) {
      loadProgress();
      loadRecentTasks();

      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(badgeScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start(() => {
        // Play confetti animation if user has achievements
        if (progress.totalStreakDays > 0 || progress.completedTasks > 4) {
          confettiRef.current?.play();
        }
      });
    }
  }, [userId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const xpService = XPService.getInstance();
      const progressData = await xpService.getTaskProgress(userId);
      
      // Create proper default data structure with existing keys
      const defaultTaskCounts = {
        FEEDING: 0, 
        CLEANING: 0, 
        HEALTH: 0, 
        SHELTER: 0, 
        OTHER: 0
      };
      
      // Ensure all required fields exist with proper types
      const validatedData: ProgressState = {
        completedTasks: progressData?.completedTasks || 0,
        totalStreakDays: progressData?.totalStreakDays || 0,
        currentTasksCount: { 
          ...defaultTaskCounts,
          ...(progressData?.currentTasksCount || {})
        },
        priorityCount: {
          HIGH: 0,
          MEDIUM: 0,
          LOW: 0
        }
      };
      
      setProgress(validatedData);
    } catch (error) {
      console.error('Error loading progress:', error);
      // Keep default values in case of error
    } finally {
      setLoading(false);
    }
  };

  const loadRecentTasks = async () => {
    try {
      const taskService = TaskService.getInstance();
      const allTasks = await taskService.getTasks();
      
      // Filter tasks that are completed by this user
      const userCompletedTasks = allTasks.filter(
        task => task.status === 'COMPLETED' && task.completedBy?.id === userId
      );
      
      // Sort by completion date (most recent first)
      userCompletedTasks.sort((a, b) => {
        const dateA = new Date(a.completedBy?.completedAt || 0).getTime();
        const dateB = new Date(b.completedBy?.completedAt || 0).getTime();
        return dateB - dateA;
      });

      // Count priorities
      const priorityCounts: ProgressState['priorityCount'] = {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      };
      
      // Count by categories to double check the data
      const categoryCounts: ProgressState['currentTasksCount'] = {
        FEEDING: 0,
        CLEANING: 0,
        HEALTH: 0,
        SHELTER: 0,
        OTHER: 0
      };
      
      userCompletedTasks.forEach(task => {
        // Count by priority
        if (task.priority) {
          priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
        }
        
        // Count by category
        if (task.category) {
          categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
        }
      });

      console.log('Found completed tasks by user:', userCompletedTasks.length);
      console.log('Priority counts:', priorityCounts);
      console.log('Category counts:', categoryCounts);

      // Get only the 5 most recent tasks
      setRecentTasks(userCompletedTasks.slice(0, 5));
      
      // Update the progress state with the counted data
      setProgress(prev => ({
        ...prev,
        priorityCount: priorityCounts,
        // Update completed tasks count in case the API data is not accurate
        completedTasks: userCompletedTasks.length,
        // Only update category counts if they're significantly different from API data
        ...(userCompletedTasks.length > prev.completedTasks ? { currentTasksCount: categoryCounts } : {})
      }));
    } catch (error) {
      console.error('Error loading recent tasks:', error);
    }
  };

  const calculateBadgeProgress = (badgeId: string) => {
    switch (badgeId) {
      case 'helper_bronze':
        return Math.min(progress.completedTasks / 5, 1);
      case 'feeding_specialist':
        return Math.min(progress.currentTasksCount.FEEDING / 10, 1);
      case 'health_hero':
        return Math.min(progress.currentTasksCount.HEALTH / 10, 1);
      case 'shelter_builder':
        return Math.min(progress.currentTasksCount.SHELTER / 10, 1);
      default:
        return 0;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'FEEDING': return 'Besleme';
      case 'CLEANING': return 'Temizlik';
      case 'HEALTH': return 'Sağlık';
      case 'SHELTER': return 'Barınak';
      default: return 'Diğer';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'FEEDING': return '#4CAF50'; // Green
      case 'CLEANING': return '#2196F3'; // Blue
      case 'HEALTH': return '#F44336';   // Red
      case 'SHELTER': return '#FF9800';  // Orange
      case 'OTHER': return '#9C27B0';    // Purple
      default: return colors.primary;
    }
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH': return 'ACİL';
      case 'MEDIUM': return 'ÖNEMLİ';
      case 'LOW': return 'DÜŞÜK ÖNCELİK';
      default: return 'NORMAL';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH': return colors.error;
      case 'MEDIUM': return colors.warning;
      case 'LOW': return colors.info;
      default: return colors.primary;
    }
  };

  const renderBadge = (
    title: string, 
    count: number, 
    maxCount: number,
    color: string,
    icon: React.ReactNode,
    delay: number = 0
  ) => {
    const isComplete = count >= maxCount;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          delay,
          useNativeDriver: true,
        })
      ]).start();
    }, []);

    return (
      <Animated.View 
        style={[
          styles.badgeContainer,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Surface style={[styles.badgeCircle, isComplete && { backgroundColor: color }]}>
          {icon}
          {isComplete && (
            <View style={styles.badgeStar}>
              <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          )}
        </Surface>
        <Text style={styles.badgeTitle}>{title}</Text>
        <Text style={[styles.badgeCount, isComplete && { color }]}>
          {count}/{maxCount}
        </Text>
        <ProgressBar 
          progress={Math.min(count / maxCount, 1)} 
          color={color} 
          style={styles.badgeProgress} 
        />
      </Animated.View>
    );
  };

  const renderPriorityBadges = () => {
    return (
      <View style={styles.badgesRow}>
        {renderBadge(
          'ACİL',
          progress.priorityCount.HIGH,
          5,
          colors.error,
          <Shield size={20} color={progress.priorityCount.HIGH >= 5 ? "#FFFFFF" : colors.error} />,
          200
        )}
        {renderBadge(
          'ÖNEMLİ',
          progress.priorityCount.MEDIUM,
          10,
          colors.warning,
          <AlertTriangle size={20} color={progress.priorityCount.MEDIUM >= 10 ? "#FFFFFF" : colors.warning} />,
          300
        )}
        {renderBadge(
          'DÜŞÜK',
          progress.priorityCount.LOW,
          15,
          colors.info,
          <Target size={20} color={progress.priorityCount.LOW >= 15 ? "#FFFFFF" : colors.info} />,
          400
        )}
      </View>
    );
  };

  const renderStreakBadges = () => {
    const streakMilestones = [
      { days: 3, color: BADGE_LEVELS.BRONZE.color },
      { days: 7, color: BADGE_LEVELS.SILVER.color },
      { days: 14, color: BADGE_LEVELS.GOLD.color },
      { days: 30, color: BADGE_LEVELS.DIAMOND.color }
    ];

    return (
      <View style={styles.badgesRow}>
        {streakMilestones.map((milestone, index) => (
          renderBadge(
            `${milestone.days} Gün`,
            progress.totalStreakDays,
            milestone.days,
            milestone.color,
            <Flame size={20} color={progress.totalStreakDays >= milestone.days ? "#FFFFFF" : milestone.color} />,
            200 + (index * 100)
          )
        ))}
      </View>
    );
  };

  return (
    <Card style={styles.container}>
      <LottieView 
        ref={confettiRef}
        source={require('../assets/animations/confetti.json')} 
        style={styles.confettiAnimation}
        autoPlay={false}
        loop={false}
      />

      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <Card.Content>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Görev İlerlemen</Text>
            <TouchableOpacity onPress={onBadgePress}>
              <Award size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <Divider style={styles.divider} />

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Toplam Görevler */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <CheckCircle size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Tamamlanan Görevler</Text>
              </View>
              
              <View style={styles.progressValue}>
                <Text style={styles.progressValueText}>{progress.completedTasks}</Text>
                <Text style={styles.progressLabel}>görev</Text>
              </View>
              
              <View style={styles.badgeProgressContainer}>
                <Text style={styles.badgeLabel}>
                  Yardımsever Rozeti: {progress.completedTasks}/5 görev
                </Text>
                <ProgressBar 
                  progress={calculateBadgeProgress('helper_bronze')} 
                  color={colors.primary} 
                  style={styles.progressBar} 
                />
              </View>
            </View>

            {/* Görev Öncelik Rozetleri */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Shield size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Öncelik Rozetleri</Text>
              </View>
              
              {renderPriorityBadges()}
              
              <Text style={styles.streakInfo}>
                Farklı öncelikteki görevleri tamamlayarak rozetler kazanın!
              </Text>
            </View>

            {/* Görev Serisi */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Flame size={18} color="#FF9800" />
                <Text style={styles.sectionTitle}>Görev Serisi</Text>
              </View>
              
              <View style={styles.progressValue}>
                <Text style={styles.progressValueText}>{progress.totalStreakDays}</Text>
                <Text style={styles.progressLabel}>gün</Text>
              </View>
              
              {renderStreakBadges()}
              
              <Text style={styles.streakInfo}>
                Art arda görev tamamladığınızda seri oluşturarak fazladan XP ve rozetler kazanırsınız!
              </Text>
            </View>

            {/* Kategori Bazında İlerleme */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Star size={18} color="#4CAF50" />
                <Text style={styles.sectionTitle}>Kategori Rozetleri</Text>
              </View>
              
              {Object.entries(progress.currentTasksCount).map(([category, count]) => (
                <View key={category} style={styles.categoryProgress}>
                  <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(category) }]} />
                  <Text style={styles.categoryLabel}>{getCategoryLabel(category)}</Text>
                  <Text style={styles.categoryCount}>{count}/10</Text>
                  <ProgressBar 
                    progress={Math.min(count / 10, 1)} 
                    color={getCategoryColor(category)} 
                    style={styles.progressBar} 
                  />
                  {count >= 10 && (
                    <Medal size={16} color={getCategoryColor(category)} style={styles.categoryMedal} />
                  )}
                </View>
              ))}
              
              <Text style={styles.categoryInfo}>
                Her kategoride 10 görev tamamladığınızda özel rozetler kazanırsınız!
              </Text>
            </View>

            {/* Son Tamamlanan Görevler */}
            {recentTasks.length > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <CheckCircle size={18} color={colors.success} />
                  <Text style={styles.sectionTitle}>Son Tamamlanan</Text>
                </View>
                
                {recentTasks.map((task, index) => (
                  <Animated.View 
                    key={task.id} 
                    style={[
                      styles.recentTaskItem,
                      {
                        opacity: fadeAnim,
                        transform: [{ 
                          translateY: Animated.multiply(
                            slideAnim, 
                            new Animated.Value((index + 1) * 0.5)
                          ) 
                        }]
                      }
                    ]}
                  >
                    <View style={styles.recentTaskHeader}>
                      <Text numberOfLines={1} style={styles.recentTaskTitle}>
                        {task.title}
                      </Text>
                      {task.priority && (
                        <Badge 
                          style={[
                            styles.priorityBadge, 
                            { backgroundColor: getPriorityColor(task.priority) }
                          ]}
                        >
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      )}
                    </View>
                    <View style={styles.recentTaskFooter}>
                      <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(task.category) }]}>
                        <Text style={styles.categoryTagText}>
                          {getCategoryLabel(task.category)}
                        </Text>
                      </View>
                      <Text style={styles.recentTaskDate}>
                        {new Date(task.completedBy?.completedAt || '').toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </ScrollView>
        </Card.Content>
      </Animated.View>
    </Card>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    borderRadius: borderRadius.medium,
    ...shadows.medium,
    maxHeight: 500, // Make sure it's scrollable by limiting height
    overflow: 'hidden'
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    color: colors.text,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: spacing.sm,
  },
  progressSection: {
    marginVertical: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  progressValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  progressValueText: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  badgeProgressContainer: {
    marginTop: spacing.xs,
  },
  badgeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  streakMilestones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },
  milestoneDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedMilestone: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  checkMark: {
    width: 6,
    height: 6,
    backgroundColor: 'white',
    borderRadius: 3,
  },
  streakInfo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  categoryProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  categoryLabel: {
    fontSize: 14,
    color: colors.text,
    width: 80,
  },
  categoryCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: spacing.sm,
    width: 40,
    textAlign: 'right',
  },
  categoryInfo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  badgeContainer: {
    alignItems: 'center',
    width: (width - spacing.md * 4) / 3,
    marginBottom: spacing.md,
  },
  badgeCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    ...shadows.small,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  badgeCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  badgeProgress: {
    height: 4,
    width: '80%',
    borderRadius: 4,
  },
  badgeStar: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.success,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  confettiAnimation: {
    position: 'absolute',
    top: -100,
    left: 0,
    right: 0,
    height: 300,
    zIndex: 20,
    pointerEvents: 'none',
  },
  categoryMedal: {
    marginLeft: spacing.xs,
  },
  recentTaskItem: {
    padding: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.small,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  recentTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recentTaskTitle: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  priorityBadge: {
    marginLeft: spacing.xs,
  },
  recentTaskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  recentTaskDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
}); 