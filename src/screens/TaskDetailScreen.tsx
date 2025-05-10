import React, { useState, useEffect, Component, useRef } from 'react';
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
import { Task } from '../types/task';
import { TaskService } from '../services/taskService';
import { TaskCompletionService } from '../services/taskCompletionService';
import { useAuth } from '../hooks/useAuth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, Region, Circle } from 'react-native-maps';
import { MapPin, Clock, Award, User, CheckCircle, AlertTriangle, Tag, Star } from 'lucide-react-native';
import { getStatusColor, getStatusText } from '../utils/taskUtils';
import { colors } from '../theme/colors';
import { bounceIn, fadeIn, pulse } from '../utils/animations';

interface TaskMarkerProps {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}

const TaskMarker = React.memo(({ latitude, longitude, radiusMeters }: TaskMarkerProps) => {
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
  const [imageError, setImageError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigation = useNavigation();
  const { user } = useAuth();
  const taskService = TaskService.getInstance();
  const taskCompletionService = TaskCompletionService.getInstance();

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

    loadTask();
  }, [taskId]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);

  const loadTask = async () => {
    try {
      const taskData = await taskService.getTask(taskId);
      setTask(taskData);
    } catch (error) {
      console.error('Error loading task:', error);
      Alert.alert('Hata', 'Görev yüklenirken bir hata oluştu');
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
      await taskCompletionService.assignTaskToUser(taskId, user.uid);
      loadTask();
    } catch (error) {
      Alert.alert('Hata', 'Görev atanırken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassign = async () => {
    try {
      await taskService.unassignTask(taskId);
      loadTask();
    } catch (error) {
      Alert.alert('Hata', 'Görev bırakılırken bir hata oluştu');
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
        taskId,
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

  if (loading || !task) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  const isAssignedToMe = user && task.assignedTo === user.uid;
  const canComplete = isAssignedToMe && task.status === 'IN_PROGRESS';
  const { width } = Dimensions.get('window');
  const isSmallScreen = width < 375;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={[styles.imageContainer, { transform: [{ scale: scaleAnim }] }]}>
          {task.images && task.images.length > 0 && !imageError ? (
            <Image 
              source={{ uri: task.images[0] }} 
              style={styles.image} 
              onError={handleImageError}
            />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <AlertTriangle size={48} color="#E0E0E0" />
              <Text style={styles.placeholderText}>Görsel bulunamadı</Text>
            </View>
          )}
          <View style={styles.overlay}>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: colors.status[task.status].background }
              ]}
            >
              <Text style={{ color: colors.status[task.status].text }}>
                {getStatusText(task.status)}
              </Text>
            </Chip>
          </View>
        </Animated.View>

        <Card style={styles.detailsCard}>
          <Card.Content>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Text variant="headlineSmall" style={styles.title}>
                {task.title}
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                {task.description}
              </Text>
            </Animated.View>

            <View style={styles.tagsContainer}>
              <Chip
                style={[styles.priorityChip, { backgroundColor: colors.game.warning }]}
                textStyle={{ color: colors.text.inverse }}
              >
                Yüksek Öncelik
              </Chip>
              <Chip
                style={[styles.categoryChip, { backgroundColor: colors.categories[task.category].background }]}
                textStyle={{ color: colors.categories[task.category].text }}
              >
                {task.category === 'FEEDING' ? 'Besleme' :
                 task.category === 'HEALTH' ? 'Sağlık' :
                 task.category === 'SHELTER' ? 'Barınak' :
                 task.category === 'CLEANING' ? 'Temizlik' : 'Diğer'}
              </Chip>
            </View>

            <View style={styles.locationContainer}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Konum</Text>
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
              <Text variant="bodyMedium" style={styles.address}>
                {task.location.address}
              </Text>
            </View>

            <View style={styles.deadlineContainer}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Son Tarih</Text>
              <Text variant="bodyMedium" style={styles.deadline}>
                {new Date(task.deadline).toLocaleDateString('tr-TR')}
              </Text>
            </View>

            <View style={styles.pointsContainer}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Kazanılacak Puan</Text>
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
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
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

        {showCompletionForm && (
          <Card style={styles.formCard}>
            <Card.Title title="Görev Tamamlama" />
            <Card.Content>
              <TaskCompletionForm 
                onSubmit={handleSubmitCompletion}
                onCancel={() => setShowCompletionForm(false)}
                loading={submitting}
              />
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
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
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
    backgroundColor: colors.background.card,
    elevation: 4,
  },
  title: {
    color: colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: colors.text.secondary,
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
    color: colors.text.primary,
    fontWeight: 'bold',
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
    color: colors.text.secondary,
  },
  deadlineContainer: {
    marginTop: 16,
  },
  deadline: {
    color: colors.text.secondary,
  },
  pointsContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  pointsBadge: {
    backgroundColor: colors.primary.light,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    color: colors.text.inverse,
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
  formCard: {
    marginTop: 16,
  },
  placeholderImage: {
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  placeholderText: {
    marginTop: 8,
    color: '#6C757D',
  },
});
