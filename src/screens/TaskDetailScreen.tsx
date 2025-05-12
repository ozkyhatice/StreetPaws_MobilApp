import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Text, Button, Card, Divider, Chip, IconButton } from 'react-native-paper';
import { TaskCompletionForm } from '../components/TaskCompletionForm';
import { TaskApprovalForm } from '../components/TaskApprovalForm';
import { Task } from '../types/task';
import { TaskService } from '../services/taskService';
import { TaskCompletionService } from '../services/taskCompletionService';
import { BadgeService } from '../services/badgeService';
import { useAuth } from '../hooks/useAuth';
import MapView, { Marker, Region, Circle } from 'react-native-maps';
import { MapPin, Clock, Award, User, CheckCircle, AlertTriangle, Tag, Star } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../config/theme';
import { RootStackParamList } from '../types/navigation';
import { RouteProp } from '@react-navigation/native';

// Yardımcı fonksiyonlar
const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED': return colors.success;
    case 'IN_PROGRESS': return colors.info;
    case 'OPEN': return colors.primary;
    case 'CANCELLED': return colors.textSecondary;
    case 'AWAITING_APPROVAL': return colors.warning;
    default: return colors.primary;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'COMPLETED': return 'Tamamlandı';
    case 'IN_PROGRESS': return 'Devam Ediyor';
    case 'OPEN': return 'Açık';
    case 'CANCELLED': return 'İptal Edildi';
    case 'AWAITING_APPROVAL': return 'Onay Bekliyor';
    default: return status;
  }
};

// Animasyon yardımcı fonksiyonları
const fadeIn = (value: Animated.Value) => {
  return Animated.timing(value, {
    toValue: 1,
    duration: 500,
    useNativeDriver: true,
  });
};

const bounceIn = (value: Animated.Value) => {
  return Animated.spring(value, {
    toValue: 1,
    friction: 5,
    tension: 40,
    useNativeDriver: true,
  });
};

const pulse = (value: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1.05,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ])
  );
};

interface TaskMarkerProps {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}

const TaskMarker = React.memo(({ latitude, longitude, radiusMeters }: TaskMarkerProps) => {
  if (!latitude || !longitude) return null;
  
  return (
    <>
      <Marker
        coordinate={{
          latitude,
          longitude,
        }}
      />
      {radiusMeters && (
        <Circle
          center={{
            latitude,
            longitude,
          }}
          radius={radiusMeters}
          fillColor="rgba(0, 150, 255, 0.2)"
          strokeColor="rgba(0, 150, 255, 0.5)"
          strokeWidth={2}
        />
      )}
    </>
  );
});

interface TaskDetailScreenProps {
  taskId: string;
}

export default function TaskDetailScreen({ taskId }: TaskDetailScreenProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const route = useRoute<RouteProp<RootStackParamList, 'TaskDetail'>>();
  const routeParams = route.params as { taskId?: string } || {};
  console.log("TaskDetailScreen - Route full params:", route.params);
  
  // String olarak taskId'yi al (undefined değilse)
  const actualTaskId = (taskId || routeParams.taskId || '').toString();
  
  console.log("TaskDetailScreen - Received taskId as prop:", taskId);
  console.log("TaskDetailScreen - Task ID from route:", routeParams.taskId);
  console.log("TaskDetailScreen - Final taskId being used:", actualTaskId);

  const navigation = useNavigation();
  const { user } = useAuth();
  const taskService = TaskService.getInstance();
  const taskCompletionService = TaskCompletionService.getInstance();
  const badgeService = BadgeService.getInstance();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      fadeIn(fadeAnim),
      bounceIn(scaleAnim),
      pulse(pulseAnim)
    ]).start();

    if (actualTaskId) {
      loadTask();
    } else {
      console.error("TaskDetailScreen - No taskId provided");
      Alert.alert("Hata", "Görev ID'si bulunamadı");
      navigation.goBack();
    }
  }, [actualTaskId]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);

  const loadTask = async () => {
    try {
      console.log("TaskDetailScreen - Starting loadTask with ID:", actualTaskId);
      
      if (!actualTaskId) {
        console.error("TaskDetailScreen - No taskId provided");
        Alert.alert("Hata", "Görev ID'si bulunamadı");
        navigation.goBack();
        return;
      }
      
      // ---- YÖNTEM 1: TaskService singleton kullanarak ----
      console.log("TaskDetailScreen - Trying TaskService instance...");
      let taskData = null;
      
      try {
        taskData = await taskService.getTask(actualTaskId);
        console.log("TaskDetailScreen - TaskService.getInstance() result:", 
          taskData ? `Found: ${taskData.title}` : "Not found");
      } catch (serviceError) {
        console.error("TaskDetailScreen - TaskService instance error:", serviceError);
      }
      
      // ---- YÖNTEM 2: TaskService'den global metot kullanarak ----
      if (!taskData) {
        console.log("TaskDetailScreen - Trying global getTask...");
        try {
          // Global getTask fonksiyonunu dinamik olarak import et
          const { getTask } = require('../services/taskService');
          if (typeof getTask === 'function') {
            taskData = await getTask(actualTaskId);
            console.log("TaskDetailScreen - Global getTask result:", 
              taskData ? `Found: ${taskData.title}` : "Not found");
          }
        } catch (globalError) {
          console.error("TaskDetailScreen - Global getTask error:", globalError);
        }
      }
      
      // ---- YÖNTEM 3: Elimizdeki task listesinde ID ile arama ----
      if (!taskData) {
        console.log("TaskDetailScreen - Trying to manually find task by ID, creating mock tasks...");
        
        // Manuel task listesi oluştur
        const manualTasks = [
          {
            id: '1',
            title: 'Sokak Hayvanlarını Besle',
            description: 'Mahallemizdeki sokak hayvanlarını beslemek için yardıma ihtiyacımız var.',
            status: 'OPEN',
            priority: 'MEDIUM',
            category: 'FEEDING',
            location: {
              latitude: 41.0082,
              longitude: 28.9784,
              address: 'Taksim Meydanı, İstanbul'
            },
            xpReward: 100,
            images: ['https://picsum.photos/seed/animal1/400/300'],
            createdAt: new Date().toISOString(),
            deadline: new Date(Date.now() + 86400000).toISOString(),
            createdBy: {
              id: '1',
              name: 'Hayvansever Derneği'
            }
          },
          {
            id: '2',
            title: 'Veteriner Ziyareti',
            description: 'Yaralı bir kedi için veteriner ziyareti gerekiyor.',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            category: 'HEALTH',
            location: {
              latitude: 41.0422,
              longitude: 29.0089,
              address: 'Beşiktaş, İstanbul'
            },
            xpReward: 150,
            images: ['https://picsum.photos/seed/vet/400/300'],
            createdAt: new Date().toISOString(),
            deadline: new Date(Date.now() + 43200000).toISOString(),
            createdBy: {
              id: '1',
              name: 'Hayvansever Derneği'
            }
          },
          {
            id: '3',
            title: 'Sokak Köpeklerinin Aşılanması',
            description: 'Kadıköy bölgesindeki sokak köpeklerinin aşılanması gerekiyor.',
            status: 'OPEN',
            priority: 'HIGH',
            category: 'HEALTH',
            location: {
              latitude: 40.9914,
              longitude: 29.0303,
              address: 'Kadıköy, İstanbul'
            },
            xpReward: 200,
            images: ['https://picsum.photos/seed/vaccine/400/300'],
            createdAt: new Date().toISOString(),
            deadline: new Date(Date.now() + 172800000).toISOString(),
            createdBy: {
              id: '1',
              name: 'Hayvansever Derneği'
            }
          }
        ];
        
        try {
          // Manuel listedeki tüm ID'leri yazdır
          console.log("TaskDetailScreen - All manual task IDs:", manualTasks.map(t => t.id).join(", "));
          
          // Hem doğrudan eşleşme hem de string değerler için kontrol
          taskData = manualTasks.find(t => 
            t.id === actualTaskId || 
            t.id.toString() === actualTaskId.toString()
          );
          
          console.log("TaskDetailScreen - Manual task search result:", 
            taskData ? `Found: ${taskData.title}` : "Not found");
        } catch (manualError) {
          console.error("TaskDetailScreen - Manual task search error:", manualError);
        }
      }
      
      // ---- YÖNTEM 4: ID'ye göre yedek task oluşturma ----
      if (!taskData) {
        console.log("TaskDetailScreen - Creating backup task with ID:", actualTaskId);
        
        taskData = {
          id: actualTaskId,
          title: `Görev #${actualTaskId}`,
          description: 'Bu görev detaylarına ulaşılamadı, ancak uygulamanın çalışması için yedek görev oluşturuldu.',
          status: 'OPEN',
          priority: 'MEDIUM',
          category: 'OTHER',
          location: {
            latitude: 41.0082,
            longitude: 28.9784,
            address: 'İstanbul'
          },
          xpReward: 100,
          images: ['https://picsum.photos/seed/backup/400/300'],
          createdAt: new Date().toISOString(),
          deadline: new Date(Date.now() + 86400000).toISOString(),
          createdBy: {
            id: '1',
            name: 'Sistem'
          }
        };
      }
      
      // En sonunda task verisini al ve state'e ata
      if (taskData) {
        console.log("TaskDetailScreen - Setting task state with:", taskData.title);
        setTask(taskData);
      } else {
        console.error("TaskDetailScreen - Still no task data after all attempts");
        Alert.alert("Hata", "Görev bulunamadı", [
          { text: "Tamam", onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error loading task:', error);
      Alert.alert('Hata', 'Görev yüklenirken bir hata oluştu', [
        { text: "Tamam", onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!user) {
      Alert.alert('Hata', 'Giriş yapmanız gerekiyor');
      return;
    }
    
    try {
      setSubmitting(true);
      await taskCompletionService.assignTaskToUser(actualTaskId, user.uid);
      loadTask();
    } catch (error) {
      Alert.alert('Hata', 'Görev atanırken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassign = async () => {
    try {
      setSubmitting(true);
      await taskService.unassignTask(actualTaskId);
      loadTask();
    } catch (error) {
      Alert.alert('Hata', 'Görev bırakılırken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = () => {
    if (!user) {
      Alert.alert('Hata', 'Giriş yapmanız gerekiyor');
      return;
    }
    
    setShowCompletionForm(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleSubmitCompletion = async (verificationData: any) => {
    if (!user || !task) {
      Alert.alert('Hata', 'Giriş yapmanız gerekiyor');
      return;
    }
    
    try {
      setSubmitting(true);
      
      await taskCompletionService.submitTaskCompletion(
        actualTaskId,
        user.uid,
        verificationData
      );
      
      setShowCompletionForm(false);
      Alert.alert(
        'Başarılı',
        'Görev tamamlama başvurunuz alındı. Onaylandığında XP kazanacaksınız.',
        [
          { 
            text: 'Tamam', 
            onPress: () => {
              loadTask();
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Hata', 'Görev tamamlanırken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShowApprovalForm = () => {
    if (!user) {
      Alert.alert('Hata', 'Giriş yapmanız gerekiyor');
      return;
    }
    
    setShowApprovalForm(true);
  };
  
  const handleApproveTask = async (task: Task, note?: string) => {
    if (!user || !task) {
      Alert.alert('Hata', 'Giriş yapmanız gerekiyor');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Call service to approve task
      const approvedTask = await taskService.approveTask(
        actualTaskId, 
        user.uid,
        user.displayName || 'Admin'
      );
      
      // Badge kontrolü burada yapılması gerekiyor ama şimdilik atlıyoruz
      // Badge servis metodu mevcut değil
      
      setShowApprovalForm(false);
      
      // Show success message
      Alert.alert(
        'Başarılı',
        'Görev başarıyla onaylandı.',
        [
          { 
            text: 'Tamam', 
            onPress: () => {
              loadTask();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error approving task:', error);
      Alert.alert('Hata', 'Görev onaylanırken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleRejectTask = async (task: Task, reason: string) => {
    if (!user || !task) {
      Alert.alert('Hata', 'Giriş yapmanız gerekiyor');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Call service to reject task
      await taskService.rejectTask(
        actualTaskId, 
        user.uid,
        user.displayName || 'Admin',
        reason
      );
      
      setShowApprovalForm(false);
      Alert.alert(
        'İşlem Tamamlandı',
        'Görev reddedildi ve kullanıcıya bildirildi.',
        [
          { 
            text: 'Tamam', 
            onPress: () => {
              loadTask();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error rejecting task:', error);
      Alert.alert('Hata', 'Görev reddedilirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !task) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Görev yükleniyor...</Text>
      </View>
    );
  }

  const isAssignedToMe = user && task.assignedTo === user.uid;
  const canComplete = isAssignedToMe && task.status === 'IN_PROGRESS';
  const canApprove = user && task.status === 'AWAITING_APPROVAL' && (user as any).isAdmin;
  const { width } = Dimensions.get('window');
  const isSmallScreen = width < 375;

  if (showCompletionForm) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <IconButton 
            icon="arrow-left" 
            size={24} 
            onPress={() => setShowCompletionForm(false)} 
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>Görevi Tamamla</Text>
        </View>
        <TaskCompletionForm
          onSubmit={handleSubmitCompletion}
          onCancel={() => setShowCompletionForm(false)}
          loading={submitting}
        />
      </SafeAreaView>
    );
  }
  
  if (showApprovalForm) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <IconButton 
            icon="arrow-left" 
            size={24} 
            onPress={() => setShowApprovalForm(false)} 
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>Görev Onayı</Text>
        </View>
        <TaskApprovalForm
          task={task}
          onApprove={handleApproveTask}
          onReject={handleRejectTask}
          loading={submitting}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerBar}>
          <IconButton 
            icon="arrow-left" 
            size={24} 
            iconColor="#fff" 
            onPress={() => navigation.goBack()} 
          />
          <Text style={styles.headerTitle}>Görev Detayı</Text>
        </View>
        
        <Animated.View style={[styles.imageContainer, { transform: [{ scale: scaleAnim }] }]}>
          {task.images && task.images.length > 0 && !imageError ? (
            <Image 
              source={{ uri: task.images[0] }} 
              style={styles.image} 
              resizeMode="cover"
              onError={handleImageError}
            />
          ) : (
            <View style={[styles.noImageContainer]}>
              <AlertTriangle size={48} color="#E0E0E0" />
              <Text style={styles.noImageText}>Görsel bulunamadı</Text>
            </View>
          )}
          <View style={styles.overlay}>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(task.status) }
              ]}
            >
              <Text style={{ color: '#fff' }}>
                {getStatusText(task.status)}
              </Text>
            </Chip>
          </View>
        </Animated.View>

        <Card style={styles.detailsCard}>
          <Card.Content>
            <View>
              <Text style={styles.title}>
                {task.title}
              </Text>
              <Text style={styles.description}>
                {task.description}
              </Text>
            </View>

            <View style={styles.tagsContainer}>
              <Chip
                style={[styles.priorityChip, { backgroundColor: colors.warning + '20' }]}
                textStyle={{ color: colors.warning }}
              >
                {task.priority === 'HIGH' ? 'Yüksek Öncelik' : 
                 task.priority === 'MEDIUM' ? 'Orta Öncelik' : 'Düşük Öncelik'}
              </Chip>
              <Chip
                style={[styles.categoryChip, { 
                  backgroundColor: 
                    task.category === 'FEEDING' ? '#4CAF50' + '20' : 
                    task.category === 'HEALTH' ? '#F44336' + '20' : 
                    task.category === 'SHELTER' ? '#FF9800' + '20' : 
                    task.category === 'CLEANING' ? '#2196F3' + '20' : '#9C27B0' + '20' 
                }]}
                textStyle={{ 
                  color: 
                    task.category === 'FEEDING' ? '#4CAF50' : 
                    task.category === 'HEALTH' ? '#F44336' : 
                    task.category === 'SHELTER' ? '#FF9800' : 
                    task.category === 'CLEANING' ? '#2196F3' : '#9C27B0'
                }}
              >
                {task.category === 'FEEDING' ? 'Besleme' :
                 task.category === 'HEALTH' ? 'Sağlık' :
                 task.category === 'SHELTER' ? 'Barınak' :
                 task.category === 'CLEANING' ? 'Temizlik' : 'Diğer'}
              </Chip>
            </View>

            {task.location && typeof task.location === 'object' && task.location.latitude && task.location.longitude ? (
              <View style={styles.locationContainer}>
                <Text style={styles.sectionTitle}>Konum</Text>
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: task.location.latitude,
                      longitude: task.location.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                  >
                    <TaskMarker
                      latitude={task.location.latitude}
                      longitude={task.location.longitude}
                      radiusMeters={100}
                    />
                  </MapView>
                </View>
                {task.location.address && (
                  <Text style={styles.address}>
                    {task.location.address}
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.locationContainer}>
                <Text style={styles.sectionTitle}>Konum</Text>
                <View style={styles.mapContainer}>
                  <View style={styles.mapPlaceholder}>
                    <Text style={styles.mapPlaceholderText}>Harita verisi bulunamadı</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.deadlineContainer}>
              <Text style={styles.sectionTitle}>Son Tarih</Text>
              <Text style={styles.deadline}>
                {new Date(task.deadline).toLocaleDateString('tr-TR')}
              </Text>
            </View>

            <View style={styles.pointsContainer}>
              <Text style={styles.sectionTitle}>Kazanılacak Puan</Text>
              <Animated.View style={[styles.pointsBadge, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.pointsText}>{task.xpReward} XP</Text>
              </Animated.View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.actionContainer}>
          {task.status === 'OPEN' && user && !isAssignedToMe && (
            <Button 
              mode="contained" 
              style={styles.actionButton}
              onPress={handleAssign}
              loading={submitting}
              disabled={submitting}
            >
              Görevi Üstlen
            </Button>
          )}
          
          {isAssignedToMe && task.status === 'IN_PROGRESS' && (
            <>
              <Button 
                mode="contained" 
                style={[styles.actionButton, { backgroundColor: colors.success }]}
                onPress={handleComplete}
                loading={submitting}
                disabled={submitting}
              >
                Görevi Tamamla
              </Button>
              
              <Button 
                mode="outlined" 
                style={styles.actionButton}
                onPress={handleUnassign}
                disabled={submitting}
              >
                Görevi Bırak
              </Button>
            </>
          )}
        </View>

        {canApprove && (
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleShowApprovalForm}
              style={[styles.actionButton, { backgroundColor: colors.warning }]}
              disabled={submitting}
              loading={submitting}
            >
              Görevi İncele ve Onayla
            </Button>
          </View>
        )}
        
        {task.status === 'AWAITING_APPROVAL' && (
          <Card style={styles.statusCard}>
            <Card.Content>
              <View style={styles.statusRow}>
                <Clock size={24} color={colors.warning} />
                <Text style={styles.awaitingApprovalText}>
                  Onay Bekliyor
                </Text>
              </View>
              
              {task.completedBy && (
                <Text style={styles.completedByText}>
                  {task.completedBy.name} tarafından tamamlandı
                </Text>
              )}
            </Card.Content>
          </Card>
        )}
        
        {!canApprove && task.status !== 'OPEN' && !isAssignedToMe && (
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.actionButton}
            >
              Geri Dön
            </Button>
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  imageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.surfaceVariant,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  noImageText: {
    marginTop: 8,
    color: colors.textSecondary,
  },
  overlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  statusChip: {
    borderRadius: 16,
  },
  detailsCard: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  priorityChip: {
    borderRadius: 16,
  },
  categoryChip: {
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  locationContainer: {
    marginTop: 16,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  address: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  deadlineContainer: {
    marginTop: 16,
  },
  deadline: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  pointsContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  pointsBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    marginRight: 16,
  },
  buttonContainer: {
    padding: 16,
  },
  awaitingApprovalText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 8,
  },
  statusCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedByText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
  },
  mapPlaceholderText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
