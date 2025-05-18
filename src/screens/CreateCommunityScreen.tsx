import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Image,
} from 'react-native';
import { Text, TextInput, Button, Chip, Divider, Switch, HelperText } from 'react-native-paper';
import { ChevronLeft, Globe, Lock, Camera, MapPin } from 'lucide-react-native';
import { colors, spacing, shadows, borderRadius, typography } from '../config/theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../hooks/useAuth';
import { CommunityService } from '../services/communityService';
import { CommunityCategory } from '../types/community';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type CreateCommunityScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function CreateCommunityScreen() {
  const navigation = useNavigation<CreateCommunityScreenNavigationProp>();
  const { user } = useAuth();
  const communityService = CommunityService.getInstance();
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CommunityCategory>('ANIMAL_RESCUE');
  const [isPublic, setIsPublic] = useState(true);
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validation states
  const nameError = name.length > 0 && name.length < 3;
  const descriptionError = description.length > 0 && description.length < 10;
  
  // Form validation
  const isFormValid = name.length >= 3 && description.length >= 10 && category !== '';
  
  // Category options
  const CATEGORY_OPTIONS: { label: string, value: CommunityCategory }[] = [
    { label: 'Hayvan Kurtarma', value: 'ANIMAL_RESCUE' },
    { label: 'Besleme', value: 'FEEDING' },
    { label: 'Barınak', value: 'SHELTER' },
    { label: 'Sahiplendirme', value: 'ADOPTION' },
    { label: 'Veteriner', value: 'VETERINARY' },
    { label: 'Eğitim', value: 'EDUCATION' },
    { label: 'Bağış Toplama', value: 'FUNDRAISING' },
    { label: 'Diğer', value: 'OTHER' },
  ];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };
  
  const addTag = () => {
    if (currentTag.trim() !== '' && !tags.includes(currentTag.trim().toLowerCase())) {
      setTags([...tags, currentTag.trim().toLowerCase()]);
      setCurrentTag('');
    }
  };
  
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      console.log("Starting image upload process...");
      
      // Verify storage is initialized
      const storage = getStorage();
      if (!storage) {
        console.error("Firebase storage is not initialized!");
        return null;
      }
      
      // Create a unique filename
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}_${filename}`;
      console.log("Using filename:", uniqueFilename);
      
      // Create storage reference
      const storageRef = ref(storage, `community_images/${uniqueFilename}`);
      console.log("Storage reference path:", storageRef.fullPath);
      
      console.log("Fetching image data...");
      try {
        // Fetch the image data
        const response = await fetch(uri);
        
        if (!response.ok) {
          console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
          return null;
        }
        
        console.log("Converting to blob...");
        const blob = await response.blob();
        console.log("Blob created, size:", blob.size, "type:", blob.type);
        
        if (blob.size === 0) {
          console.error("Blob has zero size!");
          return null;
        }
        
        console.log("Uploading to Firebase...");
        try {
          // Firebase upload
          const uploadResult = await uploadBytes(storageRef, blob);
          console.log("Upload successful! Metadata:", uploadResult.metadata);
          
          try {
            // Get download URL
            console.log("Getting download URL...");
            const downloadURL = await getDownloadURL(storageRef);
            console.log("Got download URL:", downloadURL);
            return downloadURL;
          } catch (urlError) {
            console.error("Error getting download URL:", urlError);
            return null;
          }
        } catch (uploadError) {
          console.error("Error during uploadBytes:", uploadError);
          return null;
        }
      } catch (fetchError) {
        console.error("Error fetching or processing image:", fetchError);
        return null;
      }
    } catch (error) {
      console.error("Unhandled error in uploadImage:", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert('Hata', 'Lütfen tüm alanları doğru şekilde doldurunuz');
      return;
    }
    
    if (!user) {
      Alert.alert('Hata', 'Topluluk oluşturmak için giriş yapmalısınız');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload image if selected
      let photoURL = null;
      if (imageUri) {
        console.log("Uploading image from URI:", imageUri);
        photoURL = await uploadImage(imageUri);
        
        if (!photoURL) {
          console.log("Could not upload image, continuing without photo");
        } else {
          console.log("Image uploaded successfully:", photoURL);
        }
      }
      
      // Create community object without undefined values
      const communityData: any = {
        name,
        description,
        category,
        isPublic,
        createdBy: user.uid,
        members: [],
        admins: []
      };
      
      // Add optional fields only if they have values
      if (photoURL) {
        communityData.photoURL = photoURL;
      }
      
      if (location.trim() !== '') {
        communityData.location = {
          latitude: 41.0082, // Default value, should be obtained from a map in real app
          longitude: 28.9784, // Default value
          address: location
        };
      }
      
      if (tags.length > 0) {
        communityData.tags = tags;
      }
      
      // Create the community
      const newCommunity = await communityService.createCommunity(communityData);
      
      Alert.alert(
        'Başarılı', 
        'Topluluk başarıyla oluşturuldu',
        [
          { 
            text: 'Tamam', 
            onPress: () => {
              // First go back to refresh the communities list
              navigation.goBack();
              // Then navigate to the community detail
              setTimeout(() => {
                navigation.navigate('CommunityDetail', { communityId: newCommunity.id });
              }, 100);
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error creating community:", error);
      Alert.alert('Hata', 'Topluluk oluşturulurken bir sorun oluştu');
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
          <Text style={styles.headerTitle}>Topluluk Oluştur</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.imageContainer}>
            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              ) : (
                <>
                  <Camera size={32} color={colors.primary} />
                  <Text style={styles.imageUploadText}>Topluluk Fotoğrafı Ekle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          <TextInput
            label="Topluluk Adı"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            error={nameError}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
          />
          {nameError && (
            <HelperText type="error" visible={nameError}>
              Topluluk adı en az 3 karakter olmalıdır
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
          
          <TextInput
            label="Konum (isteğe bağlı)"
            value={location}
            onChangeText={setLocation}
            mode="outlined"
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            left={<TextInput.Icon icon={({ size, color }) => <MapPin size={size} color={color} />} />}
          />
          
          <Text style={styles.sectionTitle}>Etiketler (isteğe bağlı)</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              label="Etiket ekle"
              value={currentTag}
              onChangeText={setCurrentTag}
              mode="outlined"
              style={styles.tagInput}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              onSubmitEditing={addTag}
            />
            <Button
              mode="contained"
              style={styles.addTagButton}
              onPress={addTag}
              disabled={currentTag.trim() === ''}
            >
              Ekle
            </Button>
          </View>
          
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map(tag => (
                <Chip
                  key={tag}
                  style={styles.tagChip}
                  onClose={() => removeTag(tag)}
                  onPress={() => removeTag(tag)}
                >
                  #{tag}
                </Chip>
              ))}
            </View>
          )}
          
          <View style={styles.privacyContainer}>
            <View style={styles.privacyInfo}>
              {isPublic ? (
                <Globe size={24} color={colors.primary} />
              ) : (
                <Lock size={24} color={colors.warning} />
              )}
              <View style={styles.privacyTextContainer}>
                <Text style={styles.privacyTitle}>
                  {isPublic ? 'Herkese Açık' : 'Özel Topluluk'}
                </Text>
                <Text style={styles.privacyDescription}>
                  {isPublic 
                    ? 'Herkes topluluğa katılabilir ve içeriği görebilir' 
                    : 'Katılmak için istek göndermek gerekir, sadece üyeler içeriği görebilir'}
                </Text>
              </View>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              color={colors.primary}
            />
          </View>
          
          <Divider style={styles.divider} />
          
          <Button
            mode="contained"
            style={styles.submitButton}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!isFormValid || isSubmitting}
          >
            Topluluğu Oluştur
          </Button>
          
          <Button
            mode="outlined"
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
          >
            İptal Et
          </Button>
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
    paddingVertical: spacing.md,
    paddingBottom: 100,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  imageUpload: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageUploadText: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  textArea: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    minHeight: 100,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  privacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  privacyTitle: {
    ...typography.subtitle1,
    fontWeight: '600',
    color: colors.text,
  },
  privacyDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  divider: {
    marginVertical: spacing.md,
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
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tagInput: {
    flex: 1,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  addTagButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  tagChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.primaryLight + '15',
  },
}); 