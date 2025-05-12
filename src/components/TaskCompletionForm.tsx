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
import { BadgeService } from '../services/badgeService';
import { taskService } from '../services/taskService';

interface TaskCompletionFormProps {
  onSubmit: (data: {
    imageUrl?: string;
    note?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function TaskCompletionForm({
  onSubmit,
  onCancel,
  loading = false,
}: TaskCompletionFormProps) {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

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
    } catch (error) {
      Alert.alert('Hata', 'Konum alınırken bir hata oluştu');
    }
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert('Hata', 'Lütfen bir fotoğraf ekleyin');
      return;
    }

    onSubmit({
      imageUrl: imageUri,
      note: note || undefined,
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      } : undefined,
    });
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

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          Görevi Tamamla ve Onaya Gönder
        </Button>
        
        <Button
          mode="outlined"
          onPress={onCancel}
          disabled={loading}
          style={styles.cancelButton}
        >
          İptal
        </Button>
      </View>
      
      <View style={styles.approvalInfoContainer}>
        <Text style={styles.approvalInfo}>
          Not: Görev tamamlandıktan sonra, inceleme için onay bekleyecektir.
          Onaylandıktan sonra tamamlanmış görevler kısmında listelenecektir.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginRight: 8,
  },
  buttonText: {
    marginLeft: 8,
    color: '#2E7D32',
  },
  imageText: {
    marginTop: 8,
    color: '#2E7D32',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  locationText: {
    marginTop: 8,
    color: '#2E7D32',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  submitButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    flex: 1,
    marginLeft: 8,
    borderColor: '#F44336',
  },
  approvalInfoContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  approvalInfo: {
    color: '#0D47A1',
    fontSize: 14,
  },
}); 