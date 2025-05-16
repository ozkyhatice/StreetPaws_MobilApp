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
import { EmergencyService } from '../services/emergencyService';
import { useAuth } from '../hooks/useAuth';
import MapView, { Marker, Region, Circle } from 'react-native-maps';
import { MapPin, Clock, Award, User, CheckCircle, AlertTriangle, Tag, Star } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../config/theme';
import { RootStackParamList } from '../types/navigation';
import { RouteProp } from '@react-navigation/native';
import { XPService } from '../services/xpService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

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

// Aciliyet metni ve rengini belirleyen yardımcı fonksiyon
const getEmergencyInfo = (isEmergency: boolean, priority: string) => {
  if (!isEmergency) return null;
  
  switch(priority) {
    case 'HIGH':
      return { text: 'ACİL', color: colors.error, bgColor: 'rgba(255, 107, 107, 0.2)' };
    case 'MEDIUM':
      return { text: 'ÖNEMLİ', color: colors.warning, bgColor: 'rgba(255, 193, 7, 0.2)' };
    case 'LOW':
      return { text: 'DÜŞÜK ÖNCELİK', color: colors.info, bgColor: 'rgba(33, 150, 243, 0.2)' };
    default:
      return { text: 'ACİL', color: colors.error, bgColor: 'rgba(255, 107, 107, 0.2)' };
  }
};

// Güvenli tarih formatlama yardımcı fonksiyonu
const safeFormatDate = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return 'Belirtilmemiş';
  
  try {
    // Converting dateString to date object safely
    let date: Date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'Belirtilmemiş';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Geçersiz Tarih';
    }
    
    return date.toLocaleDateString('tr-TR');
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Geçersiz Tarih';
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
  const routeParams = route.params as { taskId?: string, action?: string } || {};
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
  const emergencyService = EmergencyService.getInstance();
  const xpService = XPService.getInstance();

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
  
  // Otomatik görev üstlenme veya onay formu için useEffect
  useEffect(() => {
    // Route parametrelerinden action'ı al
    const routeParams = route.params as { taskId?: string, action?: string } || {};
    
    // Görev yüklenmiş ve hazır olduğunda routeParams'dan gelen action'a göre işlem yap
    if (task && !loading && !submitting) {
      if (routeParams.action === 'take' && canTakeTask) {
        // Görev üstlenme
        console.log("TaskDetailScreen - Auto taking task from route params action");
        handleAssign();
      } else if (routeParams.action === 'showApproval' && canApprove) {
        // Onay formunu göster
        console.log("TaskDetailScreen - Showing approval form from route params action");
        setShowApprovalForm(true);
      }
    }
  }, [task, loading]); // task ve loading değiştiğinde kontrol et

  const loadTask = async () => {
    try {
      console.log("TaskDetailScreen - Starting loadTask with ID:", actualTaskId);
      
      if (!actualTaskId) {
        console.error("TaskDetailScreen - No taskId provided");
        Alert.alert("Hata", "Görev ID'si bulunamadı");
        navigation.goBack();
        return;
      }
      
      // Görev ID'sini temizle (boşluk veya geçersiz karakterleri kaldır)
      const cleanTaskId = actualTaskId.toString().trim();
      
      if (cleanTaskId === '') {
        console.error("TaskDetailScreen - Empty taskId after cleaning");
        Alert.alert("Hata", "Geçersiz görev ID'si");
        navigation.goBack();
        return;
      }
      
      console.log("TaskDetailScreen - Using clean taskId:", cleanTaskId);
      
      // Firestore'dan görevi yüklemeyi dene
      try {
        console.log("TaskDetailScreen - Querying Firestore for task with ID:", cleanTaskId);
        
        // Firestore'da kullanılan task koleksiyonu ismi
        const tasksCollectionName = 'tasks';
        
        const docRef = doc(db, tasksCollectionName, cleanTaskId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const taskData = {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
            deadline: data.deadline?.toDate?.() ? data.deadline.toDate().toISOString() : data.deadline,
          } as Task;
          
          console.log("TaskDetailScreen - Task found in Firestore:", taskData.title);
          setTask(taskData);
          return;
        } else {
          console.log("TaskDetailScreen - No task found in Firestore with ID:", cleanTaskId);
        }
      } catch (firestoreError) {
        console.error("TaskDetailScreen - Firestore error:", firestoreError);
      }
      
      // TaskService instance'dan yüklemeyi dene
      console.log("TaskDetailScreen - Trying to load task from TaskService");
      const taskData = await taskService.getTask(cleanTaskId);
      
      if (taskData) {
        console.log("TaskDetailScreen - Task found via TaskService:", taskData.title);
        setTask(taskData);
        return;
      }
      
      // Hiçbir şekilde bulunamazsa hata göster
      console.error("TaskDetailScreen - Task not found anywhere with ID:", cleanTaskId);
      Alert.alert("Hata", "Görev bulunamadı. Lütfen görevler listesine dönüp tekrar deneyin.", [
        { text: "Tamam", onPress: () => navigation.goBack() }
      ]);
      
    } catch (error) {
      console.error('Error loading task:', error);
      Alert.alert('Hata', 'Görev yüklenirken bir hata oluştu: ' + error.message, [
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
    
    if (!task) {
      Alert.alert('Hata', 'Görev bilgisi yüklenemedi');
      return;
    }
    
    if (!actualTaskId || actualTaskId.trim() === '') {
      Alert.alert('Hata', 'Geçersiz görev ID\'si');
      return;
    }
    
    try {
      setSubmitting(true);
      
      console.log(`TaskDetailScreen - Attempting to assign task: ${actualTaskId} to user: ${user.uid}`);
      
      await taskCompletionService.assignTaskToUser(actualTaskId, user.uid);
      console.log(`TaskDetailScreen - Successfully assigned task: ${actualTaskId} to user: ${user.uid}`);
      
      // For emergency tasks, also update emergency status
      if (task?.isEmergency && task.emergencyRequestId) {
        console.log(`TaskDetailScreen - Updating emergency status for request: ${task.emergencyRequestId}`);
        
        await emergencyService.updateEmergencyStatus(
          task.emergencyRequestId, 
          'in-progress', 
          user.uid, 
          user.displayName || 'User'
        );
      }
      
      // Görev atama başarılı olduysa kullanıcıya bildir
      Alert.alert(
        'Başarılı', 
        'Görev başarıyla üstlenildi. Tamamladığınızda bildirimde bulunabilirsiniz.',
        [{ text: 'Tamam' }]
      );
      
      // Görevi yeniden yükle
      loadTask();
    } catch (error) {
      console.error('Error assigning task:', error);
      Alert.alert('Hata', `Görev atanırken bir hata oluştu: ${error.message}`);
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
      
      // For emergency tasks, also update emergency status
      if (task?.isEmergency && task.emergencyRequestId) {
        await emergencyService.updateEmergencyStatus(
          task.emergencyRequestId, 
          'resolved', 
          user.uid, 
          user.displayName || 'User'
        );
      }
      
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
      
      // Call service to approve task - make sure note is never undefined
      await taskService.approveTask(
        actualTaskId, 
        user.uid,
        user.displayName || 'Admin',
        note || '' // Convert undefined to empty string
      );
      
      // If this is an emergency task, give extra XP
      if (task.completedBy && task.completedBy.id) {
        const completedUserId = task.completedBy.id;
        
        // Add task completion XP
        await xpService.addTaskCompletionXP(
          completedUserId,
          task.id,
          task.title,
          task.isEmergency,
          task.emergencyLevel
        );
        
        // Kullanıcının tamamlanan görev sayısını güncelle
        const userRef = doc(db, 'users', completedUserId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentTaskCount = userData.stats?.tasksCompleted || 0;
          
          // Görev sayısını bir artır
          await updateDoc(userRef, {
            'stats.tasksCompleted': currentTaskCount + 1
          });
          
          console.log(`Updated user ${completedUserId} task count from ${currentTaskCount} to ${currentTaskCount + 1}`);
        }
        
        // Update badge progress
        const badgeService = BadgeService.getInstance();
        const result = await badgeService.updateBadgeProgress(completedUserId, task.category);
        
        // Check and award all category badges
        await badgeService.checkAllCategoryBadges(completedUserId);
        
        if (result.levelsGained.length > 0) {
          console.log('Badge levels gained:', result.levelsGained);
        }
        
        // Update task category counts
        await xpService.updateTaskProgressForCategory(completedUserId, task.category || 'OTHER');
        
        // If the task was completed by the current user, update local state
        if (completedUserId === user.uid) {
          // Refresh XP data if needed
          await xpService.getUserXP(user.uid);
          // Note: We're not setting state here since we're navigating away
        }
      }
      
      // Show success message
      Alert.alert(
        'Başarılı',
        'Görev onaylandı ve XP ödülü verildi!',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Görev yükleniyor...</Text>
      </View>
    );
  }
  
  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Görev bulunamadı</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Geri Dön
        </Button>
      </View>
    );
  }
  
  const isAssignedToMe = user && task.assignedTo === user.uid;
  const isEmergencyTask = task.isEmergency === true;
  const canTakeTask = user && task.status === 'OPEN' && !task.assignedTo;
  const canApprove = user && task.status === 'AWAITING_APPROVAL' && user.role === 'admin';
  const isAwaitingApproval = task.status === 'AWAITING_APPROVAL';
  const isCompleted = task.status === 'COMPLETED';
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
          isAdmin={user?.role === 'admin'}
        />
      </SafeAreaView>
    );
  }
  
  // Render action buttons
  const renderActionButtons = () => {
    return (
      <View style={styles.actionContainer}>
        {/* Görev üstlenme butonu - sadece açık görevler için */}
        {canTakeTask && (
          <Button
            mode="contained"
            onPress={handleAssign}
            style={styles.mainButton}
            disabled={submitting}
            loading={submitting}
            icon={({ size, color }) => <CheckCircle size={size} color={color} />}
          >
            {isEmergencyTask && task.priority === 'HIGH' 
              ? 'ACİL GÖREVİ ÜSTLEN' 
              : isEmergencyTask && task.priority === 'MEDIUM'
                ? 'ÖNEMLİ GÖREVİ ÜSTLEN'
                : 'Görevi Üstlen'}
          </Button>
        )}

        {/* Görevi tamamla butonu - sadece bana atanmış ve IN_PROGRESS durumundaki görevler için */}
        {isAssignedToMe && task.status === 'IN_PROGRESS' && (
          <Button
            mode="contained"
            onPress={handleComplete}
            style={styles.mainButton}
            icon={({ size, color }) => <CheckCircle size={size} color={color} />}
          >
            Görevi Tamamla
          </Button>
        )}

        {/* Görev onay butonu - admin kullanıcıları için ve onay bekleyen görevler için */}
        {canApprove && (
          <Button
            mode="contained"
            onPress={handleShowApprovalForm}
            style={styles.mainButton}
            icon={({ size, color }) => <CheckCircle size={size} color={color} />}
          >
            Görevi Onayla
          </Button>
        )}

        {/* Görevi bırak butonu - sadece bana atanmış görevler için */}
        {isAssignedToMe && task.status === 'IN_PROGRESS' && (
          <Button
            mode="outlined"
            onPress={handleUnassign}
            style={styles.secondaryButton}
            disabled={submitting}
          >
            Görevi Bırak
          </Button>
        )}
        
        {/* Geri dön butonu - diğer durumlar için */}
        {(isCompleted || isAwaitingApproval || (!canTakeTask && !isAssignedToMe && !canApprove)) && (
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.mainButton}
          >
            Geri Dön
          </Button>
        )}
      </View>
    );
  };

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
          <Animated.Text
            style={[
              styles.headerTitle,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}
          >
            {task.title}
          </Animated.Text>
          <View style={styles.emptySpace} />
        </View>
        
        <View style={styles.statusContainer}>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(task.status) }]}
          >
            <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
          </Chip>
          
          {isEmergencyTask && (() => {
            const emergencyInfo = getEmergencyInfo(isEmergencyTask, task.priority);
            if (!emergencyInfo) return null;
            
            return (
              <Chip
                style={[styles.emergencyChip, { backgroundColor: emergencyInfo.bgColor }]}
                icon={() => <AlertTriangle size={16} color={emergencyInfo.color} />}
              >
                <Text style={[styles.emergencyText, { color: emergencyInfo.color }]}>
                  {emergencyInfo.text}
                </Text>
              </Chip>
            );
          })()}
        </View>

        <Animated.View
          style={[
            styles.imageContainer,
            {
              opacity: fadeAnim,
              transform: isEmergencyTask ? [{ scale: pulseAnim }] : []
            }
          ]}
        >
          {task.images && task.images.length > 0 && !imageError ? (
            <Image 
              source={{ uri: task.images[0] }} 
              style={styles.image} 
              resizeMode="cover"
              onError={handleImageError}
            />
          ) : (
            <View style={[styles.imageContainer, styles.placeholderImage]}>
              <AlertTriangle size={60} color={colors.textDisabled} />
              <Text style={styles.placeholderText}>Görsel Yok</Text>
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

        {isEmergencyTask && (() => {
          const emergencyInfo = getEmergencyInfo(isEmergencyTask, task.priority);
          if (!emergencyInfo) return null;
          
          return (
            <Animated.View
              style={[
                styles.emergencyContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                  backgroundColor: emergencyInfo.bgColor
                }
              ]}
            >
              <AlertTriangle size={20} color={emergencyInfo.color} />
              <Text style={[styles.emergencyNote, { color: emergencyInfo.color }]}>
                {task.priority === 'HIGH' 
                  ? 'Bu bir acil durum görevidir ve hızlı müdahale gerektirir. Lütfen olabildiğince çabuk yardım edin.' 
                  : task.priority === 'MEDIUM'
                    ? 'Bu önemli bir görevdir. Lütfen en kısa sürede tamamlamaya çalışın.'
                    : 'Bu görev düşük öncelikli bir görevdir.'}
              </Text>
            </Animated.View>
          );
        })()}

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
                {safeFormatDate(task.deadline)}
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

        {renderActionButtons()}
        
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
  mainButton: {
    flex: 1,
    borderRadius: 8,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
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
  emergencyChip: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    marginLeft: spacing.sm,
  },
  emergencyText: {
    fontWeight: 'bold',
  },
  emergencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  emergencyNote: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  emptySpace: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  placeholderText: {
    color: colors.textDisabled,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
