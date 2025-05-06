import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, SafeAreaView } from 'react-native';
import MapView, { Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getTasks } from '../services/taskService';
import { Task } from '../types/task';
import { colors } from '../config/theme';
import { TaskMarker } from '../components/map/TaskMarker';
import { FilterBar } from '../components/map/FilterBar';
import { useNavigation } from '@react-navigation/native';

interface MapScreenProps {
  navigation: any;
}

const MapScreen: React.FC<MapScreenProps> = () => {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filteredCategory, setFilteredCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation();
  
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

  const handleMarkerPress = (task: Task) => {
    setSelectedTask(task);
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
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
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const tasksToShow = getFilteredTasks();
  const categories = getCategories();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            showsUserLocation
            showsCompass
            showsMyLocationButton={false}
            onMapReady={handleMapReady}
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

          <FilterBar
            categories={categories}
            filteredCategory={filteredCategory}
            showFilters={showFilters}
            onToggleFilters={toggleFilters}
            onSelectCategory={setFilteredCategory}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default MapScreen;
