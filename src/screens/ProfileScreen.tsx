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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { AuthContext } from '../contexts/AuthContext';
import { AuthContextType } from '../types/auth';
import { Text, Avatar, Surface, useTheme, Button, ProgressBar } from 'react-native-paper';
import { colors } from '../config/theme';
import { Lock, Bell, Paintbrush, LogOut, Phone, User, Edit2, Calendar, MapPin, FileText } from 'lucide-react-native';
import { doc, getDoc, updateDoc, onSnapshot, query, collection, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BadgeService } from '../services/badgeService';
import { UserService } from '../services/userService';
import { TaskService } from '../services/taskService';

const { width } = Dimensions.get('window');

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

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
      
      // Calculate total XP from completed tasks
      const totalXP = completedTasks.reduce((sum, task) => sum + (task.xpReward || 0), 0);
      setActualXP(totalXP);
    } catch (error) {
      console.error('Error loading task stats:', error);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    // Kullanıcı verilerini gerçek zamanlı dinle
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (userDoc) => {
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('Kullanıcı verileri alındı:', data);
        setUserData(data);
        setBadges(data?.badges || []);
        loadTaskStats();
      } else {
        // Kullanıcı dokümanı yoksa oluştur
        try {
          console.log('Kullanıcı dokümanı bulunamadı, oluşturuluyor...');
          const userService = UserService.getInstance();
          
          const newUserData = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ')[1] || '',
            username: user.email?.split('@')[0] || 'kullanici',
            photoURL: user.photoURL || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            emailVerified: user.emailVerified || false,
            role: 'user' as 'user' | 'admin' | 'volunteer',
            xp: 0,
            completedTasks: [],
            badges: [],
            volunteerHours: 0,
            savedPets: [],
            favoriteLocations: [],
            stats: {
              tasksCompleted: 0,
              volunteeredHours: 0,
              donationsCount: 0,
              totalDonationAmount: 0,
              xpPoints: 0,
              level: 1,
            },
            preferences: {
              notifications: true,
              emailUpdates: true,
              darkMode: false,
            },
            bio: '',
            city: '',
            dateOfBirth: '',
            phoneNumber: ''
          };
          
          await userService.createUser(newUserData);
          setUserData(newUserData);
          console.log('Yeni kullanıcı profili oluşturuldu');
          loadTaskStats();
        } catch (error) {
          console.error('Error creating user document:', error);
          Alert.alert('Hata', 'Kullanıcı profili oluşturulurken hata oluştu');
        }
      }
    }, (error) => {
      console.error("Error fetching user data:", error);
      Alert.alert('Hata', 'Kullanıcı bilgileri alınamadı');
    });

    return () => unsubscribe();
  }, [user?.uid]);

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

  const renderProfileInfo = () => {
    const currentXP = actualXP || userData?.xp || 0;
    const currentLevel = calculateLevel(currentXP);
    const progress = calculateProgress(currentXP, currentLevel);
    const nextLevelXP = calculateXPForNextLevel(currentLevel);
    const currentLevelXP = calculateXPForNextLevel(currentLevel - 1);
    const completedTasksCount = actualCompletedTaskCount || 0;

    return (
      <View>
        <Surface style={styles.profileCard} elevation={0}>
          <Avatar.Image
            size={80}
            source={{ uri: user?.photoURL || 'https://via.placeholder.com/80' }}
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
      </ScrollView>

      {renderEditModal()}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
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
});

export default ProfileScreen;