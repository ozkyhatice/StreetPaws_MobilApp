import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, ScrollView, StatusBar, Platform, SafeAreaView } from 'react-native';
import { Text, Button, Card, IconButton, FAB } from 'react-native-paper';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getTasks } from '../services/taskService';
import { Task } from '../types/task';
import { MapPin, Navigation, Filter, ChevronUp } from 'lucide-react-native';
import { colors, spacing, shadows, borderRadius } from '../config/theme';

// Marker bileşeni için props tipi
type MarkerProps = {
  task: Task;
  onPress: (task: Task) => void;
};

// Functional component olarak Marker bileşeni
const TaskMarker = React.memo(({ task, onPress }: MarkerProps) => {
  return (
    <Marker
      identifier={task.id}
      coordinate={{
        latitude: task.location.latitude,
        longitude: task.location.longitude,
      }}
      title={task.title}
      description={task.category}
      pinColor={
        task.status === 'OPEN' ? colors.primary : 
        task.status === 'IN_PROGRESS' ? colors.warning : colors.textTertiary
      }
      onPress={() => onPress(task)}
      tracksViewChanges={false}
    />
  );
});

// MapScreen bileşeni için props tipi
interface MapScreenProps {
  navigation: any;
}

// Functional component olarak MapScreen
const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filteredCategory, setFilteredCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  const mapRef = useRef<MapView>(null);
  
  useEffect(() => {
    loadLocationAndTasks();
  }, []);
  
  const loadLocationAndTasks = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        setLoading(false);
        return;
      }

      // Konum ve görevleri paralel olarak yükle
      const [location, loadedTasks] = await Promise.all([
        Location.getCurrentPositionAsync({}),
        getTasks()
      ]);

      setUserLocation(location);
      setTasks(loadedTasks);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleCenterToUser = () => {
    if (userLocation && mapRef.current) {
      const region: Region = {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(region, 300);
    }
  };

  const handleMarkerPress = (task: Task) => {
    setSelectedTask(task);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleCloseTaskInfo = () => {
    setSelectedTask(null);
  };

  const navigateToTaskDetail = (taskId: string) => {
    navigation.navigate('TaskDetail', { taskId });
  };

  const handleMapReady = () => {
    setMapReady(true);
  };

  const getFilteredTasks = () => {
    return filteredCategory 
      ? tasks.filter(task => task.category === filteredCategory)
      : tasks;
  };

  const getCategories = () => {
    return [...new Set(tasks.map(task => task.category))];
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initialRegion = userLocation ? {
    latitude: userLocation.coords.latitude,
    longitude: userLocation.coords.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } : {
    latitude: 41.0082, // Default: Istanbul
    longitude: 28.9784,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const tasksToShow = getFilteredTasks();
  const categories = getCategories();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            showsUserLocation
            showsCompass
            showsMyLocationButton={false}
            onMapReady={handleMapReady}
            toolbarEnabled={false}
            rotateEnabled={true}
            zoomEnabled={true}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          >
            {mapReady && tasksToShow.map(task => (
              <TaskMarker 
                key={task.id}
                task={task} 
                onPress={handleMarkerPress} 
              />
            ))}
          </MapView>

          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.title}>Görevleri Haritada Gör</Text>
            <FAB
              icon={props => showFilters 
                ? <ChevronUp {...props} color={colors.primary} /> 
                : <Filter {...props} color={colors.primary} />
              }
              style={styles.filterToggleButton}
              size="small"
              onPress={toggleFilters}
            />
          </View>
          
          {showFilters && (
            <View style={styles.filterContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.filtersScroll}
              >
                <TouchableOpacity
                  style={[styles.filterChip, !filteredCategory && styles.activeFilterChip]}
                  onPress={() => setFilteredCategory(null)}
                >
                  <Text style={!filteredCategory ? styles.activeFilterText : styles.filterText}>
                    Tümü
                  </Text>
                </TouchableOpacity>
                
                {categories.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[styles.filterChip, filteredCategory === category && styles.activeFilterChip]}
                    onPress={() => setFilteredCategory(filteredCategory === category ? null : category)}
                  >
                    <Text style={filteredCategory === category ? styles.activeFilterText : styles.filterText}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={handleCenterToUser}
            >
              <Navigation size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {selectedTask && (
          <Card style={styles.taskInfoContainer}>
            <Card.Content>
              <View style={styles.taskHeader}>
                <Text variant="titleMedium" style={styles.taskTitle}>{selectedTask.title}</Text>
                <View style={[
                  styles.statusContainer, 
                  { 
                    backgroundColor: selectedTask.status === 'OPEN' 
                      ? colors.primary + '20'
                      : selectedTask.status === 'IN_PROGRESS' 
                        ? colors.warning + '20' 
                        : colors.textTertiary + '20'
                  }
                ]}>
                  <Text
                    variant="labelMedium"
                    style={{
                      color: selectedTask.status === 'OPEN' ? colors.primary : 
                            selectedTask.status === 'IN_PROGRESS' ? colors.warning : 
                            colors.textTertiary
                    }}
                  >
                    {selectedTask.status}
                  </Text>
                </View>
              </View>
              
              <Text variant="bodyMedium" style={styles.taskDescription} numberOfLines={2}>
                {selectedTask.description}
              </Text>
              
              <View style={styles.locationRow}>
                <MapPin size={16} color={colors.textSecondary} />
                <Text variant="bodySmall" style={styles.locationText}>
                  {selectedTask.location.address}
                </Text>
              </View>
              
              <Button
                mode="contained"
                style={styles.detailButton}
                onPress={() => navigateToTaskDetail(selectedTask.id)}
                buttonColor={colors.primary}
              >
                Detayları Gör
              </Button>
            </Card.Content>
            
            <IconButton
              icon="close"
              size={20}
              style={styles.closeButton}
              onPress={handleCloseTaskInfo}
            />
          </Card>
        )}
      </View>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = StatusBar.currentHeight || 0;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : STATUSBAR_HEIGHT + 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  title: {
    color: colors.text,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...shadows.medium,
  },
  filterToggleButton: {
    backgroundColor: colors.surface,
    ...shadows.small,
  },
  filterContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : STATUSBAR_HEIGHT + 60,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 5,
    borderRadius: borderRadius.medium,
    marginHorizontal: 16,
    ...shadows.small,
  },
  filtersScroll: {
    paddingRight: 32,
    paddingLeft: 8,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
    ...shadows.small,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.primary,
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 24 + (Platform.OS === 'ios' ? 80 : 70), // Tab Bar için ek alan ekle
    right: 16,
    zIndex: 5,
  },
  locationButton: {
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  taskInfoContainer: {
    position: 'absolute',
    bottom: 64, // Tab Bar için ek alan ekle
    left: 8,
    right: 8,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    ...shadows.medium,
    maxHeight: height * 0.3,
    zIndex: 10,
    elevation: 5,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontWeight: '500',
    color: colors.text,
  },
  statusContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.surface,
    marginLeft: 8,
  },
  taskDescription: {
    marginBottom: 12,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    marginLeft: 6,
    color: colors.textSecondary,
    flex: 1,
  },
  detailButton: {
    borderRadius: borderRadius.medium,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
});

export default MapScreen;
