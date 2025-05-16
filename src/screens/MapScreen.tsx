import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, SafeAreaView, TouchableOpacity } from 'react-native';
import MapView, { Region, PROVIDER_GOOGLE, Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { EmergencyService } from '../services/emergencyService';
import { colors } from '../config/theme';
import { Text } from 'react-native-paper';
import { MapPin } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// Beyoğlu koordinatları
const BEYOGLU_COORDINATES = {
  latitude: 41.0370,
  longitude: 28.9850,
  latitudeDelta: 0.0122,
  longitudeDelta: 0.0121,
};

// Haversine formülü ile iki nokta arası mesafe hesaplama (km cinsinden)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Dünya'nın yarıçapı (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Görünen bölgedeki görevleri filtreleme
const filterEmergenciesByRegion = (emergencies: any[], region: Region) => {
  // Haritada görünen bölgenin köşe koordinatlarını hesapla
  const northLat = region.latitude + region.latitudeDelta / 2;
  const southLat = region.latitude - region.latitudeDelta / 2;
  const westLng = region.longitude - region.longitudeDelta / 2;
  const eastLng = region.longitude + region.longitudeDelta / 2;

  // Görünen bölgenin merkez noktasından maksimum mesafeyi hesapla
  const maxDistance = calculateDistance(northLat, region.longitude, southLat, region.longitude) / 2;

  return emergencies.filter(emergency => {
    if (!emergency.coordinates) return false;

    // Acil durumun merkeze olan uzaklığını hesapla
    const distance = calculateDistance(
      region.latitude,
      region.longitude,
      emergency.coordinates.latitude,
      emergency.coordinates.longitude
    );

    // Koordinatların görünen bölge içinde olup olmadığını kontrol et
    const isInLatRange = emergency.coordinates.latitude <= northLat && emergency.coordinates.latitude >= southLat;
    const isInLngRange = emergency.coordinates.longitude >= westLng && emergency.coordinates.longitude <= eastLng;

    return isInLatRange && isInLngRange && distance <= maxDistance;
  });
};

interface MapScreenProps {
  navigation: any;
}

const MapScreen: React.FC<MapScreenProps> = () => {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>({
    coords: {
      latitude: BEYOGLU_COORDINATES.latitude,
      longitude: BEYOGLU_COORDINATES.longitude,
      altitude: null,
      accuracy: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    },
    timestamp: Date.now()
  });
  const [allEmergencies, setAllEmergencies] = useState<any[]>([]);
  const [visibleEmergencies, setVisibleEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmergency, setSelectedEmergency] = useState<any | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<Region>(BEYOGLU_COORDINATES);
  
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation();
  
  useEffect(() => {
    loadLocationAndEmergencies();
  }, []);

  // Bölge değiştiğinde görünen görevleri güncelle
  useEffect(() => {
    if (allEmergencies.length > 0 && currentRegion) {
      const filtered = filterEmergenciesByRegion(allEmergencies, currentRegion);
      setVisibleEmergencies(filtered);
    }
  }, [currentRegion, allEmergencies]);
  
  const loadLocationAndEmergencies = async () => {
    try {
      const emergencyService = EmergencyService.getInstance();
      const loadedEmergencies = await emergencyService.getPendingEmergencyRequests();
      
      // Convert location string to coordinates if needed
      const emergenciesWithCoordinates = loadedEmergencies.map(emergency => {
        if (typeof emergency.location === 'string' && emergency.location.includes(',')) {
          const [lat, lng] = emergency.location.split(',').map(coord => parseFloat(coord.trim()));
          return {
            ...emergency,
            coordinates: {
              latitude: lat,
              longitude: lng
            }
          };
        }
        return emergency;
      });
      
      setAllEmergencies(emergenciesWithCoordinates);
      setVisibleEmergencies(filterEmergenciesByRegion(emergenciesWithCoordinates, BEYOGLU_COORDINATES));
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleMarkerPress = (emergency: any) => {
    setSelectedEmergency(emergency);
    if (emergency.relatedTaskId) {
      navigation.navigate('TaskDetail', { taskId: emergency.relatedTaskId });
    }
  };

  const handleMapReady = () => {
    setMapReady(true);
  };

  const handleRegionChange = (region: Region) => {
    setCurrentRegion(region);
  };

  const centerOnUserLocation = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: BEYOGLU_COORDINATES.latitude,
        longitude: BEYOGLU_COORDINATES.longitude,
        latitudeDelta: 0.0122,
        longitudeDelta: 0.0121,
      }, 1000);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={BEYOGLU_COORDINATES}
            showsUserLocation
            showsCompass
            showsMyLocationButton={false}
            onMapReady={handleMapReady}
            onRegionChangeComplete={handleRegionChange}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            
            // Harita kontrolleri
            scrollEnabled={true}
            zoomEnabled={true}
            rotateEnabled={true}
            pitchEnabled={true}
            moveOnMarkerPress={false}
            
            // Dokunmatik hareketler
            zoomTapEnabled={true}
            zoomControlEnabled={true}
            minZoomLevel={10}
            maxZoomLevel={20}
            
            // Gesture ayarları
            mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
            loadingEnabled={true}
            loadingIndicatorColor={colors.primary}
            loadingBackgroundColor={colors.surface}
          >
            {mapReady && visibleEmergencies.map(emergency => (
              emergency.coordinates && (
                <Marker
                  key={emergency.id}
                  coordinate={emergency.coordinates}
                  onPress={() => handleMarkerPress(emergency)}
                >
                  <View style={[styles.markerContainer, { backgroundColor: getUrgencyColor(emergency.urgency) }]}>
                    <MapPin size={20} color="white" />
                  </View>
                  <Callout onPress={() => handleMarkerPress(emergency)}>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutTitle}>{emergency.title}</Text>
                      <Text style={styles.calloutDescription} numberOfLines={2}>
                        {emergency.description}
                      </Text>
                      <Text style={[styles.calloutUrgency, { color: getUrgencyColor(emergency.urgency) }]}>
                        {getUrgencyLabel(emergency.urgency)}
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              )
            ))}
          </MapView>

          {/* Zoom Kontrol Butonları */}
          <View style={styles.zoomControls}>
            <TouchableOpacity 
              style={styles.zoomButton}
              onPress={() => {
                if (mapRef.current) {
                  const region = {
                    ...currentRegion,
                    latitudeDelta: currentRegion.latitudeDelta * 0.5,
                    longitudeDelta: currentRegion.longitudeDelta * 0.5,
                  };
                  mapRef.current.animateToRegion(region, 300);
                }
              }}
            >
              <Text style={styles.zoomButtonText}>+</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.zoomButton}
              onPress={() => {
                if (mapRef.current) {
                  const region = {
                    ...currentRegion,
                    latitudeDelta: currentRegion.latitudeDelta * 2,
                    longitudeDelta: currentRegion.longitudeDelta * 2,
                  };
                  mapRef.current.animateToRegion(region, 300);
                }
              }}
            >
              <Text style={styles.zoomButtonText}>-</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.centerButton}
            onPress={centerOnUserLocation}
          >
            <MapPin size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'critical':
      return colors.error;
    case 'high':
      return colors.secondary;
    case 'medium':
      return colors.warning;
    case 'low':
      return colors.info;
    default:
      return colors.primary;
  }
};

const getUrgencyLabel = (urgency: string) => {
  switch (urgency) {
    case 'critical':
      return 'Kritik';
    case 'high':
      return 'Yüksek';
    case 'medium':
      return 'Orta';
    case 'low':
      return 'Düşük';
    default:
      return urgency;
  }
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
  markerContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  calloutContainer: {
    padding: 10,
    maxWidth: 200,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  calloutUrgency: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -50 }],
    backgroundColor: 'transparent',
  },
  zoomButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  zoomButtonText: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default MapScreen;
