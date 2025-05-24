import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Building2, Globe, Info, BriefcaseMedical, ShieldCheck, Edit } from 'lucide-react-native';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  StatusBar,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { AuthContext } from '../contexts/AuthContext';
import { AuthContextType } from '../types/auth';
import { Text, Avatar, Surface, useTheme, Button, ProgressBar, Chip, IconButton, Divider } from 'react-native-paper';
import { colors } from '../config/theme';
import { Lock, Bell, Paintbrush, LogOut, Phone, User, Calendar, MapPin, FileText, Award, Star, Settings, ChevronRight } from 'lucide-react-native';
import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { BadgeService } from '../services/badgeService';
import { UserService } from '../services/userService';
import { XPService } from '../services/xpService';
import { calculateLevelFromXP, calculateXpForLevel, calculateXpForNextLevel, calculateProgressValue } from '../utils/levelUtils';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

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
  const theme = useTheme();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<'name' | 'phone' | 'dateOfBirth' | 'city' | 'bio' | 'username' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [badges, setBadges] = useState([]);
  const [recentBadges, setRecentBadges] = useState([]);
  const [actualCompletedTaskCount, setActualCompletedTaskCount] = useState(0);
  const [actualXP, setActualXP] = useState(0);
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpBadge, setLevelUpBadge] = useState<any>(null);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [profileImage, setProfileImage] = useState(null);
  const [scrollY] = useState(new Animated.Value(0));

  // Initialize services
  const xpService = XPService.getInstance();
  const badgeService = BadgeService.getInstance();
  const userService = UserService.getInstance();
  
  // Format helpers
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

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const loadUserData = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      
      // Get user document
      const userData = await userService.getUserById(user.uid);
      if (!userData) {
        console.log("ProfileScreen - User data not found");
        return;
      }
      
      console.log("ProfileScreen - User data loaded:", JSON.stringify(userData));
      console.log("ProfileScreen - User role:", userData.role);
      console.log("ProfileScreen - Business data:", userData.business || userData.Business);
      
      setUserData(userData);
      
      // Get XP data
      try {
        const centralizedXP = await xpService.getCentralizedXP(user.uid);
        setActualXP(centralizedXP.xp);
      } catch (error) {
        console.error('Error getting XP data:', error);
        setActualXP(userData.xp || 0);
      }
      
      // Set profile image
      if (userData.photoURL) {
        setProfileImage(userData.photoURL);
      }
      
      // Get badges
      try {
        const userBadges = await badgeService.getUserBadges(user.uid);
        setBadges(userBadges);
        
        // Get recent badges (last 3)
        const sorted = [...userBadges].sort((a, b) => 
          new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
        );
        setRecentBadges(sorted.slice(0, 3));
      } catch (error) {
        console.error('Error getting badges:', error);
      }
      
      // Get task stats
      try {
        const taskProgress = await xpService.getTaskProgress(user.uid);
        setActualCompletedTaskCount(taskProgress.completedTasks);
        setTaskStats(taskProgress);
      } catch (error) {
        console.error('Error getting task stats:', error);
        setActualCompletedTaskCount(userData.stats?.tasksCompleted || 0);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserData();
    }
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

      // Check if this is a standard field or userType-specific field
      const isUserTypeField = [
        'clinicName', 'businessName', 'address', 'licenseNumber', 
        'taxNumber', 'registrationNumber', 'website', 'description'
      ].includes(editingField);

      if (editingField === 'username') {
        // Username validations...
        // ...existing code...
      }
      
      // Standard field validations
      if (editingField === 'name' && !editValue.includes(' ')) {
        Alert.alert('Hata', 'Lütfen hem adınızı hem soyadınızı girin');
        return;
      }
      
      if (editingField === 'phone' && !/^\+?[0-9]{10,}$/.test(editValue)) {
        Alert.alert('Hata', 'Geçerli bir telefon numarası girin');
        return;
      }
      
      if (editingField === 'dateOfBirth' && !/^\d{2}\/\d{2}\/\d{4}$/.test(editValue)) {
        Alert.alert('Hata', 'Doğum tarihini GG/AA/YYYY formatında girin');
        return;
      }
      
      // Determine update data based on field type
      let updateData;
      
      if (isUserTypeField) {
        // For userType fields, simply use the key-value pair
        updateData = { [editingField]: editValue };
      } else {
        // For standard fields, use the existing logic
        updateData = editingField === 'name' 
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
      }
      
      console.log('Güncellenecek veriler:', updateData);
      
      await userService.updateUser(user.uid, updateData);
      
      // Update local state
      setUserData(prevData => {
        if (editingField === 'name') {
          return {
            ...prevData,
            firstName: editValue.split(' ')[0],
            lastName: editValue.split(' ')[1]
          };
        } else {
          // For all other fields, simply update the matching key
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

  // Navigation handlers
  const handleAchievementsPress = () => {
    navigation.navigate('Achievements');
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  const handlePasswordChange = () => {
    navigation.navigate('ChangePassword');
  };

  const handleVerificationsList = () => {
    navigation.navigate('Verifications');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Çıkış Yap', 
          style: 'destructive',
          onPress: () => signOut()
        }
      ]
    );
  };

  // Calculate level and XP data
  const currentXP = actualXP;
  const currentLevel = calculateLevelFromXP(currentXP);
  const progress = calculateProgressValue(currentXP, currentLevel);
  const nextLevelXP = calculateXpForNextLevel(currentLevel);
  const currentLevelXP = calculateXpForLevel(currentLevel);
  const remainingXP = nextLevelXP - currentXP;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Badge color helper
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

  // Add this function to render role-based information
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
      <Surface style={styles.infoCard} elevation={1}>
        <Text style={styles.cardTitle}>
          {userData.userType === 'business' ? 'İşletme Bilgileri' :
           userData.userType === 'healthcare' ? 'Sağlık Kurumu Bilgileri' :
           'Veteriner Bilgileri'}
        </Text>
        <View style={styles.infoSection}>
          {currentFields.map(({ label, key, icon: IconComponent }, index) => (
            <TouchableOpacity 
              key={key} 
              onPress={() => handleEditUserTypeField(key)}
              style={styles.infoItem}
            >
              <IconComponent size={20} color={colors.primary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{userData?.[key] || 'Belirtilmemiş'}</Text>
              </View>
              <Edit size={18} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </Surface>
    );
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
      {/* Animated header */}
      <Animated.View style={[styles.headerShadow, { opacity: headerOpacity }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profil</Text>
          <TouchableOpacity onPress={handleSettingsPress}>
            <Settings size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          scrollY.setValue(offsetY);
        }}
        scrollEventThrottle={16}
      >
        {/* Profile header */}
        <Surface style={styles.profileHeader} elevation={0}>
          <View style={styles.profileHeaderTop}>
            <Avatar.Image
              size={80}
              source={{ uri: profileImage || 'https://via.placeholder.com/80' }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.name}>
                {userData?.firstName} {userData?.lastName}
              </Text>
              <Text style={styles.username}>@{userData?.username}</Text>
              <Chip 
                icon={() => <Star size={16} color="#FFC107" />} 
                style={styles.levelChip}
              >
                Seviye {currentLevel}
              </Chip>
            </View>
          </View>
          <View style={styles.levelProgressContainer}>
            <View style={styles.levelProgressHeader}>
              <Text style={styles.levelProgressText}>
                Seviye {currentLevel+1} için {remainingXP} XP gerekiyor
              </Text>
              <Text style={styles.xpText}>{currentXP} XP</Text>
            </View>
            <ProgressBar
              progress={progress}
              color={colors.primary}
              style={styles.levelProgressBar}
            />
          </View>
        </Surface>
        
        {/* Stats summary */}
        <Surface style={styles.statsCard} elevation={1}>
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{actualCompletedTaskCount}</Text>
            <Text style={styles.statsLabel}>Görev</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{badges.length}</Text>
            <Text style={styles.statsLabel}>Rozet</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <Text style={styles.statsValue}>{userData?.streak || 0}</Text>
            <Text style={styles.statsLabel}>Seri Gün</Text>
          </View>
        </Surface>
        
        {/* Recent achievements */}
        {recentBadges.length > 0 && (
          <Surface style={styles.achievementsCard} elevation={1}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Son Kazanılan Rozetler</Text>
              <TouchableOpacity onPress={handleAchievementsPress}>
                <Text style={styles.seeAllButton}>Tümünü Gör</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentBadges}>
              {recentBadges.map((badge, index) => (
                <View key={`${badge.id}_${index}`} style={styles.recentBadgeItem}>
                  <View style={[
                    styles.recentBadgeIcon, 
                    {backgroundColor: getBadgeColor(badge.level) + '20'}
                  ]}>
                    <Award size={24} color={getBadgeColor(badge.level)} />
                  </View>
                  <Text style={styles.recentBadgeName}>{badge.name}</Text>
                  <Text style={styles.recentBadgeDate}>
                    {new Date(badge.earnedAt).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
              ))}
            </View>
          </Surface>
        )}
        
        {/* User type specific information */}
        {renderUserTypeInfo()}
        
        {/* Personal information */}
        <Surface style={styles.infoCard} elevation={1}>
          <Text style={styles.cardTitle}>Kişisel Bilgiler</Text>
          
          <View style={styles.infoSection}>
            <TouchableOpacity 
              style={styles.infoItem}
              onPress={() => handleEditField('username')}
            >
              <User size={20} color={colors.primary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Kullanıcı Adı</Text>
                <Text style={styles.infoValue}>@{userData?.username}</Text>
              </View>
              <Edit size={18} color="#999" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.infoItem}
              onPress={() => handleEditField('phone')}
            >
              <Phone size={20} color={colors.primary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Telefon</Text>
                <Text style={styles.infoValue}>{userData?.phoneNumber || 'Belirtilmemiş'}</Text>
              </View>
              <Edit size={18} color="#999" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.infoItem}
              onPress={() => handleEditField('city')}
            >
              <MapPin size={20} color={colors.primary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Şehir</Text>
                <Text style={styles.infoValue}>{userData?.city || 'Belirtilmemiş'}</Text>
              </View>
              <Edit size={18} color="#999" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.infoItem}
              onPress={() => handleEditField('dateOfBirth')}
            >
              <Calendar size={20} color={colors.primary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Doğum Tarihi</Text>
                <Text style={styles.infoValue}>{userData?.dateOfBirth || 'Belirtilmemiş'}</Text>
              </View>
              <Edit size={18} color="#999" />
            </TouchableOpacity>
          </View>
        </Surface>
        
        {/* Bio section */}
        <Surface style={styles.bioCard} elevation={1}>
          <View style={styles.bioHeader}>
            <Text style={styles.cardTitle}>Hakkımda</Text>
            <TouchableOpacity onPress={() => handleEditField('bio')}>
              <Edit size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.bioText}>
            {userData?.bio || 'Kendiniz hakkında bilgi ekleyin...'}
          </Text>
        </Surface>
        
        {/* Quick actions */}
        <Surface style={styles.actionsCard} elevation={1}>
          <Text style={styles.cardTitle}>Hızlı İşlemler</Text>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={handlePasswordChange}
          >
            <Lock size={20} color={colors.primary} style={styles.actionIcon} />
            <Text style={styles.actionText}>Şifre Değiştir</Text>
            <ChevronRight size={20} color="#CCC" />
          </TouchableOpacity>
          
          {userData?.role === 'admin' && (
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={handleVerificationsList}
            >
              <FileText size={20} color={colors.primary} style={styles.actionIcon} />
              <Text style={styles.actionText}>Görev Onayları</Text>
              <ChevronRight size={20} color="#CCC" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionItem, styles.signOutAction]}
            onPress={handleSignOut}
          >
            <LogOut size={20} color={colors.error} style={styles.actionIcon} />
            <Text style={[styles.actionText, styles.signOutText]}>Çıkış Yap</Text>
            <ChevronRight size={20} color="#CCC" />
          </TouchableOpacity>
        </Surface>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Sürüm 1.0.0</Text>
        </View>
      </ScrollView>
      
      {/* Edit modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalContent} elevation={5}>
            <Text style={styles.modalTitle}>
              {editingField === 'name' ? 'Ad Soyad Düzenle' : 
              editingField === 'phone' ? 'Telefon Düzenle' : 
              editingField === 'dateOfBirth' ? 'Doğum Tarihi Düzenle' : 
              editingField === 'city' ? 'Şehir Düzenle' : 
              editingField === 'username' ? 'Kullanıcı Adı Düzenle' :
              editingField === 'bio' ? 'Hakkında Düzenle' : 
              editingField === 'clinicName' ? 'Klinik Adı Düzenle' :
              editingField === 'businessName' ? 'İşletme Adı Düzenle' :
              editingField === 'address' ? 'Adres Düzenle' :
              editingField === 'licenseNumber' ? 'Sicil Numarası Düzenle' :
              editingField === 'taxNumber' ? 'Vergi Numarası Düzenle' :
              editingField === 'registrationNumber' ? 'Sicil Numarası Düzenle' :
              editingField === 'website' ? 'Web Sitesi Düzenle' :
              editingField === 'description' ? 'Açıklama Düzenle' :
              'Bilgi Düzenle'}
            </Text>
            
            {editingField === 'username' && (
              <Text style={styles.modalSubtitle}>
                Kullanıcı adı benzersiz olmalı ve sadece harf, rakam ve alt çizgi içerebilir.
              </Text>
            )}

            <TextInput
              style={styles.input}
              value={editValue}
              onChangeText={handleEditValueChange}
              placeholder="Değer girin"
              autoCapitalize={editingField === 'username' ? 'none' : 'sentences'}
              multiline={editingField === 'bio'}
              numberOfLines={editingField === 'bio' ? 4 : 1}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  profileHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    color: '#333333',
    fontSize: 20,
  },
  username: {
    color: '#666666',
    fontSize: 14,
    marginBottom: 8,
  },
  levelChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF9C4',
  },
  levelProgressContainer: {
    marginTop: 16,
  },
  levelProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  levelProgressText: {
    fontSize: 14,
    color: '#666666',
  },
  xpText: {
    fontSize: 14,
    color: '#666666',
  },
  levelProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    borderRadius: 8,
  },
  statsItem: {
    alignItems: 'center',
    flex: 1,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  statsDivider: {
    width: 1,
    backgroundColor: '#EEEEEE',
    marginHorizontal: 16,
  },
  achievementsCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  seeAllButton: {
    fontSize: 14,
    color: colors.primary,
  },
  recentBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recentBadgeItem: {
    alignItems: 'center',
    flex: 1,
  },
  recentBadgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentBadgeName: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  recentBadgeDate: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  infoCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    borderRadius: 8,
  },
  infoSection: {
    marginTop: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  infoIcon: {
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333333',
  },
  bioCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    borderRadius: 8,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bioText: {
    fontSize: 14,
    color: '#666666',
  },
  actionsCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    borderRadius: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  actionIcon: {
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  signOutAction: {
    borderBottomWidth: 0,
  },
  signOutText: {
    color: colors.error,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
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