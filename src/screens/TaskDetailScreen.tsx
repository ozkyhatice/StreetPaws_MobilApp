import React, { useState, useEffect, Component } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { TaskCompletionForm } from '../components/TaskCompletionForm';
import { Text, Divider, Chip } from 'react-native-paper';
import { Task } from '../types/task';
import { TaskService } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin, Clock, Award, User, CheckCircle, AlertTriangle } from 'lucide-react-native';

// Class Component olarak TaskMarker bileşeni
class TaskMarker extends Component<{
  coordinate: { latitude: number; longitude: number };
}> {
  shouldComponentUpdate() {
    // Koordinat değişmediği sürece yeniden render etme
    return false;
  }

  render() {
    return (
      <Marker
        coordinate={this.props.coordinate}
        tracksViewChanges={false}
      />
    );
  }
}

export default function TaskDetailScreen() {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [imageError, setImageError] = useState(false);

  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const taskService = TaskService.getInstance();

  const { taskId } = route.params as { taskId: string };

  useEffect(() => {
    loadTask();
  }, [taskId]);

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
      await taskService.assignTask(taskId, user.uid);
      loadTask();
    } catch (error) {
      Alert.alert('Hata', 'Görev atanırken bir hata oluştu');
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

  if (loading || !task) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const isAssignedToMe = user && task.assignedTo === user.uid;
  const canComplete = isAssignedToMe && task.status === 'IN_PROGRESS';
  const { width } = Dimensions.get('window');
  const isSmallScreen = width < 375;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text variant="headlineMedium" style={styles.title}>Görev Detayı</Text>
      <Text variant="bodyLarge" style={styles.subtitle}>Görev ID: {taskId}</Text>

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

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text variant="titleLarge" style={styles.taskTitle}>{task.title}</Text>
            <View style={styles.categoryContainer}>
              <Icon
                name={
                  task.category === 'FEEDING'
                    ? 'food'
                    : task.category === 'CLEANING'
                    ? 'broom'
                    : task.category === 'HEALTH'
                    ? 'medical-bag'
                    : 'home'
                }
                size={16}
                color="#4CAF50"
              />
              <Text variant="bodySmall" style={styles.category}>{task.category}</Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <Chip
              style={{
                backgroundColor:
                  task.status === 'COMPLETED'
                    ? '#E8F5E9'
                    : task.status === 'IN_PROGRESS'
                    ? '#FFF8E1'
                    : '#FFE0E0',
              }}
            >
              <Text
                variant="labelLarge"
                style={[
                  styles.status,
                  {
                    color:
                      task.status === 'COMPLETED'
                        ? '#4CAF50'
                        : task.status === 'IN_PROGRESS'
                        ? '#FFC107'
                        : '#FF6B6B',
                  },
                ]}
              >
                {task.status}
              </Text>
            </Chip>
            <View style={styles.xpContainer}>
              <Award size={16} color="#FFC107" />
              <Text variant="bodyMedium" style={styles.xp}>{task.xpReward} XP</Text>
            </View>
          </View>
        </View>

        <Card style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Açıklama</Text>
          <Text variant="bodyMedium" style={styles.description}>{task.description}</Text>
        </Card>

        <Card style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Konum</Text>
          <View style={styles.locationRow}>
            <MapPin size={16} color="#666666" />
            <Text variant="bodyMedium" style={styles.address}>{task.location.address}</Text>
          </View>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: task.location.latitude,
              longitude: task.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <TaskMarker
              coordinate={{
                latitude: task.location.latitude,
                longitude: task.location.longitude,
              }}
            />
          </MapView>
          <TouchableOpacity 
            style={styles.viewOnMapButton}
            onPress={() => navigation.navigate('Map')}
          >
            <Text style={styles.viewOnMapText}>Haritada Göster</Text>
          </TouchableOpacity>
        </Card>

        {task.deadline && (
          <Card style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Son Tarih</Text>
            <View style={styles.deadlineRow}>
              <Clock size={16} color="#FF6B6B" />
              <Text variant="bodyMedium" style={styles.deadline}>
                {new Date(task.deadline).toLocaleDateString()}
              </Text>
            </View>
          </Card>
        )}

        {task.assignedTo && (
          <Card style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Görevli</Text>
            <View style={styles.assigneeRow}>
              <User size={16} color="#4CAF50" />
              <Text variant="bodyMedium" style={styles.assignee}>
                {isAssignedToMe ? 'Bu görev size atanmış' : 'Başka birine atanmış'}
              </Text>
            </View>
          </Card>
        )}

        {showCompletionForm ? (
          user && (
            <View style={styles.completionFormContainer}>
              <Divider style={styles.divider} />
              <Text variant="titleLarge" style={styles.completionTitle}>
                <CheckCircle size={20} color="#4CAF50" /> Görevi Tamamla
              </Text>
              <TaskCompletionForm
                taskId={task.id}
                userId={user.uid}
                requiredLocation={task.location ? {
                  latitude: task.location.latitude,
                  longitude: task.location.longitude,
                } : undefined}
                onComplete={() => {
                  setShowCompletionForm(false);
                  loadTask();
                }}
                onCancel={() => setShowCompletionForm(false)}
              />
            </View>
          )
        ) : (
          <View style={styles.actionsContainer}>
            {task.status === 'OPEN' && !task.assignedTo && (
              <Button
                mode="contained"
                onPress={handleAssign}
                style={styles.actionButton}
              >
                Görevi Üstlen
              </Button>
            )}
            
            {isAssignedToMe && task.status === 'IN_PROGRESS' && (
              <>
                <Button
                  mode="contained"
                  onPress={handleComplete}
                  style={[styles.actionButton, styles.completeButton]}
                >
                  Tamamlandı Olarak İşaretle
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleUnassign}
                  style={[styles.actionButton, styles.cancelButton]}
                >
                  Görevi Bırak
                </Button>
              </>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    marginTop: 16,
    marginLeft: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 16,
    marginLeft: 16,
    color: '#757575',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: '#9E9E9E',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  taskTitle: {
    color: '#333333',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    marginLeft: 4,
    color: '#4CAF50',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  status: {
    fontWeight: 'bold',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  xp: {
    marginLeft: 4,
    color: '#757575',
  },
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    marginBottom: 8,
    color: '#333333',
    fontWeight: '500',
  },
  description: {
    color: '#555555',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  address: {
    marginLeft: 8,
    color: '#555555',
    flex: 1,
  },
  map: {
    height: 200,
    borderRadius: 8,
    marginVertical: 8,
    width: '100%',
  },
  viewOnMapButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  viewOnMapText: {
    color: '#2196F3',
    fontWeight: '500',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadline: {
    marginLeft: 8,
    color: '#FF6B6B',
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignee: {
    marginLeft: 8,
    color: '#555555',
  },
  completionFormContainer: {
    marginTop: 8,
  },
  completionTitle: {
    color: '#4CAF50',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#E0E0E0',
  },
  actionsContainer: {
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
  },
});
