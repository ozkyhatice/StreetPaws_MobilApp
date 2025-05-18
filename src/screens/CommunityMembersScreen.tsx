import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Text, Avatar, Button, Searchbar, Chip, Divider, FAB, Dialog, TextInput, Checkbox, IconButton } from 'react-native-paper';
import { ChevronLeft, Crown, MessageCircle, UserMinus, UserPlus, Users, X, Check, Shield, Plus } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../hooks/useAuth';
import { CommunityService } from '../services/communityService';
import { UserService } from '../services/userService';
import { colors, spacing, typography, borderRadius } from '../config/theme';

type CommunityMembersScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type CommunityMembersScreenRouteProp = {
  params: {
    communityId: string;
  };
};

type CommunityMember = {
  id: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  isCurrentUser: boolean;
  isCreator?: boolean;
  email?: string;
};

export default function CommunityMembersScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<CommunityMembersScreenNavigationProp>();
  const route = useRoute<CommunityMembersScreenRouteProp>();
  const { communityId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [community, setCommunity] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [memberLoadingStates, setMemberLoadingStates] = useState<{[key: string]: boolean}>({});
  
  // Yeni state değişkenleri
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [bulkAddDialogVisible, setBulkAddDialogVisible] = useState(false);
  const [membersToAdd, setMembersToAdd] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkAdminDialogVisible, setBulkAdminDialogVisible] = useState(false);
  
  const communityService = CommunityService.getInstance();
  const userService = UserService.getInstance();
  
  // Veri yükleme fonksiyonu, componentin dışından da erişilebilir
  const fetchData = async () => {
    if (!communityId || !user) return;
    
    try {
      setLoading(true);
      
      // Get community details
      const communityData = await communityService.getCommunityById(communityId);
      if (!communityData) {
        Alert.alert('Hata', 'Topluluk bulunamadı');
        navigation.goBack();
        return;
      }
      
      setCommunity(communityData);
      
      // Check if current user is admin
      setIsAdmin(communityData.admins.includes(user.uid));
      
      // Initialize loading states for all members
      const loadingStates: {[key: string]: boolean} = {};
      communityData.members.forEach((memberId: string) => {
        loadingStates[memberId] = true;
      });
      setMemberLoadingStates(loadingStates);
      
      // Get member details
      const memberPromises = communityData.members.map(async (memberId: string) => {
        try {
          const userData = await userService.getUserById(memberId);
          
          // Update loading state for this member
          setMemberLoadingStates(prev => ({
            ...prev,
            [memberId]: false
          }));
          
          if (!userData) return null;
          
          const isCreator = memberId === communityData.createdBy;
          const isAdmin = communityData.admins.includes(memberId);
          
          return {
            id: userData.uid,
            name: userData.displayName || 'Kullanıcı',
            email: userData.email || undefined,
            avatar: userData.photoURL || '',
            isAdmin: isAdmin,
            isCurrentUser: userData.uid === user.uid,
            isCreator: isCreator
          };
        } catch (error) {
          console.error(`Error fetching member ${memberId}:`, error);
          
          // Update loading state for this member even on error
          setMemberLoadingStates(prev => ({
            ...prev,
            [memberId]: false
          }));
          
          return null;
        }
      });
      
      const memberData = (await Promise.all(memberPromises)).filter(Boolean) as CommunityMember[];
      
      // Sort members - creator first, then admins, then regular members
      memberData.sort((a, b) => {
        if (a.isCreator) return -1;
        if (b.isCreator) return 1;
        if (a.isAdmin && !b.isAdmin) return -1;
        if (!a.isAdmin && b.isAdmin) return 1;
        return a.name.localeCompare(b.name);
      });
      
      setMembers(memberData);
    } catch (error) {
      console.error('Error fetching community members:', error);
      Alert.alert('Hata', 'Üyeler yüklenirken bir sorun oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  // useEffect içinde çağırıyoruz
  useEffect(() => {
    fetchData();
  }, [communityId, user]);
  
  const makeAdmin = async (memberId: string) => {
    if (!user || !isAdmin) return;
    
    try {
      await communityService.makeAdmin(communityId, memberId, user.uid);
      
      // Update local state
      setMembers(prev => 
        prev.map(member => 
          member.id === memberId
            ? { ...member, isAdmin: true }
            : member
        )
      );
      
      Alert.alert('Başarılı', 'Kullanıcı yönetici olarak atandı.');
    } catch (error) {
      console.error('Error making user admin:', error);
      Alert.alert('Hata', 'İşlem sırasında bir sorun oluştu');
    }
  };
  
  const removeMember = async (memberId: string) => {
    if (!user || !isAdmin) return;
    
    // Topluluğun kurucusu kontrolü
    const memberToRemove = members.find(m => m.id === memberId);
    if (memberToRemove?.isCreator) {
      Alert.alert('Hata', 'Topluluğun kurucusu çıkarılamaz.');
      return;
    }
    
    // Confirm before removing
    Alert.alert(
      'Üyeyi Çıkar',
      'Bu üyeyi topluluktan çıkarmak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Çıkar',
          style: 'destructive',
          onPress: async () => {
            try {
              await communityService.removeMember(communityId, memberId, user.uid);
              
              // Update local state
              setMembers(prev => prev.filter(member => member.id !== memberId));
              
              // Update community data
              setCommunity(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  members: prev.members.filter((id: string) => id !== memberId),
                  admins: prev.admins.filter((id: string) => id !== memberId),
                  membersCount: prev.membersCount - 1
                };
              });
              
              Alert.alert('Başarılı', 'Üye topluluktan çıkarıldı.');
            } catch (error: any) {
              console.error('Error removing member:', error);
              Alert.alert('Hata', error.message || 'İşlem sırasında bir sorun oluştu');
            }
          }
        }
      ]
    );
  };
  
  const navigateToChat = (memberId: string, memberName: string) => {
    navigation.navigate('Chat', {
      conversationId: '',
      recipientId: memberId,
      recipientName: memberName,
      isCommunityChat: false
    });
  };

  const renderMemberAvatar = (member: CommunityMember) => {
    const isLoading = memberLoadingStates[member.id];
    
    if (isLoading) {
      return (
        <View style={[styles.avatar, styles.avatarLoading]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }
    
    if (member.avatar) {
      return (
        <Avatar.Image
          source={{ uri: member.avatar }}
          size={50}
          style={styles.avatar}
        />
      );
    }
    
    // Fallback to initial avatar if no photo URL
    const initials = member.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    
    return (
      <Avatar.Text
        label={initials}
        size={50}
        style={styles.avatar}
        labelStyle={styles.avatarText}
      />
    );
  };
  
  // Çoklu seçim fonksiyonları
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedMembers([]);
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const selectAllMembers = () => {
    // Kurucu dışındaki ve mevcut kullanıcı dışındaki tüm üyeleri seç
    const allMemberIds = members
      .filter(m => !m.isCreator && !m.isCurrentUser)
      .map(m => m.id);
    setSelectedMembers(allMemberIds);
  };

  const deselectAllMembers = () => {
    setSelectedMembers([]);
  };

  // Toplu üye ekleme fonksiyonu
  const showBulkAddDialog = () => {
    setBulkAddDialogVisible(true);
  };

  const hideBulkAddDialog = () => {
    setBulkAddDialogVisible(false);
    setMembersToAdd([]);
  };

  const addMultipleMembers = async () => {
    if (!user || !isAdmin || membersToAdd.length === 0) return;
    
    try {
      setIsProcessing(true);
      
      const result = await communityService.addMultipleMembers(
        communityId,
        membersToAdd,
        user.uid
      );
      
      if (result.success) {
        // Verileri yenile
        const communityData = await communityService.getCommunityById(communityId);
        if (communityData) {
          setCommunity(communityData);
          // Üye listesini yenile (fetchData fonksiyonunu çağır)
          await fetchData();
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
      setIsProcessing(false);
    }
  };

  // Toplu yönetici atama fonksiyonu
  const showBulkAdminDialog = () => {
    if (selectedMembers.length === 0) {
      Alert.alert('Uyarı', 'Lütfen önce yönetici yapmak istediğiniz üyeleri seçin');
      return;
    }
    setBulkAdminDialogVisible(true);
  };

  const hideBulkAdminDialog = () => {
    setBulkAdminDialogVisible(false);
  };

  const makeMultipleAdmins = async () => {
    if (!user || !isAdmin || selectedMembers.length === 0) return;
    
    try {
      setIsProcessing(true);
      
      const result = await communityService.makeMultipleAdmins(
        communityId,
        selectedMembers,
        user.uid
      );
      
      if (result.success) {
        // Verileri yenile
        const communityData = await communityService.getCommunityById(communityId);
        if (communityData) {
          setCommunity(communityData);
          // Üye listesini yenile
          await fetchData();
        }
        
        // Seçim modunu kapat
        setSelectionMode(false);
        setSelectedMembers([]);
        hideBulkAdminDialog();
        
        Alert.alert('Başarılı', result.message);
      } else {
        Alert.alert('Hata', result.message);
      }
    } catch (error) {
      console.error('Error making multiple admins:', error);
      Alert.alert('Hata', 'Yönetici ataması sırasında bir sorun oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeSelectedMembers = async () => {
    if (!user || !isAdmin || selectedMembers.length === 0) return;
    
    Alert.alert(
      'Üyeleri Çıkar',
      `Seçilen ${selectedMembers.length} üyeyi topluluktan çıkarmak istediğinizden emin misiniz?`,
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Çıkar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              
              // Her üye için tek tek remove işlemi yap
              for (const memberId of selectedMembers) {
                try {
                  await communityService.removeMember(communityId, memberId, user.uid);
                } catch (error) {
                  console.error(`Error removing member ${memberId}:`, error);
                }
              }
              
              // Verileri yenile
              const communityData = await communityService.getCommunityById(communityId);
              if (communityData) {
                setCommunity(communityData);
                await fetchData(); // Artık tanımlı olan fetchData'yı kullanabiliriz
              }
              
              // Seçim modunu kapat
              setSelectionMode(false);
              setSelectedMembers([]);
              
              Alert.alert('Başarılı', 'Seçilen üyeler topluluktan çıkarıldı.');
            } catch (error) {
              console.error('Error removing members:', error);
              Alert.alert('Hata', 'İşlem sırasında bir sorun oluştu');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  // Üye öğesini render et
  const renderMemberItem = ({ item }: { item: CommunityMember }) => (
    <TouchableOpacity
      style={styles.memberItem}
      onPress={() => selectionMode ? toggleMemberSelection(item.id) : null}
      disabled={item.isCreator || selectionMode && item.isCurrentUser}
    >
      <View style={styles.memberInfo}>
        {selectionMode && !item.isCreator && !item.isCurrentUser && (
          <Checkbox
            status={selectedMembers.includes(item.id) ? 'checked' : 'unchecked'}
            onPress={() => toggleMemberSelection(item.id)}
            style={styles.checkbox}
          />
        )}
        {renderMemberAvatar(item)}
        <View style={styles.nameContainer}>
          <Text style={styles.memberName}>
            {item.name}
            {item.isCurrentUser && <Text style={styles.currentUser}> (Sen)</Text>}
            {item.isCreator && <Text style={styles.creatorLabel}> (Kurucu)</Text>}
          </Text>
          {item.isAdmin && (
            <View style={styles.adminBadge}>
              <Crown size={12} color={colors.warning} />
              <Text style={styles.adminText}>Yönetici</Text>
            </View>
          )}
          {item.email && (
            <Text style={styles.memberEmail}>{item.email}</Text>
          )}
        </View>
      </View>
      
      {!selectionMode && (
        <View style={styles.actionsContainer}>
          {user?.uid !== item.id && (
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => navigateToChat(item.id, item.name)}
            >
              <MessageCircle size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          
          {isAdmin && user?.uid !== item.id && !item.isCreator && (
            <>
              {!item.isAdmin && (
                <TouchableOpacity
                  style={styles.adminButton}
                  onPress={() => makeAdmin(item.id)}
                >
                  <UserPlus size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeMember(item.id)}
              >
                <UserMinus size={20} color={colors.error} />
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {!selectionMode ? (
          <>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>
              {community?.name ? `${community.name} Üyeleri` : 'Topluluk Üyeleri'}
            </Text>
            
            {isAdmin && (
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={toggleSelectionMode}
              >
                <Check size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.backButton}
              onPress={toggleSelectionMode}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>
              {selectedMembers.length} üye seçildi
            </Text>
            
            <View style={styles.selectionActions}>
              {selectedMembers.length > 0 ? (
                <>
                  <IconButton
                    icon={() => <Shield size={24} color={colors.primary} />}
                    onPress={showBulkAdminDialog}
                  />
                  <IconButton
                    icon={() => <UserMinus size={24} color={colors.error} />}
                    onPress={removeSelectedMembers}
                  />
                </>
              ) : (
                <Text style={styles.placeholder}></Text>
              )}
            </View>
          </>
        )}
      </View>
      
      {!selectionMode ? (
        <Searchbar
          placeholder="Üye ara..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={colors.primary}
        />
      ) : (
        <View style={styles.selectionControlBar}>
          <Button onPress={selectAllMembers}>Tümünü Seç</Button>
          <Button onPress={deselectAllMembers}>Seçimi Kaldır</Button>
        </View>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Üyeler yükleniyor...</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statsIconContainer}>
              <Users size={16} color={colors.textSecondary} />
              <Text style={styles.statsText}>
                Toplam {members.length} üye, {members.filter(m => m.isAdmin || m.isCreator).length} yönetici
              </Text>
            </View>
          </View>
          
          <FlatList
            data={members.filter(member => 
              member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()))
            )}
            renderItem={renderMemberItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <Divider />}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'Arama kriterlerinize uygun üye bulunamadı'
                    : 'Bu toplulukta henüz üye bulunmuyor'}
                </Text>
              </View>
            )}
          />

          {/* Toplu Üye Ekleme Dialog */}
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
                disabled={membersToAdd.length === 0 || isProcessing}
                loading={isProcessing}
              >
                Ekle ({membersToAdd.length})
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* Toplu Yönetici Atama Dialog */}
          <Dialog visible={bulkAdminDialogVisible} onDismiss={hideBulkAdminDialog}>
            <Dialog.Title>Toplu Yönetici Atama</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.dialogText}>
                Seçilen {selectedMembers.length} üyeyi yönetici yapmak istediğinizden emin misiniz?
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={hideBulkAdminDialog}>İptal</Button>
              <Button 
                mode="contained"
                onPress={makeMultipleAdmins}
                disabled={isProcessing}
                loading={isProcessing}
              >
                Yönetici Yap
              </Button>
            </Dialog.Actions>
          </Dialog>
        </>
      )}

      {/* Yönetici FAB */}
      {isAdmin && !selectionMode && !loading && (
        <FAB
          style={styles.fab}
          icon={({ size, color }) => <Plus size={size} color={color} />}
          onPress={showBulkAddDialog}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchbar: {
    margin: spacing.md,
    elevation: 0,
    backgroundColor: colors.surface,
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
  statsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  statsIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  list: {
    flexGrow: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: spacing.md,
    backgroundColor: colors.surface,
  },
  avatarLoading: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.subtitle2,
    color: colors.primary,
  },
  nameContainer: {
    justifyContent: 'center',
    flex: 1,
  },
  memberName: {
    ...typography.subtitle1,
    color: colors.text,
  },
  currentUser: {
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  creatorLabel: {
    fontWeight: 'bold',
    color: colors.warning,
  },
  memberEmail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminText: {
    ...typography.caption,
    color: colors.warning,
    marginLeft: spacing.xxs,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  adminButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  removeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  checkbox: {
    marginRight: spacing.xs,
  },
  selectionButton: {
    padding: spacing.xs,
  },
  selectionActions: {
    flexDirection: 'row',
  },
  selectionControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dialogText: {
    marginBottom: spacing.md,
  },
  dialogInput: {
    marginTop: spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
}); 