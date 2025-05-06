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
import { doc, getDoc, updateDoc, onSnapshot, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BadgeService } from '../services/badgeService';

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
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const tabs = ['Bilgilerim', 'Rozetlerim', 'Etkinliklerim'];

  useEffect(() => {
    if (!user?.uid) return;

    // Kullanıcı verilerini gerçek zamanlı dinle
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
        setBadges(doc.data()?.badges || []);
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
    if (!user?.uid || !editingField) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);

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
      
      await updateDoc(userRef, updateData);
      setIsEditModalVisible(false);
      Alert.alert('Başarılı', 'Bilgileriniz güncellendi');
    } catch (error) {
      console.error('Error updating user info:', error);
      Alert.alert('Hata', 'Bilgileriniz güncellenirken bir hata oluştu');
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
    const currentXP = userData?.xp || 0;
    const currentLevel = calculateLevel(currentXP);
    const progress = calculateProgress(currentXP, currentLevel);
    const nextLevelXP = calculateXPForNextLevel(currentLevel);
    const currentLevelXP = calculateXPForNextLevel(currentLevel - 1);

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
              {userData?.completedTasks?.length || 0}
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

          <TextInput
            style={[
              styles.input,
              editingField === 'username' && styles.usernameInput
            ]}
            value={editValue}
            onChangeText={setEditValue}
            placeholder={
              editingField === 'name' ? 'Ad Soyad' : 
              editingField === 'phone' ? 'Telefon Numarası' : 
              editingField === 'dateOfBirth' ? 'Doğum Tarihi' : 
              editingField === 'city' ? 'Şehir' : 
              editingField === 'username' ? 'Kullanıcı Adı' :
              editingField === 'bio' ? 'Hakkında' : 'Belirtilmemiş'
            }
            keyboardType={editingField === 'phone' ? 'phone-pad' : 'default'}
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
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={handlePasswordChange}
              >
                <Lock size={24} color={colors.text} />
                <Text style={styles.settingText}>Şifre Değiştir</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <Bell size={24} color={colors.text} />
                <Text style={styles.settingText}>Bildirim Tercihleri</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <Paintbrush size={24} color={colors.text} />
                <Text style={styles.settingText}>Tema Ayarları</Text>
              </TouchableOpacity>
            </Surface>

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={signOut}
            >
              <LogOut size={24} color={colors.error} />
              <Text style={[styles.logoutText, { color: colors.error }]}>
                Çıkış Yap
              </Text>
            </TouchableOpacity>
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
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