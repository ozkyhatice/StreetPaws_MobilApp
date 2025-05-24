import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Building2, Globe, Info, BriefcaseMedical, ShieldCheck } from 'lucide-react-native';

import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  AlertButton,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { AuthContext } from '../contexts/AuthContext';
import { AuthContextType } from '../types/auth';
import { Text, Avatar, Surface, useTheme, Button, ProgressBar } from 'react-native-paper';
import { colors } from '../config/theme';
import { Lock, Bell, Paintbrush, LogOut, Phone, User, Edit2, Calendar, MapPin, FileText, Award, Star } from 'lucide-react-native';
import { doc, getDoc, updateDoc, onSnapshot, query, collection, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BadgeService } from '../services/badgeService';
import { UserService } from '../services/userService';
import { TaskService } from '../services/taskService';
import { BadgeCollection } from '../components/BadgeCollection';
import { XPService } from '../services/xpService';
import { calculateLevelFromXP, calculateXpForLevel, calculateXpForNextLevel, calculateProgressValue } from '../utils/levelUtils';

const { width } = Dimensions.get('window');

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// TaskStats tipini tanımlayalım
interface TaskStats {
  completedTasks: number;
  awaitingApprovalTasks: number;
  totalStreakDays: number;
  currentTasksCount: {
    [key: string]: number;
  };
}

const ProfileScreen = () => {
  const { user, signOut } = useContext(AuthContext) as AuthContextType;
  const [activeTab, setActiveTab] = useState('Bilgilerim');
  const theme = useTheme();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<'name' | 'phone' | 'dateOfBirth' | 'city' | 'bio' | 'username' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [badges, setBadges] = useState([]);
  const [actualCompletedTaskCount, setActualCompletedTaskCount] = useState(0);
  const [actualXP, setActualXP] = useState(0);
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpBadge, setLevelUpBadge] = useState<any>(null);
  const [xpData, setXpData] = useState(null);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [profileImage, setProfileImage] = useState(null);

  // Initialize services
  const xpService = XPService.getInstance();
  const taskService = TaskService.getInstance();
  const badgeService = BadgeService.getInstance();

  const tabs = ['Bilgilerim', 'Rozetlerim'];

  const formatDateWithSlashes = (text: string) => {
    // Sadece sayıları al
    const numbers = text.replace(/\D/g, '');
    
    // Maksimum 8 karakter (GGAAYYYY)
    const trimmed = numbers.substring(0, 8);
    
    // Format olarak slashları ekle
    if (trimmed.length <= 2) {
      return trimmed;
    } else if (trimmed.length <= 4) {
      return `${trimmed.substring(0, 2)}/${trimmed.substring(2)}`;
    } else {
      return `${trimmed.substring(0, 2)}/${trimmed.substring(2, 4)}/${trimmed.substring(4)}`;
    }
  };

  const handleEditValueChange = (text: string) => {
    if (editingField === 'dateOfBirth') {
      setEditValue(formatDateWithSlashes(text));
    } else {
      setEditValue(text);
    }
  };

  const loadTaskStats = async () => {
    if (!user?.uid) return;
    
    try {
      // Get accurate XP data from the central XP service
      try {
        const centralizedXP = await xpService.getCentralizedXP(user.uid);
      
        // Use the XP value calculated by the XP service
        setActualXP(centralizedXP.xp);
        
        // Get accurate completed tasks count
        const taskProgress = await xpService.getTaskProgress(user.uid);
        setActualCompletedTaskCount(taskProgress.completedTasks);
        
        console.log(`ProfileScreen - Updated stats: Tasks=${taskProgress.completedTasks}, XP=${centralizedXP.xp}`);
      } catch (error) {
        console.error('Error getting XP and task data:', error);
        // Keep existing values in case of error
      }
    } catch (error) {
      console.error('Error loading task stats:', error);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        if (user) {
          console.log("ProfileScreen - Loading user data for", user.uid);
          
          // Kullanıcı belgesini al
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            console.log("ProfileScreen - User document not found");
            setLoading(false);
            return;
          }
          
          const userData = userDoc.data();
          setUserData(userData);
          
          // Get centralized XP data - this calculates XP properly based on task difficulty
          try {
            const centralizedXP = await xpService.getCentralizedXP(user.uid);
            setActualXP(centralizedXP.xp);
            console.log(`ProfileScreen - XP loaded: ${centralizedXP.xp}`);
          } catch (xpError) {
            console.error('Error getting centralized XP:', xpError);
            // Use fallback from user data if available
            setActualXP(userData.xp || 0);
          }
          
          // Profil resmini ayarla
          if (userData.photoURL) {
            setProfileImage(userData.photoURL);
          }
          
          // Rozet verilerini ayarla
          if (userData.badges && Array.isArray(userData.badges)) {
            setBadges(userData.badges);
          }
          
          // Görev istatistiklerini al
          try {
          const taskProgress = await xpService.getTaskProgress(user.uid);
          
            // Tamamlanan görev sayısını ayarla
          setActualCompletedTaskCount(taskProgress.completedTasks);
          
          // TaskStats'ı ayarla
          setTaskStats(taskProgress);
            
            console.log(`ProfileScreen - Tasks completed: ${taskProgress.completedTasks}`);
          } catch (error) {
            console.error('Error getting task progress:', error);
            // Set fallback values
            setActualCompletedTaskCount(userData.stats?.tasksCompleted || 0);
          }
          
          // Rozetleri kontrol et ve gerekirse yeni rozetler ver
          await badgeService.checkAllCategoryBadges(user.uid);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user]);

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (username === userData?.username) return true; // If username hasn't changed
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  };

  const handleEditField = (field: 'name' | 'phone' | 'dateOfBirth' | 'city' | 'bio' | 'username') => {
    setEditingField(field);
    setEditValue(
      field === 'name' ? userData?.firstName + ' ' + userData?.lastName || '' :
      field === 'phone' ? userData?.phoneNumber || '' :
      field === 'dateOfBirth' ? userData?.dateOfBirth || '' :
      field === 'city' ? userData?.city || '' :
      field === 'username' ? userData?.username || '' :
      userData?.bio || ''
    );
    setIsEditModalVisible(true);
  };

  const handleSaveField = async () => {
    if (!user?.uid || !editingField) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }
    
    setLoading(true);
    try {
      const userService = UserService.getInstance();

      if (editingField === 'username') {
        // Username boş olamaz ve en az 3 karakter olmalı
        if (!editValue || editValue.length < 3) {
          Alert.alert('Hata', 'Kullanıcı adı en az 3 karakter olmalıdır.');
          return;
        }

        // Sadece harf, rakam ve alt çizgi içerebilir
        if (!/^[a-zA-Z0-9_]+$/.test(editValue)) {
          Alert.alert('Hata', 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.');
          return;
        }

        // Kullanıcı adının benzersiz olduğunu kontrol et
        const isAvailable = await checkUsernameAvailability(editValue);
        if (!isAvailable) {
          Alert.alert('Hata', 'Bu kullanıcı adı başka bir kullanıcı tarafından kullanılıyor.');
          return;
        }
      }
      
      // Ad Soyad için özel kontrol
      if (editingField === 'name' && !editValue.includes(' ')) {
        Alert.alert('Hata', 'Lütfen hem adınızı hem soyadınızı girin');
        return;
      }
      
      // Telefon numarası için özel kontrol
      if (editingField === 'phone' && !/^\+?[0-9]{10,}$/.test(editValue)) {
        Alert.alert('Hata', 'Geçerli bir telefon numarası girin');
        return;
      }
      
      // Doğum tarihi için özel kontrol
      if (editingField === 'dateOfBirth' && !/^\d{2}\/\d{2}\/\d{4}$/.test(editValue)) {
        Alert.alert('Hata', 'Doğum tarihini GG/AA/YYYY formatında girin');
        return;
      }
      
      const updateData = editingField === 'name' 
        ? { firstName: editValue.split(' ')[0], lastName: editValue.split(' ')[1] }
        : editingField === 'phone' 
        ? { phoneNumber: editValue }
        : editingField === 'dateOfBirth' 
        ? { dateOfBirth: editValue }
        : editingField === 'city' 
        ? { city: editValue }
        : editingField === 'username'
        ? { username: editValue }
        : { bio: editValue };
      
      console.log('Güncellenecek veriler:', updateData);
      
      await userService.updateUser(user.uid, updateData);
      
      // Yerel state'i güncelle
      setUserData(prevData => {
        if (editingField === 'name') {
          return {
            ...prevData,
            firstName: editValue.split(' ')[0],
            lastName: editValue.split(' ')[1]
          };
        } else {
          return {
            ...prevData,
            [editingField === 'phone' ? 'phoneNumber' : editingField]: editValue
          };
        }
      });
      
      setIsEditModalVisible(false);
      Alert.alert('Başarılı', 'Bilgileriniz güncellendi');
    } catch (error) {
      console.error('Error updating user info:', error);
      Alert.alert('Hata', 'Bilgileriniz güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestBadge = async () => {
    try {
      await badgeService.awardTestBadge(user.uid);
      Alert.alert('Başarılı', 'Test rozeti eklendi!');
    } catch (error) {
      console.error('Error testing badge:', error);
      Alert.alert('Hata', 'Rozet test edilirken bir hata oluştu');
    }
  };

  const handleTestBadgeLevelUp = async () => {
    try {
      // First, check if user has any badges
      if (badges.length === 0) {
        // Award a test badge first
        await badgeService.awardTestBadge(user.uid);
        Alert.alert('Başarılı', 'Test rozeti eklendi. Şimdi rozet seviyesini artırabilirsiniz.');
        return;
      }
      
      // Advance the first badge by 10 tasks (enough to level up)
      const firstBadge = badges[0];
      const result = await badgeService.testAdvanceBadge(user.uid, firstBadge.id, 10);
      
      if (result.badgeUpdated) {
        if (result.leveledUp) {
          Alert.alert('Başarılı', `Rozet seviye ${result.newLevel} oldu! Yeni ilerleme: ${result.currentCount}/${result.maxCount}`);
        } else {
          Alert.alert('Başarılı', `Rozet ilerlemesi: ${result.currentCount}/${result.maxCount}`);
        }
      } else {
        Alert.alert('Hata', 'Rozet güncellenemedi.');
      }
    } catch (error) {
      console.error('Error testing badge:', error);
      Alert.alert('Hata', 'Rozet test edilirken bir hata oluştu');
    }
  };

  const handleTestXPTasksSync = async () => {
    if (!user?.uid) {
      Alert.alert('Hata', 'Kullanıcı kimliği bulunamadı');
      return;
    }
    
    try {
      // XP ve Görev verilerini al
      const xpData = await xpService.getCentralizedXP(user.uid);
      const taskProgress = await xpService.getTaskProgress(user.uid);
      
      // XP ve görev sayısı aynı olmalı
      const isSync = xpData.xp === taskProgress.completedTasks;
      
      Alert.alert(
        isSync ? 'Senkronize' : 'Senkronize Değil',
        `XP: ${xpData.xp}\nTamamlanan Görevler: ${taskProgress.completedTasks}\n\n${isSync ? 'XP ve görev sayısı eşleşiyor.' : 'XP ve görev sayısı eşleşmiyor!'}`
      );
    } catch (error) {
      console.error('Error testing XP-Tasks sync:', error);
      Alert.alert('Test Hatası', 'XP ve görev senkronizasyonu test edilirken bir hata oluştu');
    }
  };

  const renderProfileInfo = () => {
    // Get XP and completed tasks from the centralized service
    const completedTasksCount = actualCompletedTaskCount;
    const currentXP = actualXP;
    
    console.log(`ProfileScreen - Rendering profile with Tasks=${completedTasksCount}, XP=${currentXP}`);
    
    const currentLevel = calculateLevelFromXP(currentXP);
    const progress = calculateProgressValue(currentXP, currentLevel);
    const nextLevelXP = calculateXpForNextLevel(currentLevel);
    const currentLevelXP = calculateXpForLevel(currentLevel);

    return (
      <View>
        <Surface style={styles.profileCard} elevation={2}>
          <Avatar.Image
            size={100}
            source={{ uri: profileImage || 'https://via.placeholder.com/80' }}
            style={styles.avatar}
          />
          <Text variant="headlineSmall" style={styles.name}>
            {userData?.firstName} {userData?.lastName}
          </Text>
          <Text variant="bodyMedium" style={styles.username}>
            @{userData?.username}
          </Text>
          <Text variant="bodyMedium" style={styles.email}>
            {userData?.email}
          </Text>
          <TouchableOpacity 
            style={styles.bioContainer}
            onPress={() => handleEditField('bio')}
          >
            <Text style={styles.bioLabel}>Hakkında</Text>
            <Text style={styles.bioText}>{userData?.bio || 'Kendinizden bahsedin...'}</Text>
            <Edit2 size={18} color={colors.primary} style={styles.bioEditIcon} />
          </TouchableOpacity>

          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>Seviye {currentLevel}</Text>
            <View style={styles.xpBarContainer}>
              <ProgressBar
                progress={progress}
                color={colors.primary}
                style={styles.xpBar}
              />
              <Text style={styles.xpText}>
                {currentXP - currentLevelXP} / {nextLevelXP - currentLevelXP} XP
              </Text>
            </View>
          </View>
        </Surface>

        <View style={styles.statsRow}>
          <Surface style={styles.statItem} elevation={1}>
            <Text variant="titleLarge" style={styles.statValue}>
              {completedTasksCount}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Görev
            </Text>
          </Surface>
          <Surface style={styles.statItem} elevation={1}>
            <Text variant="titleLarge" style={styles.statValue}>
              {currentXP}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              XP
            </Text>
            <TouchableOpacity 
              onPress={() => loadTaskStats()}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshButtonText}>Yenile</Text>
            </TouchableOpacity>
          </Surface>
          <Surface style={styles.statItem} elevation={1}>
            <Text variant="titleLarge" style={styles.statValue}>
              {badges.length}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Rozet
            </Text>
          </Surface>
        </View>
      </View>
    );
  };

  const renderPersonalInfo = () => (
    <Surface style={styles.infoCard} elevation={2}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Kişisel Bilgiler
      </Text>
      
      <View style={styles.infoItemsContainer}>
        <TouchableOpacity 
          style={styles.infoItem}
          onPress={() => handleEditField('name')}
        >
          <View style={styles.infoIcon}>
            <User size={22} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Ad Soyad</Text>
            <Text style={styles.infoValue}>{userData?.firstName} {userData?.lastName}</Text>
          </View>
          <Edit2 size={18} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.infoItem}
          onPress={() => handleEditField('username')}
        >
          <View style={styles.infoIcon}>
            <User size={22} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Kullanıcı Adı</Text>
            <Text style={styles.infoValue}>@{userData?.username}</Text>
          </View>
          <Edit2 size={18} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.infoItem}
          onPress={() => handleEditField('phone')}
        >
          <View style={styles.infoIcon}>
            <Phone size={22} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Telefon</Text>
            <Text style={styles.infoValue}>{userData?.phoneNumber || 'Belirtilmemiş'}</Text>
          </View>
          <Edit2 size={18} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.infoItem}
          onPress={() => handleEditField('dateOfBirth')}
        >
          <View style={styles.infoIcon}>
            <Calendar size={22} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Doğum Tarihi</Text>
            <Text style={styles.infoValue}>{userData?.dateOfBirth || 'Belirtilmemiş'}</Text>
          </View>
          <Edit2 size={18} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.infoItem, styles.lastInfoItem]}
          onPress={() => handleEditField('city')}
        >
          <View style={styles.infoIcon}>
            <MapPin size={22} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Şehir</Text>
            <Text style={styles.infoValue}>{userData?.city || 'Belirtilmemiş'}</Text>
          </View>
          <Edit2 size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </Surface>
  );

  const renderEditModal = () => (
    <Modal
      visible={isEditModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsEditModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <Surface style={styles.modalContent} elevation={5}>
          <Text variant="titleMedium" style={styles.modalTitle}>
            {editingField === 'name' ? 'Ad Soyad Düzenle' : 
             editingField === 'phone' ? 'Telefon Düzenle' : 
             editingField === 'dateOfBirth' ? 'Doğum Tarihi Düzenle' : 
             editingField === 'city' ? 'Şehir Düzenle' : 
             editingField === 'username' ? 'Kullanıcı Adı Düzenle' :
             editingField === 'bio' ? 'Hakkında Düzenle' : 'Belirtilmemiş'}
          </Text>
          
          {editingField === 'username' && (
            <Text style={styles.modalSubtitle}>
              Kullanıcı adı benzersiz olmalı ve sadece harf, rakam ve alt çizgi içerebilir.
            </Text>
          )}

          {editingField === 'dateOfBirth' && (
            <Text style={styles.modalSubtitle}>
              Doğum tarihinizi GG/AA/YYYY formatında giriniz.
            </Text>
          )}

          <TextInput
            style={[
              styles.input,
              editingField === 'username' && styles.usernameInput
            ]}
            value={editValue}
            onChangeText={handleEditValueChange}
            placeholder={
              editingField === 'name' ? 'Ad Soyad' : 
              editingField === 'phone' ? 'Telefon Numarası' : 
              editingField === 'dateOfBirth' ? 'GG/AA/YYYY' : 
              editingField === 'city' ? 'Şehir' : 
              editingField === 'username' ? 'Kullanıcı Adı' :
              editingField === 'bio' ? 'Hakkında' : 'Belirtilmemiş'
            }
            keyboardType={
              editingField === 'phone' ? 'phone-pad' : 
              editingField === 'dateOfBirth' ? 'number-pad' : 
              'default'
            }
            autoCapitalize={editingField === 'username' ? 'none' : 'sentences'}
          />

          <View style={styles.modalButtons}>
            <Button 
              mode="outlined" 
              onPress={() => setIsEditModalVisible(false)}
              style={styles.modalButton}
              labelStyle={styles.buttonLabel}
            >
              İptal
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSaveField}
              loading={loading}
              style={styles.modalButton}
              labelStyle={styles.buttonLabel}
            >
              Kaydet
            </Button>
          </View>
        </Surface>
      </View>
    </Modal>
  );

  const handlePasswordChange = () => {
    navigation.navigate('ChangePassword');
  };

  const handleNotificationSettings = () => {
    navigation.navigate('NotificationSettings');
  };

  const handleThemeSettings = () => {
    navigation.navigate('ThemeSettings');
  };

  const handleVerificationsList = () => {
    navigation.navigate('Verifications');
  };

  const handleSignOut = () => {
    signOut()
      .then(() => {
        // Başarılı çıkış
      })
      .catch((error) => {
        console.error('Error signing out:', error);
        Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
      });
  };

  const handleMakeAdmin = async () => {
    try {
      const userService = UserService.getInstance();
      await userService.makeCurrentUserAdmin();
      
      // Kullanıcı verilerini güncelle
      setUserData({
        ...userData,
        role: 'admin'
      });
      
      Alert.alert('Başarılı', 'Admin rolü atandı! Şimdi görev onaylama ekranına erişebilirsiniz.');
    } catch (error) {
      console.error('Error making admin:', error);
      Alert.alert('Hata', 'Admin rolü atanırken bir hata oluştu');
    }
  };

  // Add the LevelUp modal render function
  const renderLevelUpModal = () => (
    <Modal
      visible={showLevelUpModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLevelUpModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Surface style={styles.levelUpModalContent}>
          <Text variant="titleLarge" style={styles.levelUpTitle}>
            Tebrikler! 🎉
          </Text>
          
          {levelUpBadge && (
            <>
              <Text style={styles.levelUpText}>
                <Text style={styles.boldText}>{levelUpBadge.name}</Text> rozetin seviye atladı!
              </Text>
              
              <View style={styles.levelUpBadgeContainer}>
                <View style={[
                  styles.levelUpIconContainer, 
                  { backgroundColor: getBadgeColor(levelUpBadge.level) + '30' }
                ]}>
                  <Award size={48} color={getBadgeColor(levelUpBadge.level)} />
                  <View style={styles.levelUpIndicator}>
                    <Text style={styles.levelUpIndicatorText}>{levelUpBadge.level}</Text>
                  </View>
                </View>
                <Text style={styles.levelUpMessage}>
                  Seviye {levelUpBadge.level}
                </Text>
              </View>
              
              <Text style={styles.levelUpRewardText}>
                +{levelUpBadge.xpReward * levelUpBadge.level} XP Kazanıldı!
              </Text>
            </>
          )}
          
          <Button 
            mode="contained" 
            onPress={() => setShowLevelUpModal(false)}
            style={styles.levelUpButton}
          >
            Harika!
          </Button>
        </Surface>
      </View>
    </Modal>
  );
  const renderUserTypeInfo = () => {
    if (!userData?.userType) return null;
  
    const editableFields = {
      veteriner: [
        { label: 'Klinik Adı', key: 'clinicName', icon: Building2 },
        { label: 'Telefon', key: 'phoneNumber', icon: Phone },
        { label: 'Adres', key: 'address', icon: MapPin },
        { label: 'Sicil Numarası', key: 'licenseNumber', icon: ShieldCheck },
      ],
      business: [
        { label: 'İşletme Adı', key: 'businessName', icon: Building2 },
        { label: 'Telefon', key: 'phoneNumber', icon: Phone },
        { label: 'Adres', key: 'address', icon: MapPin },
        { label: 'Vergi Numarası', key: 'taxNumber', icon: FileText },
        { label: 'Sicil Numarası', key: 'registrationNumber', icon: ShieldCheck },
        { label: 'Web Sitesi', key: 'website', icon: Globe },
        { label: 'Açıklama', key: 'description', icon: Info },
      ],
      healthcare: [
        { label: 'Kurum Adı', key: 'businessName', icon: Building2 },
        { label: 'Telefon', key: 'phoneNumber', icon: Phone },
        { label: 'Adres', key: 'address', icon: MapPin },
        { label: 'Vergi Numarası', key: 'taxNumber', icon: FileText },
        { label: 'Sicil Numarası', key: 'registrationNumber', icon: ShieldCheck },
        { label: 'Web Sitesi', key: 'website', icon: Globe },
        { label: 'Açıklama', key: 'description', icon: Info },
      ],
    };
  
    const handleEditUserTypeField = (key) => {
      setEditingField(key);
      setEditValue(userData?.[key] || '');
      setIsEditModalVisible(true);
    };
  
    const currentFields = editableFields[userData.userType] || [];
  
    return (
      <Surface style={styles.infoCard} elevation={2}>
        <Text style={styles.sectionTitle}>
          {userData.userType === 'business' ? 'İşletme Bilgileri' :
           userData.userType === 'healthcare' ? 'Sağlık Kurumu Bilgileri' :
           'Veteriner Bilgileri'}
        </Text>
        <View style={styles.infoItemsContainer}>
          {currentFields.map(({ label, key, icon: IconComponent }, index) => (
            <TouchableOpacity 
              key={key} 
              onPress={() => handleEditUserTypeField(key)}
              style={[
                styles.infoItem, 
                index === currentFields.length - 1 && styles.lastInfoItem
              ]}
            >
              <View style={styles.infoIcon}>
                <IconComponent size={22} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{userData?.[key] || 'Belirtilmemiş'}</Text>
              </View>
              <Edit2 size={18} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      </Surface>
    );
  };

  // Add a helper function to get badge color based on level
  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'BRONZE': return '#CD7F32';
      case 'SILVER': return '#C0C0C0';
      case 'GOLD': return '#FFD700';
      case 'PLATINUM': return '#E5E4E2';
      case 'DIAMOND': return '#B9F2FF';
      default: return colors.primary;
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Lütfen giriş yapın</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'Bilgilerim' && (
          <>
            {renderProfileInfo()}
            {renderPersonalInfo()}           
            {renderUserTypeInfo()}
            <Surface style={styles.infoCard} elevation={2}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Hesap Ayarları
              </Text>
              
              <View style={styles.infoItemsContainer}>
                <TouchableOpacity style={styles.infoItem} onPress={handlePasswordChange}>
                  <View style={styles.infoIcon}>
                    <Lock size={22} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.settingText}>Şifre Değiştir</Text>
                  </View>
                  <View style={styles.arrowIcon} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.infoItem} onPress={handleNotificationSettings}>
                  <View style={styles.infoIcon}>
                    <Bell size={22} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.settingText}>Bildirim Ayarları</Text>
                  </View>
                  <View style={styles.arrowIcon} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.infoItem} onPress={handleThemeSettings}>
                  <View style={styles.infoIcon}>
                    <Paintbrush size={22} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.settingText}>Tema Ayarları</Text>
                  </View>
                  <View style={styles.arrowIcon} />
                </TouchableOpacity>
                
                {userData?.role === 'admin' && (
                  <TouchableOpacity style={styles.infoItem} onPress={handleVerificationsList}>
                    <View style={styles.infoIcon}>
                      <FileText size={22} color={colors.primary} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.settingText}>Görev Onayları</Text>
                    </View>
                    <View style={styles.arrowIcon} />
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity style={[styles.infoItem, styles.lastInfoItem, styles.logoutItem]} onPress={handleSignOut}>
                  <View style={styles.infoIcon}>
                    <LogOut size={22} color={colors.error} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.settingText, { color: colors.error }]}>Çıkış Yap</Text>
                  </View>
                  <View style={styles.arrowIcon} />
                </TouchableOpacity>
              </View>
            </Surface>
          </>
        )}

        {activeTab === 'Rozetlerim' && (
          <View style={styles.badgesContainer}>
            <Surface style={styles.badgesCard} elevation={0}>
              <View style={styles.badgesHeader}>
                <Award size={24} color={colors.primary} style={styles.badgesHeaderIcon} />
                <Text variant="titleLarge" style={styles.badgesTitle}>
                  Kazanılan Rozetler
                </Text>
              </View>
              
              <Text style={styles.badgesSubtitle}>
                Görevleri tamamlayarak rozetleri kazanabilir ve seviyelerini yükseltebilirsin.
                Her rozet 10 seviyeye kadar yükseltilebilir.
              </Text>
              
              <BadgeCollection 
                badges={badges} 
                loading={loading}
                onBadgePress={(badge) => {
                  console.log('Badge pressed:', badge.name);
                }}
              />
              
              <View style={styles.badgeTipContainer}>
                <View style={styles.badgeTipIconContainer}>
                  <Star size={20} color={colors.warning} />
                </View>
                <Text style={styles.badgeTip}>
                  Her rozet 10 görevde bir seviye atlar. Seviye atladıkça kazandığın XP miktarı da artar!
                </Text>
              </View>
              
              {/* Test Button for Development */}
              {__DEV__ && (
                <View style={styles.testButtonContainer}>
                  <Button 
                    mode="outlined" 
                    onPress={handleTestBadgeLevelUp}
                    style={styles.testButton}
                  >
                    Test Rozeti Seviye Atlat
                  </Button>
                </View>
              )}
            </Surface>
          </View>
        )}

        
      </ScrollView>

      {renderEditModal()}
      {renderLevelUpModal()}

      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Light gray background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    paddingVertical: 16,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: '#666',
    fontSize: 16,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingTop: 12,
  },
  profileCard: {
    margin: 16,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  avatar: {
    marginBottom: 16,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  username: {
    color: '#666',
    marginBottom: 6,
  },
  email: {
    color: '#999',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    margin: 4,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  statValue: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    color: '#666',
    marginTop: 4,
  },
  infoCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  infoItemsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lastInfoItem: {
    borderBottomWidth: 0,
  },
  infoIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },
  settingText: {
    color: '#333',
    fontSize: 16,
  },
  arrowIcon: {
    width: 20,
    height: 20,
    opacity: 0.3,
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
  },
  buttonLabel: {
    fontWeight: '600',
    fontSize: 16,
    paddingVertical: 2,
  },
  bioContainer: {
    width: '100%',
    marginTop: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
  },
  bioLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  bioText: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  bioEditIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  usernameInput: {
    textTransform: 'lowercase',
  },
  levelContainer: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  xpBarContainer: {
    marginTop: 4,
  },
  xpBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  xpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
  },
  refreshButton: {
    marginTop: 6,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Keep other existing styles
});

export default ProfileScreen;