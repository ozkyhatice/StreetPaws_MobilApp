import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Appbar, Card, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';

const EmergencyDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { emergencyRequest } = route.params;

  return (
    <View style={{ flex: 1 }}>
      {/* Appbar */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Yardım Bilgileri" />
      </Appbar.Header>

      {/* Detay Kartı */}
      <Card style={styles.detailCard}>
        <Card.Content>
          <Text style={styles.title}>{emergencyRequest.title}</Text>
          <Text style={styles.description}>{emergencyRequest.description}</Text>
        </Card.Content>
      </Card>

      {/* Harita */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: emergencyRequest.lat,
            longitude: emergencyRequest.lon,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker
            coordinate={{ latitude: emergencyRequest.lat, longitude: emergencyRequest.lon }}
            title={emergencyRequest.title}
            description={emergencyRequest.description}
            pinColor="#ff7043"
          />
        </MapView>
      </View>

      {/* Butonlar */}
      <View style={styles.buttonContainer}>
        <Button mode="contained" style={styles.button} onPress={() => console.log("Arama Yapılıyor...")}>Acil Durumu Ara</Button>
        <Button mode="contained" style={styles.button} onPress={() => console.log("Yardım Ekibiyle İletişime Geçiliyor...")}>Yardım Ekibiyle Konuş</Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: '#81c784',
  },
  detailCard: {
    margin: 10,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6a1b9a',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: '#757575',
  },
  mapContainer: {
    height: 250,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    padding: 15,
    alignItems: 'center',
  },
  button: {
    marginVertical: 5,
    backgroundColor: '#ff7043',
  },
});

export default EmergencyDetailScreen;
