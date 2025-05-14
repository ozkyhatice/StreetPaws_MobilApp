import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, Card, Chip, Divider, Badge, Button } from 'react-native-paper';
import { TaskService } from '../services/taskService';
import { Task, EmergencyLevel } from '../types/task';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import { AlertCircle, Clock, MapPin } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { EmergencyService } from '../services/emergencyService';
import { RootStackParamList } from '../navigation/types';

interface EmergencyTaskListProps {
  navigation: any;
}

export function EmergencyTaskList({ navigation }: EmergencyTaskListProps) {
  const [emergencyTasks, setEmergencyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    loadEmergencyTasks();
  }, []);
  
  const loadEmergencyTasks = async () => {
    try {
      setLoading(true);
      const taskService = TaskService.getInstance();
      
      console.log("EmergencyTaskList - Starting emergency tasks loading process");
      
      if (typeof taskService.getEmergencyTasks === 'function') {
        console.log("EmergencyTaskList - Loading emergency tasks from TaskService");
        try {
          // Acil görevleri getir
        const tasks = await taskService.getEmergencyTasks();
          console.log(`EmergencyTaskList - Loaded ${tasks.length} emergency tasks from Firestore`);
          console.log("EmergencyTaskList - Tasks data sample:", tasks.slice(0, 2));
          
          // Görevlerin ID'lerini kontrol et, sadece geçerli ID'leri olan görevleri al
          const validTasks = tasks.filter(task => task && task.id);
          console.log(`EmergencyTaskList - Valid tasks with IDs: ${validTasks.length}`);
          
          if (validTasks.length === 0) {
            console.log("EmergencyTaskList - No valid emergency tasks found. This could be because:");
            console.log("  1. There are no emergency tasks in Firestore");
            console.log("  2. There's an issue with the isEmergency field value");
            console.log("  3. The tasks exist but don't have proper IDs");
            
            // Set empty array instead of mock data to show the empty state
            setEmergencyTasks([]);
          } else {
            // Her görevin veri yapısını doğrula ve konsola yazdır
            validTasks.forEach((task, index) => {
              console.log(`EmergencyTaskList - Task ${index + 1} - ID: ${task.id}, Title: ${task.title}, Status: ${task.status}, isEmergency: ${task.isEmergency}`);
            });
            
            // Acil görevleri state'e kaydet ve UI'ı güncellemesine izin ver
            setEmergencyTasks(validTasks);
            console.log("EmergencyTaskList - State updated with emergency tasks");
          }
        } catch (firestoreError: any) {
          console.error('EmergencyTaskList - Firestore error:', firestoreError);
          
          // Firebase index hatası için kontrol
          if (firestoreError && firestoreError.message && 
              (firestoreError.message.includes('The query requires an index') || 
               firestoreError.message.includes('FAILED_PRECONDITION'))) {
            
            // Index URL'i bulmaya çalış
            let indexUrl = "Firebase konsolunda gerekli indeksi oluşturmanız gerekiyor.";
            const match = firestoreError.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
            if (match && match[0]) {
              indexUrl = match[0];
            }
            
            console.log("EmergencyTaskList - Firebase index error. Index URL:", indexUrl);
            
            Alert.alert(
              "Veritabanı İndeks Hatası", 
              `Acil durum görevleri için Firestore indeksi oluşturulmalı.\n\nLütfen Firebase konsolundan indeksi oluşturun.\n\n${indexUrl}`,
              [{ text: "Tamam" }]
            );
          } else {
            Alert.alert(
              "Veritabanı Hatası", 
              "Acil durum görevleri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
              [{ text: "Tamam" }]
            );
          }
          
          // Hata durumunda boş liste göster
          setEmergencyTasks([]);
        }
      } else {
        console.error('getEmergencyTasks method does not exist on TaskService');
        Alert.alert(
          "Uygulama Hatası", 
          "Acil durum görevlerini yükleme fonksiyonu bulunamadı.",
          [{ text: "Tamam" }]
        );
        
        // Fonksiyon bulunamazsa boş liste göster
        setEmergencyTasks([]);
      }
    } catch (error) {
      console.error('Error loading emergency tasks:', error);
      Alert.alert(
        "Hata", 
        "Acil durum görevleri yüklenirken beklenmeyen bir hata oluştu.",
        [{ text: "Tamam" }]
      );
      
      // Beklenmeyen hata durumunda boş liste göster
      setEmergencyTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadEmergencyTasks();
  };
  
  const handleTaskPress = (task: Task) => {
    if (!task || !task.id) {
      console.error("EmergencyTaskList - Invalid task or missing ID:", task);
      Alert.alert("Hata", "Görev bilgisi bulunamadı");
      return;
    }
    
    // Clean up the ID and ensure it's a string
    const taskId = task.id.toString().trim();
    console.log("EmergencyTaskList - Preparing to navigate to TaskDetail with ID:", taskId);
    
    // Validate the ID
    if (!taskId || taskId === '') {
      console.error("EmergencyTaskList - Empty or invalid task ID");
      Alert.alert("Hata", "Geçersiz görev ID'si");
      return;
    }
    
    // Check if the task is awaiting approval and add special parameter
    let navigationParams: RootStackParamList['TaskDetail'] = { taskId };
    if (task.status === 'AWAITING_APPROVAL') {
      navigationParams = { 
        taskId,
        action: 'showApproval'
      };
      console.log("EmergencyTaskList - Task is awaiting approval, adding special action parameter");
    }
    
    // Verify the task exists in the service
    const taskService = TaskService.getInstance();
    taskService.getTask(taskId)
      .then(foundTask => {
        if (foundTask) {
          // Task exists, proceed to detail page
          console.log(`EmergencyTaskList - Task verified. Opening task details: ${taskId}`);
          navigation.navigate('TaskDetail', navigationParams);
        } else {
          // If task doesn't exist in regular tasks, check if it's from an emergency request
          if (task.emergencyRequestId) {
            console.log(`EmergencyTaskList - Task ${taskId} not found, but has emergencyRequestId: ${task.emergencyRequestId}`);
            // Try to recreate the task from the emergency request
            const emergencyService = EmergencyService.getInstance();
            Alert.alert(
              "Bilgi",
              "Bu görev yükleniyor, lütfen bir an bekleyin...",
              [{ text: "Tamam" }]
            );
            loadEmergencyTasks(); // Refresh the list
          } else {
            console.error(`EmergencyTaskList - Task with ID ${taskId} not found in getTask call`);
            Alert.alert("Hata", "Bu görev mevcut değil veya silinmiş", [
              { text: "Tamam", onPress: () => loadEmergencyTasks() }
            ]);
          }
        }
      })
      .catch(error => {
        console.error(`EmergencyTaskList - Error checking task existence: ${error.message}`);
        Alert.alert("Hata", "Görev bilgisi kontrol edilirken bir hata oluştu", [
          { text: "Tamam", onPress: () => loadEmergencyTasks() }
        ]);
      });
  };
  
  const handleTakeTask = (task: Task, event: any) => {
    // Event'in balonlama yapmasını engelle
    event.stopPropagation();
    
    if (!task || !task.id) {
      console.error("EmergencyTaskList - Invalid task or missing ID when taking task:", task);
      Alert.alert("Hata", "Görev bilgisi bulunamadı");
      return;
    }
    
    // ID'yi string olarak al ve temizle
    const taskId = task.id.toString().trim();
    
    // Geçerli bir ID mi kontrol et
    if (!taskId || taskId === '') {
      console.error("EmergencyTaskList - Empty or invalid task ID when taking task");
      Alert.alert("Hata", "Geçersiz görev ID'si");
      return;
    }
    
    // TaskDetail ekranına görevin ID'si ve "üstlen" parametresiyle yönlendir
    console.log(`EmergencyTaskList - Navigating to TaskDetail with ID for taking: ${taskId}`);
    navigation.navigate('TaskDetail', { 
      taskId, 
      action: 'take'  // TaskDetailScreen'e üstlenme işlemini otomatik başlatması için parametre ekle
    });
  };
  
  const getEmergencyLevelColor = (level: EmergencyLevel) => {
    switch (level) {
      case 'CRITICAL': return colors.error;
      case 'URGENT': return colors.warning;
      default: return colors.info;
    }
  };
  
  const getEmergencyLevelText = (level: EmergencyLevel) => {
    switch (level) {
      case 'CRITICAL': return 'KRİTİK';
      case 'URGENT': return 'ACİL';
      default: return 'NORMAL';
    }
  };
  
  const safeFormatDate = (dateString: string | undefined) => {
    try {
      // Check if dateString is undefined or empty
      if (!dateString) {
        console.warn('Invalid date format in EmergencyTaskList: undefined or empty dateString');
        return 'Tarih bilgisi yok';
      }
      
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date format in EmergencyTaskList:', dateString);
        return 'Geçersiz tarih';
      }
      
      // Check if future date
      const now = new Date();
      if (date > now) {
        // For future dates, just show the formatted date instead of using formatDistanceToNow
        return date.toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // For past dates, use formatDistanceToNow
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: tr 
      });
    } catch (error) {
      console.warn('Invalid date format in EmergencyTaskList:', error);
      return 'Bilinmeyen tarih';
    }
  };
  
  const renderEmergencyTask = ({ item }: { item: Task }) => {
    const emergencyLevel = item.emergencyLevel || 'NORMAL';
    const levelColor = getEmergencyLevelColor(emergencyLevel);
    const timeAgo = safeFormatDate(item.createdAt);
    
    const isAssignedToMe = user && item.assignedTo === user.uid;
    const isOpen = item.status === 'OPEN';
    const isCompleted = item.status === 'COMPLETED';
    const isAwaitingApproval = item.status === 'AWAITING_APPROVAL';
    const canTake = isOpen && !item.assignedTo && user;
    
    // Determine border color for card based on status
    let borderColor = null;
    if (isAwaitingApproval) {
      borderColor = colors.warning;
    } else if (isCompleted) {
      borderColor = colors.success;
    }
    
    return (
      <Card 
        style={[
          styles.card,
          borderColor ? { borderLeftWidth: 4, borderLeftColor: borderColor } : null
        ]} 
        onPress={() => handleTaskPress(item)}
      >
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <Chip 
                style={[styles.chipLevel, { backgroundColor: levelColor }]} 
                textStyle={styles.chipText}
              >
                {getEmergencyLevelText(emergencyLevel)}
              </Chip>
            </View>
          </View>
          
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
          
          {item.location && (
            <View style={styles.locationRow}>
              <MapPin size={16} color={colors.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.location.address}
              </Text>
            </View>
          )}
          
          <Divider style={styles.divider} />
          
          <View style={styles.footer}>
            <View style={styles.infoRow}>
              <AlertCircle size={16} color={levelColor} />
              <Text style={styles.infoText}>
                {item.xpReward} XP Ödül
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Clock size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{timeAgo}</Text>
            </View>
          </View>
          
          <View style={styles.statusSection}>
            {isAssignedToMe ? (
              <Badge style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                Sizin tarafınızdan üstlenildi
              </Badge>
            ) : item.assignedTo && isAwaitingApproval ? (
              <Badge style={[styles.statusBadge, { backgroundColor: colors.warning }]}>
                Onay bekliyor
              </Badge>
            ) : item.assignedTo && isCompleted ? (
              <Badge style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                Tamamlandı
              </Badge>
            ) : item.assignedTo ? (
              <Badge style={[styles.statusBadge, { backgroundColor: colors.info }]}>
                Üstlenildi
              </Badge>
            ) : isOpen ? (
              <Badge style={[styles.statusBadge, { backgroundColor: colors.primary }]}>
                Yardım bekleniyor
              </Badge>
            ) : (
              <Badge style={[styles.statusBadge, { backgroundColor: colors.secondaryDark }]}>
                {item.status === 'AWAITING_APPROVAL' ? 'Onay bekliyor' : 'Tamamlandı'}
              </Badge>
            )}
            
            {canTake && (
              <Button 
                mode="contained" 
                compact 
                onPress={(e) => handleTakeTask(item, e)}
                style={styles.takeButton}
              >
                Görevi Üstlen
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Render empty list when no emergency tasks are found
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <AlertCircle size={60} color={colors.textSecondary} style={styles.emptyIcon} />
      <Text style={styles.emptyText}>Şu anda hiç acil durum görevi bulunmuyor</Text>
      <Text style={styles.emptySubText}>
        Bu liste acil durum talepleri oluşturulduğunda otomatik olarak güncellenecektir.
      </Text>
      <Button 
        mode="outlined" 
        onPress={onRefresh} 
        style={styles.refreshButton}
        icon="refresh"
      >
        Yenile
      </Button>
    </View>
  );
  
  // Update createTestEmergencyTask to use real Firestore
  const createTestEmergencyTask = async () => {
    try {
      setLoading(true);
      
      console.log("EmergencyTaskList - Creating real emergency task in Firestore");
      
      // Import TaskService
      const taskService = TaskService.getInstance();
      
      // Create an emergency request with real data
      const emergencyRequest = {
        id: `emergency_${Date.now()}`,
        title: `Acil Durum: Yaralı Kedi ${new Date().toLocaleTimeString()}`,
        description: 'Şişli bölgesinde yaralı bir kedi bulundu. Acil yardım gerekiyor.',
        location: 'Şişli, Mecidiyeköy, İstanbul',
        urgency: 'critical' as 'critical' | 'low' | 'medium' | 'high',
        userId: user?.uid || 'system_user',
        userName: user?.displayName || 'Sistem Kullanıcısı',
        status: 'pending' as 'pending' | 'in-progress' | 'resolved' | 'cancelled',
        createdAt: new Date().toISOString(),
        animalType: 'Kedi'
      };
      
      // Use the TaskService to create an emergency task in Firestore
      const createdTask = await taskService.createEmergencyTask(emergencyRequest);
      console.log("EmergencyTaskList - Emergency task created in Firestore:", createdTask);
      
      Alert.alert(
        "Başarılı", 
        `Acil görev oluşturuldu ve Firestore'a kaydedildi!\nID: ${createdTask.id}`,
        [{ text: "Tamam" }]
      );
      
      // Refresh the list to show the new task
      loadEmergencyTasks();
    } catch (error: any) {
      console.error("EmergencyTaskList - Error creating emergency task in Firestore:", error);
      Alert.alert(
        "Hata", 
        `Acil görev oluşturulurken Firestore hatası: ${error.message}`,
        [{ text: "Tamam" }]
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Render a loading indicator
  const renderLoading = () => (
    <View style={styles.emptyContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.emptyText, { marginTop: spacing.md }]}>
        Acil durum görevleri yükleniyor...
      </Text>
    </View>
  );
  
  return (
    <>
      {loading ? (
        renderLoading()
      ) : (
    <FlatList
      data={emergencyTasks}
      renderItem={renderEmergencyTask}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          colors={[colors.primary]}
        />
      }
          ListEmptyComponent={emergencyTasks.length === 0 ? renderEmptyList : null}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.title}>Acil Durum Görevleri</Text>
              <Text style={styles.subtitle}>
                Tüm acil durum görevleri burada listelenir
              </Text>
              {emergencyTasks.length > 0 && (
                <Badge
                  style={styles.countBadge}
                  size={24}
                >
                  {emergencyTasks.length}
                </Badge>
              )}
            </View>
          }
    />
      )}
    </>
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
  chipLevel: {
    borderRadius: borderRadius.small,
    marginLeft: spacing.sm,
  },
  chipText: {
    ...typography.caption,
    color: '#FFFFFF',
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
  emptySubText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  locationText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.medium,
  },
  takeButton: {
    borderRadius: borderRadius.small,
  },
  refreshButton: {
    marginTop: spacing.md,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  countBadge: {
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
}); 