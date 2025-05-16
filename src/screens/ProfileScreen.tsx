import React, { useContext, useState, useEffect } from 'react';
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

  const tabs = ['Bilgilerim', 'Rozetlerim', 'Etkinliklerim'];

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
      const taskService = TaskService.getInstance();
      const allTasks = await taskService.getTasks();
      
      // Count only tasks that are COMPLETED and completed by this user
      const completedTasks = allTasks.filter(task => 
        task.status === 'COMPLETED' && 
        task.completedBy?.id === user.uid
      );
      
      setActualCompletedTaskCount(completedTasks.length);
      
      // Calculate total XP from completed tasks - this should match CompletedTasksScreen
      const totalXP = completedTasks.reduce((sum, task) => sum + (task.xpReward || 0), 0);
      console.log("ProfileScreen - Calculated XP from completed tasks:", totalXP);
      
      // Update the XP value to match the one calculated from completed tasks
      setActualXP(totalXP);
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
          
          // XP verilerini al
          const xpService = XPService.getInstance();
          const userXpData = await xpService.getUserXP(user.uid);
          setXpData(userXpData);
          
          // XP değerini ayarla - loadTaskStats fonksiyonu doğru XP değerini ayarlayacak
          // Burada userData.xp değerini kullanmıyoruz çünkü bu değer tamamlanan görevlerden 
          // hesaplanan değerle eşleşmiyor olabilir
          
          // Profil resmini ayarla
          if (userData.photoURL) {
            setProfileImage(userData.photoURL);
          }
          
          // Rozet verilerini ayarla
          if (userData.badges && Array.isArray(userData.badges)) {
            setBadges(userData.badges);
          }
          
          // Görev istatistiklerini al - artık XPService'te kategori toplamını kullanıyoruz
          const taskProgress = await xpService.getTaskProgress(user.uid);
          
          // XPService'ten gelen değeri doğrudan kullan, tekrar hesaplama yapma
          console.log(`ProfileScreen - Setting task count to: ${taskProgress.completedTasks}`);
          setActualCompletedTaskCount(taskProgress.completedTasks);
          
          // TaskStats'ı ayarla
          setTaskStats(taskProgress);
          
          // Rozetleri kontrol et ve gerekirse yeni rozetler ver
          const badgeService = BadgeService.getInstance();
          await badgeService.checkAllCategoryBadges(user.uid);
          
          // Doğru XP değerini hesapla ve ayarla
          await loadTaskStats();
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
    if (!user?.uid) return;
    
    try {
      const badgeService = BadgeService.getInstance();
      const newBadge = await badgeService.awardTestBadge(user.uid);
      Alert.alert('Başarılı', 'Yeni rozet kazandınız!');
    } catch (error) {
      console.error('Error awarding test badge:', error);
      Alert.alert('Hata', 'Rozet verilirken bir hata oluştu');
    }
  };

  // XP Level calculations
  const calculateLevel = (xp: number) => {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  };

  const calculateXPForNextLevel = (level: number) => {
    return (level * level) * 100;
  };

  const calculateProgress = (xp: number, level: number) => {
    const nextLevelXP = calculateXPForNextLevel(level);
    const currentLevelXP = calculateXPForNextLevel(level - 1);
    return (xp - currentLevelXP) / (nextLevelXP - currentLevelXP);
  };

  const handleTestBadgeLevelUp = async () => {
    try {
      const badgeService = BadgeService.getInstance();
      
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

  const renderProfileInfo = () => {
    // Görev sayısını doğrudan actualCompletedTaskCount'tan al
    // Tekrar hesaplama yapma, bu sayı zaten XPService'ten doğru şekilde alındı
    const completedTasksCount = actualCompletedTaskCount;
    
    // Debug için görev sayısını yazdır
    console.log(`ProfileScreen - Rendering with task count: ${completedTasksCount}`);
    
    // actualXP değerini kullan - bu değer loadTaskStats() tarafından tamamlanan görevlerden hesaplanmış olmalı
    const currentXP = actualXP;
    console.log(`ProfileScreen - Rendering with XP: ${currentXP}`);
    
    const currentLevel = calculateLevel(currentXP);
    const progress = calculateProgress(currentXP, currentLevel);
    const nextLevelXP = calculateXPForNextLevel(currentLevel);
    const currentLevelXP = calculateXPForNextLevel(currentLevel - 1);

    return (
      <View>
        <Surface style={styles.profileCard} elevation={0}>
          <Avatar.Image
            size={80}
            source={{ uri: profileImage || 'https://via.placeholder.com/80' }}
            style={styles.avatar}
          />
          <Text variant="titleLarge" style={styles.name}>
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
            <Edit2 size={16} color={colors.primary} style={styles.bioEditIcon} />
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
          <View style={styles.statItem}>
            <Text variant="titleLarge" style={styles.statValue}>
              {completedTasksCount}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Görev
            </Text>
          </View>
          <View style={styles.statItem}>
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
          </View>
          <View style={styles.statItem}>
            <Text variant="titleLarge" style={styles.statValue}>
              {badges.length}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Rozet
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPersonalInfo = () => (
    <Surface style={styles.infoCard} elevation={0}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Kişisel Bilgiler
      </Text>
      
      <View style={styles.infoItem}>
        <View style={styles.infoIcon}>
          <User size={24} color={colors.text} />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Ad Soyad</Text>
          <Text style={styles.infoValue}>{userData?.firstName} {userData?.lastName}</Text>
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditField('name')}
        >
          <Edit2 size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoItem}>
        <View style={styles.infoIcon}>
          <User size={24} color={colors.text} />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Kullanıcı Adı</Text>
          <Text style={styles.infoValue}>@{userData?.username}</Text>
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditField('username')}
        >
          <Edit2 size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoItem}>
        <View style={styles.infoIcon}>
          <Phone size={24} color={colors.text} />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Telefon</Text>
          <Text style={styles.infoValue}>{userData?.phoneNumber || 'Belirtilmemiş'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditField('phone')}
        >
          <Edit2 size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoItem}>
        <View style={styles.infoIcon}>
          <Calendar size={24} color={colors.text} />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Doğum Tarihi</Text>
          <Text style={styles.infoValue}>{userData?.dateOfBirth || 'Belirtilmemiş'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditField('dateOfBirth')}
        >
          <Edit2 size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoItem}>
        <View style={styles.infoIcon}>
          <MapPin size={24} color={colors.text} />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Şehir</Text>
          <Text style={styles.infoValue}>{userData?.city || 'Belirtilmemiş'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditField('city')}
        >
          <Edit2 size={20} color={colors.primary} />
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
        <Surface style={styles.modalContent}>
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
            >
              İptal
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSaveField}
              loading={loading}
              style={styles.modalButton}
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

      <ScrollView style={styles.content}>
        {activeTab === 'Bilgilerim' && (
          <>
            {renderProfileInfo()}
            {renderPersonalInfo()}
            <Surface style={styles.settingsCard} elevation={0}>
              <Text variant="titleMedium" style={styles.settingsTitle}>
                Hesap Ayarları
              </Text>
              
              <View style={styles.settingsContainer}>
                <TouchableOpacity style={styles.settingItem} onPress={handlePasswordChange}>
                  <Lock size={24} color={colors.primary} />
                  <Text style={styles.settingText}>Şifre Değiştir</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.settingItem} onPress={handleNotificationSettings}>
                  <Bell size={24} color={colors.primary} />
                  <Text style={styles.settingText}>Bildirim Ayarları</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.settingItem} onPress={handleThemeSettings}>
                  <Paintbrush size={24} color={colors.primary} />
                  <Text style={styles.settingText}>Tema Ayarları</Text>
                </TouchableOpacity>
                
                {userData?.role === 'admin' && (
                  <TouchableOpacity style={styles.settingItem} onPress={handleVerificationsList}>
                    <FileText size={24} color={colors.primary} />
                    <Text style={styles.settingText}>Görev Onayları</Text>
                  </TouchableOpacity>
                )}
                
                {userData?.role !== 'admin' && (
                  <TouchableOpacity style={styles.settingItem} onPress={handleMakeAdmin}>
                    <FileText size={24} color={colors.primary} />
                    <Text style={styles.settingText}>Admin Ol</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
                  <LogOut size={24} color={colors.error} />
                  <Text style={[styles.settingText, { color: colors.error }]}>Çıkış Yap</Text>
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

        {activeTab === 'Etkinliklerim' && (
          <View style={styles.activityContainer}>
            <Surface style={styles.activityCard} elevation={0}>
              <Text variant="titleMedium" style={styles.activityTitle}>
                Son Etkinlikler
              </Text>
              
              <View style={styles.emptyActivityContainer}>
                <Text style={styles.emptyActivityText}>
                  Yakında burada etkinlik geçmişinizi görebileceksiniz.
                </Text>
              </View>
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
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
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
  },
  profileCard: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  avatar: {
    marginBottom: 12,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    color: '#666',
    marginBottom: 4,
  },
  email: {
    color: '#999',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    color: '#666',
  },
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoIcon: {
    width: 40,
    alignItems: 'center',
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
  editButton: {
    padding: 8,
  },
  settingsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  settingsTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingsContainer: {
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingText: {
    marginLeft: 12,
    color: '#333',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.text,
  },
  bioContainer: {
    width: '100%',
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
  },
  bioLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  bioText: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  bioEditIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  usernameInput: {
    textTransform: 'lowercase',
  },
  levelContainer: {
    width: '100%',
    marginTop: 16,
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
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  xpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  badgesContainer: {
    paddingBottom: 16,
  },
  badgesCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  badgesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgesHeaderIcon: {
    marginRight: 8,
  },
  badgesTitle: {
    fontWeight: 'bold',
  },
  badgesSubtitle: {
    color: '#666',
    marginBottom: 16,
    fontSize: 14,
  },
  badgeTipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  badgeTipIconContainer: {
    marginRight: 8,
  },
  badgeTip: {
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: '#0066CC',
  },
  activityContainer: {
    paddingBottom: 16,
  },
  activityCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  activityTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyActivityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyActivityText: {
    textAlign: 'center',
    color: '#999',
  },
  levelUpModalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  levelUpTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  levelUpText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  boldText: {
    fontWeight: 'bold',
  },
  levelUpBadgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  levelUpIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  levelUpIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  levelUpIndicatorText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  levelUpMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  levelUpRewardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 24,
  },
  levelUpButton: {
    paddingHorizontal: 32,
  },
  testButtonContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  testButton: {
    borderColor: colors.primary,
  },
  refreshButton: {
    marginTop: 4,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;