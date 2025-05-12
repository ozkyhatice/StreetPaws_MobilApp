import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { colors, spacing, borderRadius, shadows } from '../config/theme';
import { useAuth } from '../hooks/useAuth';
import { EmergencyService } from '../services/emergencyService';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type EmergencyHelpScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const EmergencyHelpScreen = () => {
  const navigation = useNavigation<EmergencyHelpScreenNavigationProp>();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    animalType: '',
    urgency: 'medium', // low, medium, high
    contactPhone: '',
  });
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için izin vermeniz gerekiyor!');
      return;
    }

    // Pick image
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePicture = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf çekmek için kamera izni vermeniz gerekiyor!');
      return;
    }

    // Take picture
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storage = getStorage();
      const filename = `emergency_${new Date().getTime()}`;
      const storageRef = ref(storage, `emergency_images/${filename}`);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
      Alert.alert('Hata', 'Lütfen başlık, açıklama ve konum alanlarını doldurun.');
      return;
    }

    try {
      setIsLoading(true);
      const emergencyService = EmergencyService.getInstance();
      
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }
      
      await emergencyService.createEmergencyRequest({
        ...formData,
        imageUrl,
        userId: user?.uid,
        userName: user?.displayName,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      Alert.alert(
        'Başarılı',
        'Acil durum bildiriminiz başarıyla alındı. En kısa sürede size ulaşılacaktır.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Hata', `Bildirim gönderilirken bir hata oluştu: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#FF6B6A', '#FF8787', '#FFA5A5']}
        style={styles.gradient}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Acil Durum Bildir</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Başlık *</Text>
            <TextInput
              style={styles.input}
              placeholder="Kısa bir başlık girin"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Açıklama *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Durumu detaylı bir şekilde açıklayın"
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Konum *</Text>
            <TextInput
              style={styles.input}
              placeholder="Konum bilgisi girin"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hayvan Türü</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Kedi, Köpek, Kuş"
              value={formData.animalType}
              onChangeText={(text) => setFormData({ ...formData, animalType: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Acil Durum Seviyesi</Text>
            <View style={styles.urgencyContainer}>
              {['low', 'medium', 'high'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.urgencyButton,
                    formData.urgency === level && styles.urgencyButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, urgency: level })}
                >
                  <Text
                    style={[
                      styles.urgencyButtonText,
                      formData.urgency === level && styles.urgencyButtonTextActive,
                    ]}
                  >
                    {level === 'low' ? 'Düşük' : level === 'medium' ? 'Orta' : 'Yüksek'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>İletişim Telefonu</Text>
            <TextInput
              style={styles.input}
              placeholder="Telefon numaranızı girin"
              keyboardType="phone-pad"
              value={formData.contactPhone}
              onChangeText={(text) => setFormData({ ...formData, contactPhone: text })}
            />
          </View>

          

          <TouchableOpacity
            style={[styles.submitButton, (isLoading || uploading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading || uploading}
          >
            {isLoading || uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Bildirimi Gönder</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 200,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? spacing.xl * 2 : spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: spacing.md,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    marginTop: -borderRadius.xl,
    ...shadows.large,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.large,
    padding: spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  urgencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  urgencyButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  urgencyButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  urgencyButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  urgencyButtonTextActive: {
    color: '#fff',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
  },
  imageButtonText: {
    color: colors.primary,
    marginLeft: spacing.xs,
    fontSize: 14,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.large,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.large,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default EmergencyHelpScreen; 