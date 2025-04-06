import React, { Component } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, ScrollView, StatusBar, Platform } from 'react-native';
import { Text, Button, Card, IconButton, FAB } from 'react-native-paper';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { getTasks } from '../services/taskService';
import { Task } from '../types/task';
import { MapPin, Navigation } from 'lucide-react-native';

// Marker bileşeni için props tipi
type MarkerProps = {
  task: Task;
  onPress: (task: Task) => void;
};

// Class component olarak Marker bileşeni
class TaskMarker extends Component<MarkerProps> {
  shouldComponentUpdate(nextProps: MarkerProps) {
    return (
      this.props.task.id !== nextProps.task.id ||
      this.props.task.status !== nextProps.task.status
    );
  }

  render() {
    const { task, onPress } = this.props;
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
          task.status === 'OPEN' ? '#4CAF50' : 
          task.status === 'IN_PROGRESS' ? '#FFC107' : '#9E9E9E'
        }
        onPress={() => onPress(task)}
        tracksViewChanges={false}
      />
    );
  }
}

// MapScreen bileşeni için state tipi
type MapScreenState = {
  userLocation: Location.LocationObject | null;
  tasks: Task[];
  loading: boolean;
  selectedTask: Task | null;
  filteredCategory: string | null;
  showFilters: boolean;
  mapReady: boolean;
};

// Class component olarak MapScreen
export default class MapScreen extends Component<any, MapScreenState> {
  private mapRef = React.createRef<MapView>();
  
  constructor(props: any) {
    super(props);
    this.state = {
      userLocation: null,
      tasks: [],
      loading: true,
      selectedTask: null,
      filteredCategory: null,
      showFilters: false,
      mapReady: false
    };
  }

  componentDidMount() {
    this.loadLocationAndTasks();
  }

  loadLocationAndTasks = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        this.setState({ loading: false });
        return;
      }

      // Konum ve görevleri paralel olarak yükle
      const [location, tasks] = await Promise.all([
        Location.getCurrentPositionAsync({}),
        getTasks()
      ]);

      this.setState({
        userLocation: location,
        tasks,
        loading: false
      });
    } catch (error) {
      console.error('Error loading data:', error);
      this.setState({ loading: false });
    }
  };

  handleCenterToUser = () => {
    if (this.state.userLocation && this.mapRef.current) {
      const region: Region = {
        latitude: this.state.userLocation.coords.latitude,
        longitude: this.state.userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      this.mapRef.current.animateToRegion(region, 300);
    }
  };

  handleMarkerPress = (task: Task) => {
    this.setState({ selectedTask: task });
  };

  toggleFilters = () => {
    this.setState(prevState => ({
      showFilters: !prevState.showFilters
    }));
  };

  handleCloseTaskInfo = () => {
    this.setState({ selectedTask: null });
  };

  navigateToTaskDetail = (taskId: string) => {
    this.props.navigation.navigate('TaskDetail', { taskId });
  };

  handleMapReady = () => {
    this.setState({ mapReady: true });
  };

  getFilteredTasks = () => {
    const { tasks, filteredCategory } = this.state;
    return filteredCategory 
      ? tasks.filter(task => task.category === filteredCategory)
      : tasks;
  };

  getCategories = () => {
    return [...new Set(this.state.tasks.map(task => task.category))];
  };

  render() {
    const { loading, userLocation, selectedTask, filteredCategory, showFilters, mapReady } = this.state;

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
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

    const tasksToShow = this.getFilteredTasks();
    const categories = this.getCategories();

    return (
      <View style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        
        <View style={styles.mapContainer}>
          <MapView
            ref={this.mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            showsUserLocation
            showsCompass
            showsMyLocationButton={false}
            onMapReady={this.handleMapReady}
            toolbarEnabled={false}
            rotateEnabled={true}
            zoomEnabled={true}
          >
            {mapReady && tasksToShow.map(task => (
              <TaskMarker 
                key={task.id}
                task={task} 
                onPress={this.handleMarkerPress} 
              />
            ))}
          </MapView>

          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.title}>Görevleri Haritada Gör</Text>
            <FAB
              icon={showFilters ? "chevron-up" : "filter-variant"}
              style={styles.filterToggleButton}
              size="small"
              onPress={this.toggleFilters}
              color="#4CAF50"
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
                  onPress={() => this.setState({ filteredCategory: null })}
                >
                  <Text style={!filteredCategory ? styles.activeFilterText : styles.filterText}>
                    Tümü
                  </Text>
                </TouchableOpacity>
                
                {categories.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[styles.filterChip, filteredCategory === category && styles.activeFilterChip]}
                    onPress={() => this.setState({ 
                      filteredCategory: filteredCategory === category ? null : category 
                    })}
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
              onPress={this.handleCenterToUser}
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
                <View style={styles.statusContainer}>
                  <Text
                    variant="labelMedium"
                    style={{
                      color: selectedTask.status === 'OPEN' ? '#4CAF50' : 
                            selectedTask.status === 'IN_PROGRESS' ? '#FFC107' : '#9E9E9E'
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
                <MapPin size={16} color="#666666" />
                <Text variant="bodySmall" style={styles.locationText}>
                  {selectedTask.location.address}
                </Text>
              </View>
              
              <Button
                mode="contained"
                style={styles.detailButton}
                onPress={() => this.navigateToTaskDetail(selectedTask.id)}
              >
                Detayları Gör
              </Button>
            </Card.Content>
            
            <IconButton
              icon="close"
              size={20}
              style={styles.closeButton}
              onPress={this.handleCloseTaskInfo}
            />
          </Card>
        )}
      </View>
    );
  }
}

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = StatusBar.currentHeight || 0;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : STATUSBAR_HEIGHT + 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  title: {
    color: '#333333',
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  filterToggleButton: {
    backgroundColor: '#FFFFFF',
    elevation: 4,
  },
  filterContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : STATUSBAR_HEIGHT + 60,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 5,
    borderRadius: 20,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    backgroundColor: '#E8F5E9',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#4CAF50',
  },
  filterText: {
    color: '#4CAF50',
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
    bottom: 24,
    right: 16,
    zIndex: 5,
  },
  locationButton: {
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  taskInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: height * 0.3,
    zIndex: 10,
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
    color: '#333333',
  },
  statusContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginLeft: 8,
  },
  taskDescription: {
    marginBottom: 12,
    color: '#555555',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    marginLeft: 6,
    color: '#666666',
    flex: 1,
  },
  detailButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
});
