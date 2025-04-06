import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Camera, MapPin, Upload, AlertTriangle } from 'lucide-react-native';

const EmergencyScreen = () => {
  const navigation = useNavigation();
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = () => {
    // Add your submit logic here
    console.log('Emergency submitted:', { description, location });
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <AlertTriangle size={32} color="#FF6B6B" />
        <Text style={styles.headerTitle}>Acil Durum Bildirimi</Text>
      </View>

      <View style={styles.content}>
        {/* Emergency Type Selection */}
        <Text style={styles.sectionTitle}>Acil Durum Türü</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity style={[styles.typeButton, styles.selectedType]}>
            <Text style={styles.typeButtonText}>Yaralı Hayvan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.typeButton}>
            <Text style={styles.typeButtonText}>Aç/Susuz Hayvan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.typeButton}>
            <Text style={styles.typeButtonText}>Diğer</Text>
          </TouchableOpacity>
        </View>

        {/* Description Input */}
        <Text style={styles.sectionTitle}>Durum Açıklaması</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          placeholder="Lütfen durumu detaylı bir şekilde açıklayın..."
          value={description}
          onChangeText={setDescription}
        />

        {/* Location Input */}
        <Text style={styles.sectionTitle}>Konum</Text>
        <View style={styles.locationInput}>
          <MapPin size={20} color="#666" />
          <TextInput
            style={styles.locationTextInput}
            placeholder="Konumu girin veya haritadan seçin"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Photo Upload */}
        <Text style={styles.sectionTitle}>Fotoğraf Ekle</Text>
        <TouchableOpacity style={styles.uploadButton}>
          <Camera size={24} color="#666" />
          <Text style={styles.uploadText}>Fotoğraf Çek</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadButton}>
          <Upload size={24} color="#666" />
          <Text style={styles.uploadText}>Galeriden Seç</Text>
        </TouchableOpacity>

        {/* Preview Images */}
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: 'https://placekitten.com/100/100' }}
            style={styles.previewImage}
          />
          <TouchableOpacity style={styles.removeButton}>
            <Text style={styles.removeButtonText}>X</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Acil Durumu Bildir</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedType: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  typeButtonText: {
    color: '#666',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  locationTextInput: {
    flex: 1,
    marginLeft: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  uploadText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  previewContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B6B',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EmergencyScreen;
