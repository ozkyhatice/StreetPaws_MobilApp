import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  Share,
  Clipboard,
} from 'react-native';
import { Text, Button, Avatar, Chip, Divider, FAB, Dialog, Portal, TextInput, Menu, IconButton, Checkbox } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../hooks/useAuth';
import { CommunityService } from '../services/communityService';
import { UserService } from '../services/userService';
import { Community } from '../types/community';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import { ChevronLeft, Edit2, MessageCircle, UserPlus, Users, MapPin, Calendar, Globe, Lock, Camera, MoreVertical, Settings, Trash2, Mail, Link, Share2, Copy, RefreshCw } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type CommunityDetailScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type CommunityDetailScreenRouteProp = {
  params: {
    communityId: string;
  };
};

export default function CommunityDetailScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<CommunityDetailScreenNavigationProp>();
  const route = useRoute<CommunityDetailScreenRouteProp>();
  const { communityId } = route.params;

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [topMembers, setTopMembers] = useState<Array<{id: string, name: string, photoURL: string, isAdmin: boolean, isCreator: boolean}>>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [adminMenuVisible, setAdminMenuVisible] = useState(false);
  const [inviteDialogVisible, setInviteDialogVisible] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [inviteUserLoading, setInviteUserLoading] = useState(false);
  const [memberManagementVisible, setMemberManagementVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [inviteLinkDialogVisible, setInviteLinkDialogVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [webLink, setWebLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [deleteConfirmDialogVisible, setDeleteConfirmDialogVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [messageSettingsVisible, setMessageSettingsVisible] = useState(false);
  const [onlyAdminsCanPost, setOnlyAdminsCanPost] = useState(false);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [banDialogVisible, setBanDialogVisible] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banLoading, setBanLoading] = useState(false);
  const [muteDialogVisible, setMuteDialogVisible] = useState(false);
  const [muteDuration, setMuteDuration] = useState("60"); // dakika
  const [muteReason, setMuteReason] = useState("");
  const [muteLoading, setMuteLoading] = useState(false);
  const [advancedSettingsVisible, setAdvancedSettingsVisible] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState({
    onlyAdminsCanChangeName: false,
    onlyAdminsCanChangeDescription: false,
    onlyAdminsCanChangePhoto: false,
    slowMode: false,
    slowModeInterval: 5, // 5 saniye
    membersCanAddMembers: true,
    approveNewMembers: false,
    showMemberList: true,
    autoDeleteMessages: false,
    autoDeleteAfter: 7 // 7 gün
  });
  const [bulkAddDialogVisible, setBulkAddDialogVisible] = useState(false);
  const [membersToAdd, setMembersToAdd] = useState<string[]>([]);
  const [userUsername, setUserUsername] = useState('');
  const [inviteByUsernameMode, setInviteByUsernameMode] = useState(false);
  
  const communityService = CommunityService.getInstance();
  const userService = UserService.getInstance();

  // Fetch community data
  useEffect(() => {
    const fetchCommunity = async () => {
      if (!communityId) return;
      
      try {
        setLoading(true);
        const communityData = await communityService.getCommunityById(communityId);
        
        if (communityData) {
          setCommunity(communityData);
          
          // Check if user is admin or member
          if (user) {
            setIsAdmin(communityData.admins.includes(user.uid));
            setIsMember(communityData.members.includes(user.uid));
            setIsCreator(communityData.createdBy === user.uid);
          }
          
          // Prepare for editing
          setEditedName(communityData.name);
          setEditedDescription(communityData.description);
          
          // Set message permission settings
          if (communityData.messagePermissions) {
            setOnlyAdminsCanPost(communityData.messagePermissions.onlyAdminsCanPost || false);
            setApprovalRequired(communityData.messagePermissions.approvalRequired || false);
          }

          // Load top 5 members with their details
          await fetchTopMembers(communityData);
        }
      } catch (error) {
        console.error('Error fetching community:', error);
        Alert.alert('Hata', 'Topluluk bilgileri yüklenirken bir sorun oluştu.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunity();
  }, [communityId, user]);

  // Fetch top members
  const fetchTopMembers = async (communityData: Community) => {
    if (!communityData || !communityData.members || communityData.members.length === 0) {
      setMembersLoading(false);
      return;
    }

    try {
      setMembersLoading(true);
      
      // İlk olarak kurucu, sonra adminler, sonra diğer üyeler, toplam 5 kişi
      const creatorFirst = [communityData.createdBy]; // Kurucu öncelikli
      const adminMembers = communityData.admins.filter(id => id !== communityData.createdBy);
      const regularMembers = communityData.members.filter(
        id => !communityData.admins.includes(id) && id !== communityData.createdBy
      );
      
      const memberIds = [...creatorFirst, ...adminMembers, ...regularMembers].slice(0, 5);
      
      const memberPromises = memberIds.map(async (memberId) => {
        try {
          const userData = await userService.getUserById(memberId);
          
          if (!userData) return {
            id: memberId,
            name: memberId === user?.uid ? 'Sen' : 'Kullanıcı',
            photoURL: '',
            isAdmin: communityData.admins.includes(memberId),
            isCreator: memberId === communityData.createdBy
          };
          
          return {
            id: userData.uid,
            name: userData.displayName || (userData.uid === user?.uid ? 'Sen' : 'Kullanıcı'),
            photoURL: userData.photoURL || '',
            isAdmin: communityData.admins.includes(userData.uid),
            isCreator: userData.uid === communityData.createdBy
          };
        } catch (error) {
          console.error(`Error fetching member ${memberId} details:`, error);
          return {
            id: memberId,
            name: memberId === user?.uid ? 'Sen' : 'Kullanıcı',
            photoURL: '',
            isAdmin: communityData.admins.includes(memberId),
            isCreator: memberId === communityData.createdBy
          };
        }
      });
      
      const members = await Promise.all(memberPromises);
      setTopMembers(members);
    } catch (error) {
      console.error('Error fetching top members:', error);
    } finally {
      setMembersLoading(false);
    }
  };

  // Handle joining/leaving community
  const handleJoinLeave = async () => {
    if (!user || !community) return;
    
    try {
      if (isMember) {
        // Leave community
        await communityService.leaveCommunity(communityId, user.uid);
        setIsMember(false);
        if (isAdmin) setIsAdmin(false);
        
        // Update local state
        setCommunity(prev => {
          if (!prev) return null;
          return {
            ...prev,
            members: prev.members.filter(id => id !== user.uid),
            membersCount: prev.membersCount - 1,
            admins: prev.admins.filter(id => id !== user.uid)
          };
        });
      } else {
        // Join community
        await communityService.joinCommunity(communityId, user.uid);
        
        // If public, update UI immediately
        if (community.isPublic) {
          setIsMember(true);
          
          // Update local state
          setCommunity(prev => {
            if (!prev) return null;
            return {
              ...prev,
              members: [...prev.members, user.uid],
              membersCount: prev.membersCount + 1
            };
          });
        } else {
          Alert.alert('Bilgi', 'Katılım isteğiniz topluluğun yöneticilerine gönderildi.');
        }
      }
    } catch (error) {
      console.error('Error joining/leaving community:', error);
      Alert.alert('Hata', 'İşlem sırasında bir sorun oluştu.');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Handle edit dialog
  const showEditDialog = () => {
    setEditDialogVisible(true);
  };

  const hideEditDialog = () => {
    setEditDialogVisible(false);
  };

  // Pick image for community
  const pickImage = async () => {
    if (!isAdmin || !community) return;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadCommunityImage(result.assets[0].uri);
    }
  };

  // Upload image to Firebase
  const uploadCommunityImage = async (uri: string) => {
    if (!community || !user) return;
    
    try {
      setLoading(true);
      
      const storage = getStorage();
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}_${filename}`;
      const storageRef = ref(storage, `community_images/${uniqueFilename}`);
      
      // Fetch and upload image
      const response = await fetch(uri);
      if (!response.ok) throw new Error('Failed to fetch image data');
      
      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Image blob has zero size');
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update community photo URL
      await communityService.updateCommunity(
        communityId,
        { photoURL: downloadURL },
        user.uid
      );
      
      // Update local state
      setCommunity(prev => {
        if (!prev) return null;
        return {
          ...prev,
          photoURL: downloadURL
        };
      });
      
      Alert.alert('Başarılı', 'Topluluk fotoğrafı güncellendi.');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Hata', 'Fotoğraf yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Save edited community info
  const saveEditedCommunity = async () => {
    if (!community || !user || !isAdmin) return;
    
    try {
      setEditLoading(true);
      
      await communityService.updateCommunity(
        communityId,
        {
          name: editedName,
          description: editedDescription
        },
        user.uid
      );
      
      // Update local state
      setCommunity(prev => {
        if (!prev) return null;
        return {
          ...prev,
          name: editedName,
          description: editedDescription
        };
      });
      
      hideEditDialog();
      Alert.alert('Başarılı', 'Topluluk bilgileri güncellendi.');
    } catch (error) {
      console.error('Error updating community:', error);
      Alert.alert('Hata', 'Topluluk bilgileri güncellenirken bir sorun oluştu.');
    } finally {
      setEditLoading(false);
    }
  };

  // Navigate to community chat
  const navigateToCommunityChat = () => {
    if (!community) return;
    
    navigation.navigate('Chat', {
      conversationId: '',
      recipientId: communityId,
      recipientName: community.name,
      isCommunityChat: true
    });
  };

  // View members
  const viewMembers = () => {
    navigation.navigate('CommunityMembers', { communityId });
  };

  // Render member avatar
  const renderMemberAvatar = (member: {id: string, name: string, photoURL: string, isAdmin: boolean, isCreator: boolean}) => {
    return (
      <TouchableOpacity 
        key={member.id}
        style={styles.memberItem}
        onPress={() => {
          if (isAdmin && member.id !== user?.uid) {
            showMemberManagement(member);
          }
        }}
      >
        <Avatar.Image 
          source={{ uri: member.photoURL || 'https://picsum.photos/200' }}
          size={50}
          style={styles.memberAvatar}
        />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName} numberOfLines={1}>
            {member.name}
          </Text>
          {member.isCreator ? (
            <Text style={styles.adminBadge}>Creator</Text>
          ) : member.isAdmin ? (
            <Text style={styles.adminBadge}>Admin</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  // Handle invite by email
  const showInviteDialog = () => {
    setInviteByUsernameMode(false);
    setUserEmail('');
    setUserUsername('');
    setInviteDialogVisible(true);
  };

  const hideInviteDialog = () => {
    setInviteDialogVisible(false);
  };

  const inviteUserByEmail = async () => {
    if (!user || !isAdmin) return;
    
    try {
      setInviteUserLoading(true);
      
      if (inviteByUsernameMode) {
        // Kullanıcı adıyla davet et
        if (!userUsername.trim()) {
          Alert.alert('Hata', 'Lütfen geçerli bir kullanıcı adı girin');
          return;
        }
        
        const result = await communityService.inviteUserByUsername(
          communityId,
          userUsername.trim(),
          user.uid
        );
        
        if (result.success) {
          // Bağlantıyı hemen paylaş
          if (result.webLink) {
            try {
              const shareResult = await Share.share({
                message: `${community?.name} topluluğuna katılmak için bu bağlantıyı kullan: ${result.webLink}`,
                url: result.webLink,
                title: `${community?.name} Topluluğuna Davet`
              });
              
              if (shareResult.action === Share.sharedAction) {
                console.log('Username invite link shared successfully');
              }
            } catch (shareError) {
              console.error('Error sharing invite link:', shareError);
            }
          }
          
          setInviteDialogVisible(false);
          Alert.alert('Başarılı', result.message);
        } else {
          Alert.alert('Hata', result.message);
        }
      } else {
        // E-posta ile davet et
        if (!userEmail.trim() || !userEmail.includes('@')) {
          Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin');
          return;
        }
        
        const result = await communityService.inviteUserByEmail(
          communityId,
          userEmail.trim(),
          user.uid
        );
        
        if (result.success) {
          setInviteDialogVisible(false);
          Alert.alert('Başarılı', result.message);
        } else {
          Alert.alert('Hata', result.message);
        }
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      Alert.alert('Hata', 'Kullanıcı davet edilirken bir sorun oluştu.');
    } finally {
      setInviteUserLoading(false);
    }
  };
  
  // Handle delete community
  const confirmDeleteCommunity = () => {
    if (!isCreator) return;
    
    Alert.alert(
      'Topluluğu Kapat',
      'Bu topluluğu kapatmak istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Kapat',
          style: 'destructive',
          onPress: deleteCommunity,
        },
      ]
    );
  };
  
  const deleteCommunity = async () => {
    if (!user || !isCreator) return;
    
    try {
      setLoading(true);
      
      const result = await communityService.deleteCommunity(communityId, user.uid);
      
      if (result.success) {
        Alert.alert('Başarılı', result.message);
        navigation.goBack();
      } else {
        Alert.alert('Hata', result.message);
      }
    } catch (error) {
      console.error('Error deleting community:', error);
      Alert.alert('Hata', 'Topluluk kapatılırken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle message settings
  const showMessageSettingsDialog = () => {
    setMessageSettingsVisible(true);
  };
  
  const hideMessageSettingsDialog = () => {
    setMessageSettingsVisible(false);
  };
  
  const updateMessagePermissions = async () => {
    if (!user || !isAdmin) return;
    
    try {
      setLoading(true);
      
      const result = await communityService.updateMessagePermissions(
        communityId,
        {
          onlyAdminsCanPost,
          approvalRequired
        },
        user.uid
      );
      
      if (result.success) {
        Alert.alert('Başarılı', result.message);
        hideMessageSettingsDialog();
        
        // Refresh community data
        const communityData = await communityService.getCommunityById(communityId);
        if (communityData) {
          setCommunity(communityData);
        }
      } else {
        Alert.alert('Hata', result.message);
      }
    } catch (error) {
      console.error('Error updating message permissions:', error);
      Alert.alert('Hata', 'Mesaj izinleri güncellenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Yeni üye yönetimi fonksiyonları
  const showMemberManagement = (member: any) => {
    setSelectedMember(member);
    setMemberManagementVisible(true);
  };

  const hideMemberManagement = () => {
    setMemberManagementVisible(false);
    setSelectedMember(null);
  };

  const makeUserAdmin = async () => {
    if (!user || !isAdmin || !selectedMember) return;
    
    try {
      setLoading(true);
      
      await communityService.makeAdmin(
        communityId, 
        selectedMember.id, 
        user.uid
      );
      
      // Refresh community data
      const communityData = await communityService.getCommunityById(communityId);
      if (communityData) {
        setCommunity(communityData);
        // Update member list
        await fetchTopMembers(communityData);
      }
      
      hideMemberManagement();
      Alert.alert('Başarılı', `${selectedMember.name} artık yönetici`);
    } catch (error) {
      console.error('Error making user admin:', error);
      Alert.alert('Hata', 'İşlem sırasında bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const removeUserAdmin = async () => {
    if (!user || !isAdmin || !selectedMember) return;
    
    try {
      setLoading(true);
      
      const result = await communityService.removeAdmin(
        communityId, 
        selectedMember.id, 
        user.uid
      );
      
      if (result.success) {
        // Refresh community data
        const communityData = await communityService.getCommunityById(communityId);
        if (communityData) {
          setCommunity(communityData);
          // Update member list
          await fetchTopMembers(communityData);
        }
        
        hideMemberManagement();
        Alert.alert('Başarılı', result.message);
      } else {
        Alert.alert('Hata', result.message);
      }
    } catch (error) {
      console.error('Error removing admin role:', error);
      Alert.alert('Hata', 'İşlem sırasında bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async () => {
    if (!user || !isAdmin || !selectedMember) return;
    
    try {
      setLoading(true);
      
      await communityService.removeMember(
        communityId, 
        selectedMember.id, 
        user.uid
      );
      
      // Refresh community data
      const communityData = await communityService.getCommunityById(communityId);
      if (communityData) {
        setCommunity(communityData);
        // Update member list
        await fetchTopMembers(communityData);
      }
      
      hideMemberManagement();
      Alert.alert('Başarılı', `${selectedMember.name} topluluktan çıkarıldı`);
    } catch (error) {
      console.error('Error removing member:', error);
      Alert.alert('Hata', 'İşlem sırasında bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Ban functions
  const showBanDialog = () => {
    setBanDialogVisible(true);
    setMemberManagementVisible(false);
  };

  const hideBanDialog = () => {
    setBanDialogVisible(false);
    setBanReason("");
  };

  const banMember = async () => {
    if (!user || !isAdmin || !selectedMember) return;
    
    try {
      setLoading(true);
      
      const result = await communityService.banMember(
        communityId, 
        selectedMember.id, 
        user.uid,
        banReason
      );
      
      if (result.success) {
        // Refresh community data
        const communityData = await communityService.getCommunityById(communityId);
        if (communityData) {
          setCommunity(communityData);
          // Update member list
          await fetchTopMembers(communityData);
        }
        
        hideBanDialog();
        Alert.alert('Başarılı', result.message);
      } else {
        Alert.alert('Hata', result.message);
      }
    } catch (error) {
      console.error('Error banning member:', error);
      Alert.alert('Hata', 'İşlem sırasında bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Mute functions
  const showMuteDialog = () => {
    setMuteDialogVisible(true);
    setMemberManagementVisible(false);
  };

  const hideMuteDialog = () => {
    setMuteDialogVisible(false);
    setMuteDuration("60");
    setMuteReason("");
  };

  const muteMember = async () => {
    if (!user || !isAdmin || !selectedMember) return;
    
    try {
      setLoading(true);
      
      const duration = parseInt(muteDuration, 10);
      if (isNaN(duration) || duration <= 0) {
        Alert.alert('Hata', 'Geçerli bir süre giriniz');
        return;
      }
      
      const result = await communityService.muteMember(
        communityId, 
        selectedMember.id, 
        user.uid,
        duration,
        muteReason
      );
      
      if (result.success) {
        // Refresh community data
        const communityData = await communityService.getCommunityById(communityId);
        if (communityData) {
          setCommunity(communityData);
        }
        
        hideMuteDialog();
        Alert.alert('Başarılı', result.message);
      } else {
        Alert.alert('Hata', result.message);
      }
    } catch (error) {
      console.error('Error muting member:', error);
      Alert.alert('Hata', 'İşlem sırasında bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Advanced settings
  const showAdvancedSettings = () => {
    // If we already have settings from the community, use those
    if (community.advancedSettings) {
      setAdvancedSettings({
        ...advancedSettings,
        ...community.advancedSettings
      });
    }
    
    setAdvancedSettingsVisible(true);
    setAdminMenuVisible(false);
  };

  const hideAdvancedSettings = () => {
    setAdvancedSettingsVisible(false);
  };

  const updateAdvancedSettings = async () => {
    if (!user || !isAdmin) return;
    
    try {
      setLoading(true);
      
      const result = await communityService.updateAdvancedSettings(
        communityId,
        advancedSettings,
        user.uid
      );
      
      if (result.success) {
        // Refresh community data
        const communityData = await communityService.getCommunityById(communityId);
        if (communityData) {
          setCommunity(communityData);
        }
        
        hideAdvancedSettings();
        Alert.alert('Başarılı', result.message);
      } else {
        Alert.alert('Hata', result.message);
      }
    } catch (error) {
      console.error('Error updating advanced settings:', error);
      Alert.alert('Hata', 'Ayarlar güncellenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Bulk add members
  const showBulkAddDialog = () => {
    setBulkAddDialogVisible(true);
    setAdminMenuVisible(false);
  };

  const hideBulkAddDialog = () => {
    setBulkAddDialogVisible(false);
    setMembersToAdd([]);
  };

  const addMultipleMembers = async () => {
    if (!user || !isAdmin || membersToAdd.length === 0) return;
    
    try {
      setLoading(true);
      
      const result = await communityService.addMultipleMembers(
        communityId,
        membersToAdd,
        user.uid
      );
      
      if (result.success) {
        // Refresh community data
        const communityData = await communityService.getCommunityById(communityId);
        if (communityData) {
          setCommunity(communityData);
        }
        
        hideBulkAddDialog();
        Alert.alert('Başarılı', result.message);
      } else {
        Alert.alert('Hata', result.message);
      }
    } catch (error) {
      console.error('Error adding multiple members:', error);
      Alert.alert('Hata', 'Üyeler eklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Davet bağlantısı fonksiyonları
  const showInviteLinkDialog = async () => {
    if (!user || !isAdmin || !community) return;
    
    setInviteLinkDialogVisible(true);
    
    try {
      setIsGeneratingLink(true);
      
      // Mevcut davet bağlantısını al veya yeni oluştur
      const linkData = await communityService.generateInviteLink(communityId);
      
      setInviteCode(linkData.inviteCode);
      setInviteLink(linkData.inviteLink);
      setWebLink(linkData.webLink);
    } catch (error) {
      console.error('Error generating invite link:', error);
      Alert.alert('Hata', 'Davet bağlantısı oluşturulurken bir sorun oluştu.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const hideInviteLinkDialog = () => {
    setInviteLinkDialogVisible(false);
  };

  const resetInviteLink = async () => {
    if (!user || !isAdmin) return;
    
    try {
      setIsGeneratingLink(true);
      
      const result = await communityService.resetInviteLink(communityId, user.uid);
      
      if (result.success && result.inviteCode && result.inviteLink) {
        setInviteCode(result.inviteCode);
        setInviteLink(result.inviteLink);
        setWebLink(result.webLink || '');
        
        Alert.alert('Başarılı', 'Davet bağlantısı başarıyla sıfırlandı');
      } else {
        Alert.alert('Hata', result.message);
      }
    } catch (error) {
      console.error('Error resetting invite link:', error);
      Alert.alert('Hata', 'Davet bağlantısı sıfırlanırken bir sorun oluştu.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyInviteLink = () => {
    Clipboard.setString(webLink);
    Alert.alert('Bilgi', 'Davet bağlantısı panoya kopyalandı.');
  };

  const shareInviteLink = async () => {
    try {
      const result = await Share.share({
        message: `${community?.name} topluluğuna katılmak için bu bağlantıyı kullan: ${webLink}`,
        url: webLink,
        title: `${community?.name} Topluluğuna Davet`
      });
      
      if (result.action === Share.sharedAction) {
        console.log('Link shared successfully');
      }
    } catch (error) {
      console.error('Error sharing invite link:', error);
      Alert.alert('Hata', 'Davet bağlantısı paylaşılırken bir sorun oluştu.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Topluluk bilgileri yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!community) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Topluluk bulunamadı veya erişim izniniz yok.</Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Geri Dön
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          
          {isAdmin && (
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={showEditDialog}
              >
                <Edit2 size={20} color={colors.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.menuButton, { backgroundColor: colors.primary + '20', borderRadius: 20, padding: spacing.sm }]}
                onPress={() => setAdminMenuVisible(true)}
              >
                <MoreVertical size={20} color={colors.primary} />
              </TouchableOpacity>
              
              <Menu
                visible={adminMenuVisible}
                onDismiss={() => setAdminMenuVisible(false)}
                anchor={
                  <View />
                }
              >
                <Menu.Item 
                  leadingIcon={() => <UserPlus size={20} color={colors.text} />}
                  onPress={() => {
                    setAdminMenuVisible(false);
                    showInviteDialog();
                  }} 
                  title="Üye Davet Et" 
                />
                <Menu.Item 
                  leadingIcon={() => <Link size={20} color={colors.text} />}
                  onPress={() => {
                    setAdminMenuVisible(false);
                    showInviteLinkDialog();
                  }} 
                  title="Davet Bağlantısı" 
                />
                <Menu.Item 
                  leadingIcon={() => <Users size={20} color={colors.text} />}
                  onPress={() => {
                    setAdminMenuVisible(false);
                    showBulkAddDialog();
                  }} 
                  title="Toplu Üye Ekle" 
                />
                <Menu.Item 
                  leadingIcon={() => <Settings size={20} color={colors.text} />}
                  onPress={() => {
                    setAdminMenuVisible(false);
                    showMessageSettingsDialog();
                  }} 
                  title="Mesaj İzinleri" 
                />
                <Menu.Item 
                  leadingIcon={() => <Settings size={20} color={colors.text} />}
                  onPress={() => {
                    setAdminMenuVisible(false);
                    showAdvancedSettings();
                  }} 
                  title="Gelişmiş Ayarlar" 
                />
                {isCreator && (
                  <Menu.Item 
                    leadingIcon={() => <Trash2 size={20} color={colors.error} />}
                    onPress={() => {
                      setAdminMenuVisible(false);
                      confirmDeleteCommunity();
                    }} 
                    title="Topluluğu Kapat" 
                    titleStyle={{ color: colors.error }}
                  />
                )}
              </Menu>
            </View>
          )}
        </View>
        
        {/* Community hero section */}
        <View style={styles.heroSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={isAdmin ? pickImage : undefined}
          >
            <Avatar.Image 
              source={{ uri: community.photoURL || 'https://picsum.photos/200' }}
              size={120}
              style={styles.avatar}
            />
            {isAdmin && (
              <View style={styles.editAvatarBadge}>
                <Camera size={16} color={colors.background} />
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={styles.communityName}>{community.name}</Text>
          
          <View style={styles.metaInfo}>
            <View style={styles.privacyBadge}>
              {community.isPublic ? (
                <>
                  <Globe size={14} color={colors.primary} />
                  <Text style={[styles.privacyText, { color: colors.primary }]}>
                    Herkese Açık
                  </Text>
                </>
              ) : (
                <>
                  <Lock size={14} color={colors.warning} />
                  <Text style={[styles.privacyText, { color: colors.warning }]}>
                    Özel Topluluk
                  </Text>
                </>
              )}
            </View>
            
            <View style={styles.membersCount}>
              <Users size={14} color={colors.textSecondary} />
              <Text style={styles.membersCountText}>
                {community.membersCount} Üye
              </Text>
            </View>
          </View>
          
          <View style={styles.categoryContainer}>
            <Chip 
              style={styles.categoryChip}
              textStyle={styles.categoryChipText}
            >
              {getCategoryLabel(community.category)}
            </Chip>
          </View>
          
          <View style={styles.actionButtons}>
            <Button 
              mode={isMember ? "outlined" : "contained"} 
              style={styles.actionButton}
              onPress={handleJoinLeave}
            >
              {isMember ? 'Ayrıl' : community.isPublic ? 'Katıl' : 'İstek Gönder'}
            </Button>
            
            {isMember && (
              <Button 
                mode="contained" 
                style={[styles.actionButton, styles.chatButton]}
                icon={({ size, color }) => <MessageCircle size={size} color={color} />}
                onPress={navigateToCommunityChat}
              >
                Sohbet
              </Button>
            )}
          </View>
          
          {isAdmin && (
            <View style={styles.adminInfoBanner}>
              <Text style={styles.adminInfoText}>
                {isCreator ? 'Kurucu' : 'Yönetici'} olarak bu topluluğu yönetebilirsiniz.
              </Text>
            </View>
          )}
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Community details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Topluluk Hakkında</Text>
          <Text style={styles.description}>{community.description}</Text>
          
          {community.location && (
            <View style={styles.locationContainer}>
              <MapPin size={18} color={colors.textSecondary} />
              <Text style={styles.locationText}>{community.location.address}</Text>
            </View>
          )}
          
          <View style={styles.creationInfo}>
            <Calendar size={16} color={colors.textSecondary} />
            <Text style={styles.creationText}>
              {formatDate(community.createdAt)} tarihinde kuruldu
            </Text>
          </View>
          
          {community.tags && community.tags.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Etiketler</Text>
              <View style={styles.tagsContainer}>
                {community.tags.map(tag => (
                  <Chip
                    key={tag}
                    style={styles.tagChip}
                    textStyle={styles.tagChipText}
                  >
                    #{tag}
                  </Chip>
                ))}
              </View>
            </>
          )}
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Members section */}
        <View style={styles.membersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Üyeler</Text>
            <TouchableOpacity onPress={viewMembers}>
              <Text style={styles.viewAllText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.membersScrollContent}
          >
            {membersLoading ? (
              <View style={styles.membersLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.membersLoadingText}>Üyeler yükleniyor...</Text>
              </View>
            ) : community.members.length === 0 ? (
              <Text style={[styles.memberName, {marginLeft: spacing.md}]}>Henüz üye bulunmuyor</Text>
            ) : (
              <>
                {topMembers.map((member) => 
                  renderMemberAvatar(member)
                )}
              </>
            )}
          </ScrollView>
        </View>
      </ScrollView>
      
      {/* Dialogs */}
      <Portal>
        {/* Edit Dialog */}
        <Dialog visible={editDialogVisible} onDismiss={hideEditDialog}>
          <Dialog.Title>Topluluk Düzenle</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Topluluk Adı"
              value={editedName}
              onChangeText={setEditedName}
              style={styles.dialogInput}
            />
            
            <TextInput
              label="Açıklama"
              value={editedDescription}
              onChangeText={setEditedDescription}
              style={styles.dialogInput}
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideEditDialog}>İptal</Button>
            <Button 
              mode="contained" 
              onPress={saveEditedCommunity}
              loading={editLoading}
            >
              Kaydet
            </Button>
          </Dialog.Actions>
        </Dialog>
        
        {/* Invite User Dialog */}
        <Dialog visible={inviteDialogVisible} onDismiss={hideInviteDialog}>
          <Dialog.Title>Kullanıcı Davet Et</Dialog.Title>
          <Dialog.Content>
            <View style={styles.segmentContainer}>
              <TouchableOpacity 
                style={[
                  styles.segmentButton, 
                  !inviteByUsernameMode && styles.segmentButtonActive
                ]}
                onPress={() => setInviteByUsernameMode(false)}
              >
                <Text style={!inviteByUsernameMode ? styles.segmentTextActive : styles.segmentText}>
                  E-posta ile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.segmentButton, 
                  inviteByUsernameMode && styles.segmentButtonActive
                ]}
                onPress={() => setInviteByUsernameMode(true)}
              >
                <Text style={inviteByUsernameMode ? styles.segmentTextActive : styles.segmentText}>
                  Kullanıcı adı ile
                </Text>
              </TouchableOpacity>
            </View>
            
            {inviteByUsernameMode ? (
              <TextInput
                label="Kullanıcı Adı"
                value={userUsername}
                onChangeText={setUserUsername}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
              />
            ) : (
              <TextInput
                label="E-posta Adresi"
                value={userEmail}
                onChangeText={setUserEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideInviteDialog}>İptal</Button>
            <Button 
              mode="contained"
              onPress={inviteUserByEmail}
              loading={inviteUserLoading}
              disabled={inviteUserLoading || (inviteByUsernameMode ? !userUsername.trim() : !userEmail.trim())}
            >
              {inviteByUsernameMode ? 'Davet Bağlantısı Gönder' : 'Davet Et'}
            </Button>
          </Dialog.Actions>
        </Dialog>
        
        {/* Message Settings Dialog */}
        <Dialog visible={messageSettingsVisible} onDismiss={hideMessageSettingsDialog}>
          <Dialog.Title>Mesaj İzinleri</Dialog.Title>
          <Dialog.Content>
            <View style={styles.settingRow}>
              <Text>Sadece yöneticiler mesaj gönderebilir</Text>
              <Checkbox
                status={onlyAdminsCanPost ? 'checked' : 'unchecked'}
                onPress={() => setOnlyAdminsCanPost(!onlyAdminsCanPost)}
              />
            </View>
            
            <View style={styles.settingRow}>
              <Text>Mesajlar onay gerektirsin</Text>
              <Checkbox
                status={approvalRequired ? 'checked' : 'unchecked'}
                onPress={() => setApprovalRequired(!approvalRequired)}
              />
            </View>
            
            <Text style={styles.dialogText}>
              Not: Bu ayarlar kimler mesaj gönderebilir ve mesajlar nasıl onaylanır kurallarını belirler.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideMessageSettingsDialog}>İptal</Button>
            <Button 
              mode="contained" 
              onPress={updateMessagePermissions}
            >
              Kaydet
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Member Management Dialog */}
        <Dialog visible={memberManagementVisible} onDismiss={hideMemberManagement}>
          <Dialog.Title>Üye Yönetimi</Dialog.Title>
          <Dialog.Content>
            {selectedMember && (
              <View style={styles.memberManagementContainer}>
                <Avatar.Image 
                  source={{ uri: selectedMember.photoURL || 'https://picsum.photos/200' }}
                  size={60}
                  style={styles.memberAvatar}
                />
                <Text style={styles.memberName}>{selectedMember.name}</Text>
                
                {selectedMember.isCreator ? (
                  <Chip style={styles.roleChip}>Kurucu</Chip>
                ) : selectedMember.isAdmin ? (
                  <Chip style={styles.roleChip}>Yönetici</Chip>
                ) : (
                  <Chip style={styles.roleChip}>Üye</Chip>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideMemberManagement}>İptal</Button>
            
            {selectedMember && !selectedMember.isCreator && (
              <>
                {/* Regular member to admin */}
                {!selectedMember.isAdmin && (
                  <Button onPress={makeUserAdmin}>Yönetici Yap</Button>
                )}
                
                {/* Admin to regular member */}
                {selectedMember.isAdmin && (
                  <Button onPress={removeUserAdmin}>Yöneticilik Kaldır</Button>
                )}
                
                {/* Ban and mute options */}
                <Button 
                  mode="contained" 
                  buttonColor={colors.warning}
                  textColor={colors.background}
                  onPress={showMuteDialog}
                >
                  Sustur
                </Button>
                
                <Button 
                  mode="contained"
                  buttonColor={colors.error}
                  textColor={colors.background}
                  onPress={showBanDialog}
                >
                  Yasakla
                </Button>
                
                {/* Remove from group */}
                <Button 
                  mode="contained"
                  buttonColor={colors.error}
                  textColor={colors.background}
                  onPress={removeMember}
                >
                  Çıkar
                </Button>
              </>
            )}
          </Dialog.Actions>
        </Dialog>

        {/* Ban Dialog */}
        <Dialog visible={banDialogVisible} onDismiss={hideBanDialog}>
          <Dialog.Title>Üyeyi Yasakla</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Bu işlem üyeyi topluluktan çıkaracak ve tekrar katılmasını engelleyecektir.
            </Text>
            <TextInput
              label="Yasaklama Nedeni (opsiyonel)"
              value={banReason}
              onChangeText={setBanReason}
              style={styles.dialogInput}
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideBanDialog}>İptal</Button>
            <Button 
              mode="contained"
              buttonColor={colors.error}
              textColor={colors.background}
              onPress={banMember}
            >
              Yasakla
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Mute Dialog */}
        <Dialog visible={muteDialogVisible} onDismiss={hideMuteDialog}>
          <Dialog.Title>Üyeyi Sustur</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Bu işlem üyenin belirli bir süre boyunca mesaj göndermesini engelleyecektir.
            </Text>
            <TextInput
              label="Süre (dakika)"
              value={muteDuration}
              onChangeText={setMuteDuration}
              keyboardType="number-pad"
              style={styles.dialogInput}
            />
            <TextInput
              label="Susturma Nedeni (opsiyonel)"
              value={muteReason}
              onChangeText={setMuteReason}
              style={styles.dialogInput}
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideMuteDialog}>İptal</Button>
            <Button 
              mode="contained"
              buttonColor={colors.warning}
              textColor={colors.background}
              onPress={muteMember}
            >
              Sustur
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Advanced Settings Dialog */}
        <Dialog visible={advancedSettingsVisible} onDismiss={hideAdvancedSettings}>
          <Dialog.Title>Gelişmiş Ayarlar</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <View style={styles.settingsSection}>
                <Text style={styles.settingsSectionTitle}>Topluluk Yönetimi</Text>
                
                <View style={styles.settingRow}>
                  <Text>Sadece yöneticiler isim değiştirebilir</Text>
                  <Checkbox
                    status={advancedSettings.onlyAdminsCanChangeName ? 'checked' : 'unchecked'}
                    onPress={() => setAdvancedSettings({
                      ...advancedSettings,
                      onlyAdminsCanChangeName: !advancedSettings.onlyAdminsCanChangeName
                    })}
                  />
                </View>
                
                <View style={styles.settingRow}>
                  <Text>Sadece yöneticiler açıklama değiştirebilir</Text>
                  <Checkbox
                    status={advancedSettings.onlyAdminsCanChangeDescription ? 'checked' : 'unchecked'}
                    onPress={() => setAdvancedSettings({
                      ...advancedSettings,
                      onlyAdminsCanChangeDescription: !advancedSettings.onlyAdminsCanChangeDescription
                    })}
                  />
                </View>
                
                <View style={styles.settingRow}>
                  <Text>Sadece yöneticiler fotoğraf değiştirebilir</Text>
                  <Checkbox
                    status={advancedSettings.onlyAdminsCanChangePhoto ? 'checked' : 'unchecked'}
                    onPress={() => setAdvancedSettings({
                      ...advancedSettings,
                      onlyAdminsCanChangePhoto: !advancedSettings.onlyAdminsCanChangePhoto
                    })}
                  />
                </View>
                
                <View style={styles.settingRow}>
                  <Text>Üyeler birbirini ekleyebilir</Text>
                  <Checkbox
                    status={advancedSettings.membersCanAddMembers ? 'checked' : 'unchecked'}
                    onPress={() => setAdvancedSettings({
                      ...advancedSettings,
                      membersCanAddMembers: !advancedSettings.membersCanAddMembers
                    })}
                  />
                </View>
                
                <View style={styles.settingRow}>
                  <Text>Yeni üyeler onay gerektirir</Text>
                  <Checkbox
                    status={advancedSettings.approveNewMembers ? 'checked' : 'unchecked'}
                    onPress={() => setAdvancedSettings({
                      ...advancedSettings,
                      approveNewMembers: !advancedSettings.approveNewMembers
                    })}
                  />
                </View>
                
                <View style={styles.settingRow}>
                  <Text>Üye listesini göster</Text>
                  <Checkbox
                    status={advancedSettings.showMemberList ? 'checked' : 'unchecked'}
                    onPress={() => setAdvancedSettings({
                      ...advancedSettings,
                      showMemberList: !advancedSettings.showMemberList
                    })}
                  />
                </View>
              </View>
              
              <View style={styles.settingsSection}>
                <Text style={styles.settingsSectionTitle}>Mesaj Ayarları</Text>
                
                <View style={styles.settingRow}>
                  <Text>Yavaş mod (mesaj sınırlaması)</Text>
                  <Checkbox
                    status={advancedSettings.slowMode ? 'checked' : 'unchecked'}
                    onPress={() => setAdvancedSettings({
                      ...advancedSettings,
                      slowMode: !advancedSettings.slowMode
                    })}
                  />
                </View>
                
                {advancedSettings.slowMode && (
                  <View style={styles.settingRow}>
                    <Text>Mesaj aralığı (saniye)</Text>
                    <TextInput
                      value={String(advancedSettings.slowModeInterval)}
                      onChangeText={(text) => {
                        const value = parseInt(text, 10);
                        if (!isNaN(value) && value > 0) {
                          setAdvancedSettings({
                            ...advancedSettings,
                            slowModeInterval: value
                          });
                        }
                      }}
                      keyboardType="number-pad"
                      style={styles.smallInput}
                    />
                  </View>
                )}
                
                <View style={styles.settingRow}>
                  <Text>Mesajları otomatik sil</Text>
                  <Checkbox
                    status={advancedSettings.autoDeleteMessages ? 'checked' : 'unchecked'}
                    onPress={() => setAdvancedSettings({
                      ...advancedSettings,
                      autoDeleteMessages: !advancedSettings.autoDeleteMessages
                    })}
                  />
                </View>
                
                {advancedSettings.autoDeleteMessages && (
                  <View style={styles.settingRow}>
                    <Text>Silme süresi (gün)</Text>
                    <TextInput
                      value={String(advancedSettings.autoDeleteAfter)}
                      onChangeText={(text) => {
                        const value = parseInt(text, 10);
                        if (!isNaN(value) && value > 0) {
                          setAdvancedSettings({
                            ...advancedSettings,
                            autoDeleteAfter: value
                          });
                        }
                      }}
                      keyboardType="number-pad"
                      style={styles.smallInput}
                    />
                  </View>
                )}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={hideAdvancedSettings}>İptal</Button>
            <Button mode="contained" onPress={updateAdvancedSettings}>Kaydet</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Bulk Add Members Dialog */}
        <Dialog visible={bulkAddDialogVisible} onDismiss={hideBulkAddDialog}>
          <Dialog.Title>Toplu Üye Ekle</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Eklemek istediğiniz üye ID'lerini virgülle ayırarak girin.
            </Text>
            <TextInput
              label="Üye ID'leri (virgülle ayırın)"
              value={membersToAdd.join(',')}
              onChangeText={(text) => {
                const ids = text.split(',').map(id => id.trim()).filter(id => id);
                setMembersToAdd(ids);
              }}
              style={styles.dialogInput}
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideBulkAddDialog}>İptal</Button>
            <Button 
              mode="contained"
              onPress={addMultipleMembers}
              disabled={membersToAdd.length === 0}
            >
              Ekle ({membersToAdd.length})
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Davet Bağlantısı Dialog */}
        <Dialog
          visible={inviteLinkDialogVisible}
          onDismiss={hideInviteLinkDialog}
          style={styles.linkDialog}
        >
          <Dialog.Title>Topluluk Davet Bağlantısı</Dialog.Title>
          <Dialog.Content>
            {isGeneratingLink ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <>
                <View style={styles.inviteLinkContainer}>
                  <Text style={styles.inviteCode}>{inviteCode}</Text>
                  <Text style={styles.inviteLink}>{webLink}</Text>
                </View>
                
                <View style={styles.inviteLinkActions}>
                  <Button 
                    mode="outlined" 
                    onPress={copyInviteLink}
                    style={styles.inviteLinkButton}
                    icon="content-copy"
                  >
                    Kopyala
                  </Button>
                  
                  <Button 
                    mode="contained" 
                    onPress={shareInviteLink}
                    style={styles.inviteLinkButton}
                    icon="share-variant"
                  >
                    Paylaş
                  </Button>
                </View>
                
                <Button 
                  mode="outlined"
                  onPress={resetInviteLink}
                  style={{marginTop: spacing.sm}}
                  icon="refresh"
                >
                  Bağlantıyı Sıfırla
                </Button>
                
                <Text style={styles.warningText}>
                  Not: Bağlantıyı sıfırladığınızda eski bağlantı çalışmayacaktır.
                </Text>
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideInviteLinkDialog}>Kapat</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* FAB for admin actions */}
      {isAdmin && (
        <FAB
          style={styles.fab}
          icon={({ size, color }) => <Edit2 size={size} color={color} />}
          onPress={showEditDialog}
        />
      )}
    </SafeAreaView>
  );
}

// Helper function to get category label
const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'ANIMAL_RESCUE': return 'Hayvan Kurtarma';
    case 'FEEDING': return 'Besleme';
    case 'SHELTER': return 'Barınak';
    case 'ADOPTION': return 'Sahiplendirme';
    case 'VETERINARY': return 'Veteriner';
    case 'EDUCATION': return 'Eğitim';
    case 'FUNDRAISING': return 'Bağış Toplama';
    default: return 'Diğer';
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  editButton: {
    padding: spacing.xs,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  heroSection: {
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    backgroundColor: colors.primaryLight + '30',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  communityName: {
    ...typography.h2,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  privacyText: {
    ...typography.caption,
    marginLeft: spacing.xxs,
  },
  membersCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersCountText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xxs,
  },
  categoryContainer: {
    marginBottom: spacing.md,
  },
  categoryChip: {
    backgroundColor: colors.primary + '15',
  },
  categoryChipText: {
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  actionButton: {
    marginHorizontal: spacing.xs,
    flex: 1,
  },
  chatButton: {
    backgroundColor: colors.primary,
  },
  divider: {
    marginVertical: spacing.md,
  },
  detailsSection: {
    padding: spacing.screenPadding,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locationText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  creationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  creationText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.primary + '15',
  },
  tagChipText: {
    ...typography.caption,
    color: colors.primary,
  },
  membersSection: {
    padding: spacing.screenPadding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllText: {
    ...typography.body2,
    color: colors.primary,
  },
  membersScrollContent: {
    paddingRight: spacing.xl,
  },
  memberItem: {
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    marginVertical: spacing.sm,
    width: 70,
  },
  memberAvatar: {
    marginBottom: spacing.xs,
  },
  memberName: {
    ...typography.subtitle1,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xxs,
  },
  adminChip: {
    backgroundColor: colors.primary + '15',
    height: 20,
  },
  adminChipText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.primary,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  dialogInput: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  dialogTextArea: {
    marginBottom: spacing.sm,
    minHeight: 100,
  },
  membersLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  membersLoadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  dialogCheckboxContainer: {
    marginTop: spacing.sm,
  },
  adminInfoBanner: {
    backgroundColor: colors.primary + '15',
    padding: spacing.sm,
    borderRadius: borderRadius.medium,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
  },
  adminInfoText: {
    ...typography.body2,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: 'bold' as const,
  },
  memberManagementContainer: {
    alignItems: 'center',
    padding: spacing.md,
  },
  roleChip: {
    backgroundColor: colors.primary + '15',
    padding: spacing.xs,
    borderRadius: borderRadius.small,
    marginTop: spacing.xs,
  },
  settingsSection: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  settingsSectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  smallInput: {
    width: 80,
    height: 40,
    backgroundColor: colors.background,
    padding: spacing.xs,
    borderRadius: borderRadius.small,
    textAlign: 'center',
  },
  dialogText: {
    marginBottom: spacing.sm,
    color: colors.textSecondary,
  },
  memberInfo: {
    alignItems: 'center',
    marginTop: spacing.xxs,
  },
  adminBadge: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 2,
    fontSize: 10,
  },
  inviteLinkContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inviteCode: {
    ...typography.subtitle1,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  inviteLink: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  inviteLinkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  inviteLinkButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  warningText: {
    color: colors.warning,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.text,
  },
  segmentTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  input: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  linkDialog: {
    width: '90%',
    maxWidth: 400,
  },
}); 