import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { Appbar, Card, Button, IconButton } from 'react-native-paper';

const HomeScreen = () => {
  const navigation = useNavigation();

  // Acil yardım talepleri verisi
  const [emergencyRequests, setEmergencyRequests] = useState([
    { id: '1', title: 'Yangın Yardımı - Lokasyon 1', description: 'Yangın çıkmış, yardım bekliyor', lat: 37.78825, lon: -122.4324 },
    { id: '2', title: 'Sağlık Yardımı - Lokasyon 2', description: 'Acil sağlık yardımı bekliyor', lat: 37.75825, lon: -122.4294 },
    { id: '3', title: 'Sağlık Yardımı - Lokasyon 2', description: 'Acil sağlık yardımı bekliyor', lat: 37.75825, lon: -122.4294 },
    { id: '4', title: 'Sağlık Yardımı - Lokasyon 2', description: 'Acil sağlık yardımı bekliyor', lat: 37.75825, lon: -122.4294 },
    { id: '5', title: 'Sağlık Yardımı - Lokasyon 2', description: 'Acil sağlık yardımı bekliyor', lat: 37.75825, lon: -122.4294 },
  ]);

  // Harita merkezi ve zoom seviyesini kontrol etmek için state kullanıyoruz.
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Refreshing state
  const [refreshing, setRefreshing] = useState(false);

  // Refresh control için fonksiyon
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setEmergencyRequests([
        { id: '3', title: 'Yangın Yardımı - Lokasyon 3', description: 'Yeni yangın durumu', lat: 37.78835, lon: -122.4328 },
        { id: '4', title: 'Sağlık Yardımı - Lokasyon 4', description: 'Yeni sağlık yardımı bekliyor', lat: 37.75815, lon: -122.4290 },
      ]);
      setRefreshing(false);
    }, 2000);  // Simulate a network request delay
  };

  const handleEmergencyDetail = (emergencyRequest) => {
    navigation.navigate('EmergencyDetail', { emergencyRequest }); // Pass the selected emergency request data
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Appbar - Modern Tasarım */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="Ana Sayfa" />
        <Appbar.Action icon="bell" onPress={() => navigation.navigate('Notifications')} />
      </Appbar.Header>

        {/* Harita */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
            zoomEnabled={true}
            scrollEnabled={true}
            pitchEnabled={true}
            showsUserLocation={true}
          >
            {emergencyRequests.map(request => (
              <Marker
                key={request.id}
                coordinate={{ latitude: request.lat, longitude: request.lon }}
                title={request.title}
                description={request.description}
                pinColor="#ff7043"
              />
            ))}
          </MapView>
        </View>

        {/* Acil Yardım Talep Akışı */}
        <FlatList
          data={emergencyRequests}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Card style={styles.taskCard}>
              <Card.Content>
                <Text style={styles.taskTitle}>{item.title}</Text>
                <Text style={styles.taskDescription}>{item.description}</Text>
                <Button 
                  mode="contained" 
                  onPress={() => handleEmergencyDetail(item)} 
                  style={styles.selectButton}
                >
                  Yardım Bilgileri
                </Button>
              </Card.Content>
            </Card>
          )}
        />


      {/* Navbar */}
      <View style={styles.navbar}>
        <IconButton icon="home-outline" size={30} onPress={() => navigation.navigate('Home')} />
        <IconButton icon="clipboard-list" size={30} onPress={() => navigation.navigate('Tasks')} />
        <IconButton icon="account-outline" size={30} onPress={() => navigation.navigate('Profile')} />
        <IconButton icon="bell-outline" size={30} onPress={() => navigation.navigate('Notifications')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: '#81c784',  // Soft mor tonu
  },
  mapContainer: {
    height: 300,  // Set the map height to ensure it fits in the layout
    marginTop: 10,
    borderRadius: 10,
    borderColor: '#e0e0e0',
    borderWidth: 1,
  },
  map: {
    flex: 1,
    borderRadius: 10,
  },
  taskCard: {
    margin: 10,
    borderRadius: 10,
    elevation: 3,
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    borderWidth: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6a1b9a',
  },
  taskDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 10,
  },
  selectButton: {
    marginTop: 10,
    backgroundColor: '#81c784',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#81c784',
  },
});

export default HomeScreen;
