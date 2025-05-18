import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  KeyboardAvoidingView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Text, TextInput, Button, Chip, HelperText, Divider } from 'react-native-paper';
import { MapPin, Camera, PlusCircle, ChevronLeft, AlertTriangle } from 'lucide-react-native';
import { colors, spacing, shadows, borderRadius, typography } from '../config/theme';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { EmergencyService } from '../services/emergencyService';
import { EmergencyRequest } from '../types/emergency';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../hooks/useAuth';
import MapView, { Marker } from 'react-native-maps';

// Tip seçenekleri - EmergencyRequest.urgency ile uyumlu olmalı
const URGENCY_OPTIONS = [
  { label: 'Kritik', value: 'critical' as const, color: colors.error },
  { label: 'Yüksek', value: 'high' as const, color: colors.secondary },
  { label: 'Orta', value: 'medium' as const, color: colors.warning },
  { label: 'Düşük', value: 'low' as const, color: colors.info },
];

// Kategori seçenekleri
const CATEGORY_OPTIONS = [
  { label: 'Sağlık/Yaralı', value: 'HEALTH' as const, icon: 'medical-bag' },
  { label: 'Beslenme/Aç', value: 'FEEDING' as const, icon: 'food' },
  { label: 'Barınak/Korunak', value: 'SHELTER' as const, icon: 'home' },
  { label: 'Temizlik/Bakım', value: 'CLEANING' as const, icon: 'cleanup' },
  { label: 'Diğer', value: 'OTHER' as const, icon: 'help-circle' },
];

export default function AddEmergencyScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [category, setCategory] = useState<'FEEDING' | 'CLEANING' | 'HEALTH' | 'SHELTER' | 'OTHER'>('HEALTH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const titleError = title.length > 0 && title.length < 3;
  const descriptionError = description.length > 0 && description.length < 10;
  const locationError = location.length === 0;
  
  // Form geçerliliğini kontrol et
  const isFormValid = 
    title.length >= 3 && 
    description.length >= 10 && 
    location.length > 0;
  
  // Fotoğraf seçici
  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('Uyarı', 'En fazla 3 fotoğraf ekleyebilirsiniz');
      return;
    }
    if (images.length < 1)
    {
      Alert.alert('Uyarı', 'Lütfen en az bir fotoğraf ekleyiniz');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };
  
  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };
  
  // Firebase Storage'a görsel yükleme
  const uploadImage = async (uri) => {
    const storage = getStorage();
    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const storageRef = ref(storage, `emergency_images/${Date.now()}_${filename}`);
    
    // URI'den blob oluştur
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Firebase'e yükle
    await uploadBytes(storageRef, blob);
    
    // İndirme URL'sini al
    return await getDownloadURL(storageRef);
  };
  
  const handleLocationSelect = (coords: { latitude: number; longitude: number }) => {
    setCoordinates(coords);
    setLocation(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
    setShowMap(false);
  };
  
  // Formun gönderilmesi
  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert('Hata', 'Lütfen tüm alanları doğru şekilde doldurunuz');
      return;
    }
    
    if (!user) {
      Alert.alert('Hata', 'Acil durum bildirmek için giriş yapmalısınız');
      return;
    }
    
    if (!coordinates) {
      Alert.alert('Hata', 'Lütfen haritadan bir konum seçin');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Görselleri işle
      let imageUrl = null;
      if (images.length > 0) {
        try {
          console.log("Uploading image to Firebase Storage...");
          imageUrl = await uploadImage(images[0]);
          console.log("Image uploaded successfully:", imageUrl);
        } catch (imageError) {
          console.error("Error uploading image:", imageError);
        }
      }
      
      // Acil durum verisini hazırla
      const emergencyService = EmergencyService.getInstance();
      const emergencyRequest: Omit<EmergencyRequest, 'id'> = {
        title,
        description,
        location,
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        },
        animalType: category,
        urgency,
        imageUrl,
        userId: user.uid,
        userName: user.displayName || 'Kullanıcı',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        contactPhone: user.phoneNumber || ''
      };
      
      console.log("Creating emergency request:", emergencyRequest);
      
      // Firestore'a kaydet
      const emergencyId = await emergencyService.createEmergencyRequest(emergencyRequest);
      console.log("Emergency request created successfully with ID:", emergencyId);
      
      // Başarı mesajı göster
      Alert.alert(
        'Başarılı', 
        'Acil durum bildiriminiz alındı. Teşekkür ederiz!',
        [
          { 
            text: 'Tamam', 
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating emergency request:', error);
      Alert.alert('Hata', 'Acil durum bildirimi gönderilirken bir hata oluştu: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Acil Durum Bildirimi</Text>
          <View style={styles.placeholder} />
        </View>
        
        {showMap ? (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: 41.0082,
                longitude: 28.9784,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              onPress={(e) => handleLocationSelect(e.nativeEvent.coordinate)}
            >
              {coordinates && (
                <Marker
                  coordinate={coordinates}
                  title="Seçilen Konum"
                />
              )}
            </MapView>
            <TouchableOpacity 
              style={styles.closeMapButton}
              onPress={() => setShowMap(false)}
            >
              <Text style={styles.closeMapButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.infoBox}>
              <AlertTriangle size={20} color={colors.warning} />
              <Text style={styles.infoText}>
                Lütfen acil durumu ayrıntılı bir şekilde açıklayın. Bu bilgiler yardım ekiplerine ulaşacak.
              </Text>
            </View>
            
            <Text style={styles.sectionTitle}>Acil Durum Bilgileri</Text>
            
            <TextInput
              label="Başlık"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              error={titleError}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />
            {titleError && (
              <HelperText type="error" visible={titleError}>
                Başlık en az 3 karakter olmalıdır
              </HelperText>
            )}
            
            <TextInput
              label="Açıklama"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.textArea}
              error={descriptionError}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />
            {descriptionError && (
              <HelperText type="error" visible={descriptionError}>
                Açıklama en az 10 karakter olmalıdır
              </HelperText>
            )}
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Konum</Text>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => setShowMap(true)}
              >
                <View style={styles.locationButtonContent}>
                  <MapPin size={20} color={colors.primary} />
                  <Text style={styles.locationButtonText}>
                    {coordinates ? 'Konumu Değiştir' : 'Haritadan Konum Seç'}
                  </Text>
                </View>
              </TouchableOpacity>
              {coordinates && (
                <Text style={styles.selectedLocation}>
                  Seçilen Konum: {location}
                </Text>
              )}
              {locationError && (
                <HelperText type="error">
                  Lütfen bir konum seçin
                </HelperText>
              )}
            </View>
            
            <Text style={styles.sectionTitle}>Kategori</Text>
            <View style={styles.categoryContainer}>
              {CATEGORY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.categoryButton,
                    category === option.value && styles.selectedCategoryButton
                  ]}
                  onPress={() => setCategory(option.value)}
                >
                  <Text 
                    style={[
                      styles.categoryText,
                      category === option.value && styles.selectedCategoryText
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.sectionTitle}>Öncelik Seviyesi</Text>
            <View style={styles.urgencyContainer}>
              {URGENCY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.urgencyButton,
                    urgency === option.value && {
                      backgroundColor: option.color + '20',
                      borderColor: option.color
                    }
                  ]}
                  onPress={() => setUrgency(option.value)}
                >
                  <View 
                    style={[
                      styles.urgencyDot,
                      { backgroundColor: option.color }
                    ]} 
                  />
                  <Text 
                    style={[
                      styles.urgencyText,
                      urgency === option.value && { color: option.color }
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.sectionTitle}>Fotoğraflar</Text>
            <Text style={styles.photoInfo}>En fazla 3 fotoğraf ekleyebilirsiniz</Text>
            
            <View style={styles.imageContainer}>
              {images.map((img, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: img }} style={styles.image} />
                  <TouchableOpacity 
                    style={styles.removeImageButton} 
                    onPress={() => removeImage(index)}
                  >
                    <Text style={styles.removeImageText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              {images.length < 3 && (
                <TouchableOpacity 
                  style={styles.addImageButton} 
                  onPress={pickImage}
                >
                  <Camera size={24} color={colors.primary} />
                  <Text style={styles.addImageText}>Fotoğraf Ekle</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                style={styles.submitButton}
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!isFormValid || isSubmitting}
              >
                Acil Durumu Bildir
              </Button>
              
              <Button
                mode="outlined"
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={isSubmitting}
              >
                İptal Et
              </Button>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  placeholder: {
    width: 24,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: 100, // Extra bottom padding for scrolling
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '10',
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  infoText: {
    ...typography.body2,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  textArea: {
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    minHeight: 100,
  },
  inputContainer: {
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  locationButton: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButtonText: {
    marginLeft: 8,
    color: colors.primary,
    fontSize: 16,
  },
  selectedLocation: {
    marginTop: 8,
    color: colors.text,
    fontSize: 14,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  categoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCategoryButton: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  categoryText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  selectedCategoryText: {
    color: colors.primary,
    fontWeight: '600',
  },
  urgencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  urgencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  urgencyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  urgencyText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  photoInfo: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.surface,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  submitButton: {
    marginBottom: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.xs,
  },
  cancelButton: {
    borderRadius: borderRadius.medium,
    borderColor: colors.border,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  closeMapButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.surface,
    padding: 8,
    borderRadius: 8,
    ...shadows.medium,
  },
  closeMapButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
