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

// Tip seçenekleri
const URGENCY_OPTIONS = [
  { label: 'Kritik', value: 'CRITICAL', color: colors.error },
  { label: 'Yüksek', value: 'HIGH', color: colors.secondary },
  { label: 'Orta', value: 'MEDIUM', color: colors.warning },
  { label: 'Düşük', value: 'LOW', color: colors.info },
];

// Kategori seçenekleri
const CATEGORY_OPTIONS = [
  { label: 'Yaralı Hayvan', value: 'INJURED', icon: 'medical-bag' },
  { label: 'Aç/Susuz', value: 'HUNGRY', icon: 'food' },
  { label: 'Kayıp', value: 'LOST', icon: 'compass' },
  { label: 'Diğer', value: 'OTHER', icon: 'help-circle' },
];

export default function AddEmergencyScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState([]);
  const [urgency, setUrgency] = useState('MEDIUM');
  const [category, setCategory] = useState('INJURED');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  
  // Formun gönderilmesi
  const handleSubmit = () => {
    if (!isFormValid) {
      Alert.alert('Hata', 'Lütfen tüm alanları doğru şekilde doldurunuz');
      return;
    }
    
    setIsSubmitting(true);
    
    // API isteği yapılacak yer - şimdilik simulasyon
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Başarılı', 
        'Acil durum bildiriminiz alındı. Teşekkür ederiz!',
        [
          { 
            text: 'Tamam', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    }, 1500);
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
          
          <View style={styles.locationInputContainer}>
            <TextInput
              label="Konum"
              value={location}
              onChangeText={setLocation}
              mode="outlined"
              style={styles.locationInput}
              error={locationError}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              right={
                <TextInput.Icon 
                  icon={({ size, color }) => <MapPin size={size} color={color} />}
                  onPress={() => {
                    // Konum seçici açılabilir
                    Alert.alert('Bilgi', 'Harita üzerinden konum seçimi eklenecek');
                  }}
                />
              }
            />
          </View>
          {locationError && (
            <HelperText type="error" visible={locationError}>
              Konum bilgisi gereklidir
            </HelperText>
          )}
          
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
  locationInputContainer: {
    marginBottom: spacing.xs,
  },
  locationInput: {
    backgroundColor: colors.surface,
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
});
