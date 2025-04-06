import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Camera, MapPin } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { submitTaskVerification, uploadVerificationImage } from '../services/taskVerificationService';

interface TaskCompletionFormProps {
  taskId: string;
  userId: string;
  requiredLocation?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  onComplete: () => void;
}

export function TaskCompletionForm({
  taskId,
  userId,
  requiredLocation,
  onComplete,
}: TaskCompletionFormProps) {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Hata', 'Konum izni verilmedi');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      if (requiredLocation) {
        const distance = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          requiredLocation.latitude,
          requiredLocation.longitude
        );

        if (distance > requiredLocation.radiusMeters) {
          Alert.alert(
            'Uyarı',
            'Görev konumundan çok uzaktasınız. Lütfen görev konumuna gidin.'
          );
        }
      }
    } catch (error) {
      Alert.alert('Hata', 'Konum alınırken bir hata oluştu');
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert('Hata', 'Lütfen bir fotoğraf ekleyin');
      return;
    }

    if (requiredLocation && !location) {
      Alert.alert('Hata', 'Lütfen konumunuzu doğrulayın');
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await uploadVerificationImage(imageUri);
      
      await submitTaskVerification({
        taskId,
        userId,
        imageUrl,
        note,
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        } : undefined,
      });

      Alert.alert('Başarılı', 'Görev tamamlama isteğiniz gönderildi');
      onComplete();
    } catch (error) {
      Alert.alert('Hata', 'Görev tamamlanırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text variant="titleMedium">Fotoğraf Ekle</Text>
        <View style={styles.imageButtons}>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Camera size={24} color="#4CAF50" />
            <Text style={styles.buttonText}>Galeriden Seç</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
            <Camera size={24} color="#4CAF50" />
            <Text style={styles.buttonText}>Fotoğraf Çek</Text>
          </TouchableOpacity>
        </View>
        {imageUri && (
          <Text style={styles.imageText}>Fotoğraf seçildi</Text>
        )}
      </View>

      {requiredLocation && (
        <View style={styles.section}>
          <Text variant="titleMedium">Konum Doğrulama</Text>
          <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
            <MapPin size={24} color="#4CAF50" />
            <Text style={styles.buttonText}>Konumu Doğrula</Text>
          </TouchableOpacity>
          {location && (
            <Text style={styles.locationText}>
              Konum: {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
            </Text>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text variant="titleMedium">Not Ekle (İsteğe Bağlı)</Text>
        <TextInput
          mode="outlined"
          value={note}
          onChangeText={setNote}
          placeholder="Görev hakkında not ekleyin"
          multiline
          numberOfLines={4}
        />
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.submitButton}
      >
        Görevi Tamamla
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    marginLeft: 8,
    color: '#4CAF50',
    fontWeight: '500',
  },
  imageText: {
    marginTop: 8,
    color: '#4CAF50',
    textAlign: 'center',
  },
  locationText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
  },
}); 