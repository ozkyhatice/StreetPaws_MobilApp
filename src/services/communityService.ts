import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, arrayUnion, arrayRemove, Timestamp, orderBy, serverTimestamp, increment } from 'firebase/firestore';
import { Community, CommunityCategory } from '../types/community';
import { NotificationService } from './notificationService';
import { UserService } from './userService';

export class CommunityService {
  private static instance: CommunityService;
  private readonly communitiesCollection = 'communities';

  private constructor() {}

  public static getInstance(): CommunityService {
    if (!CommunityService.instance) {
      CommunityService.instance = new CommunityService();
    }
    return CommunityService.instance;
  }

  // Helper function to check if a user has admin privileges (either admin or creator)
  private isUserAdmin(community: any, userId: string): boolean {
    return community.admins.includes(userId) || community.createdBy === userId;
  }

  async createCommunity(communityData: Omit<Community, 'id' | 'createdAt' | 'membersCount'>): Promise<Community> {
    try {
      console.log('Creating community:', communityData.name);
      
      if (!communityData.name || !communityData.description || !communityData.category || !communityData.createdBy) {
        console.error('Missing required fields for community creation');
        throw new Error('Missing required fields for community');
      }
      
      // Add creator to members and admins automatically
      const members = Array.isArray(communityData.members) ? [...communityData.members] : [];
      if (!members.includes(communityData.createdBy)) {
        members.push(communityData.createdBy);
      }
      
      const admins = Array.isArray(communityData.admins) ? [...communityData.admins] : [];
      if (!admins.includes(communityData.createdBy)) {
        admins.push(communityData.createdBy);
      }
      
      const timestamp = Timestamp.now();
      
      // Create a clean community object, removing any undefined fields
      const newCommunityData: any = {
        name: communityData.name.trim(),
        description: communityData.description.trim(),
        category: communityData.category,
        createdBy: communityData.createdBy,
        members,
        admins,
        membersCount: members.length,
        isPublic: typeof communityData.isPublic === 'boolean' ? communityData.isPublic : true,
        createdAt: timestamp
      };
      
      console.log('Community base data:', newCommunityData);
      
      // Only add optional fields if they exist and are not undefined
      if (communityData.photoURL) {
        console.log('Adding photo URL:', communityData.photoURL);
        newCommunityData.photoURL = communityData.photoURL;
      }
      
      if (communityData.location && communityData.location.address) {
        console.log('Adding location:', communityData.location);
        newCommunityData.location = {
          latitude: communityData.location.latitude || 0,
          longitude: communityData.location.longitude || 0,
          address: communityData.location.address
        };
      }
      
      if (Array.isArray(communityData.tags) && communityData.tags.length > 0) {
        console.log('Adding tags:', communityData.tags);
        newCommunityData.tags = communityData.tags;
      } else {
        // Ensure tags is at least an empty array
        newCommunityData.tags = [];
      }
      
      if (Array.isArray(communityData.joinRequests) && communityData.joinRequests.length > 0) {
        console.log('Adding join requests:', communityData.joinRequests);
        newCommunityData.joinRequests = communityData.joinRequests;
      } else {
        // Ensure joinRequests is at least an empty array
        newCommunityData.joinRequests = [];
      }
      
      console.log('Final community data to save:', newCommunityData);
      
      try {
        const docRef = await addDoc(collection(db, this.communitiesCollection), newCommunityData);
        console.log('Community created with ID:', docRef.id);
        
        return {
          ...newCommunityData,
          id: docRef.id,
          createdAt: timestamp.toDate().toISOString()
        } as Community;
      } catch (saveError) {
        console.error('Error saving to Firestore:', saveError);
        throw saveError;
      }
    } catch (error) {
      console.error('Error creating community:', error);
      throw error;
    }
  }

  async getCommunities(options?: {
    category?: CommunityCategory;
    userId?: string;
    searchQuery?: string;
    onlyPublic?: boolean;
  }): Promise<Community[]> {
    try {
      console.log("getCommunities - Starting to fetch communities with options:", options);
      
      let communities: Community[] = [];
      
      // Simplify queries to avoid index requirements
      // First get all communities
      const communityCollection = collection(db, this.communitiesCollection);
      
      try {
        const snapshot = await getDocs(communityCollection);
        console.log(`getCommunities - Fetched ${snapshot.docs.length} communities from Firebase`);
        
        communities = snapshot.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate?.() 
            ? data.createdAt.toDate().toISOString() 
            : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString());
          
          return {
            id: doc.id,
            ...data,
            createdAt,
            // Ensure these fields always exist
            membersCount: data.membersCount || 0,
            members: data.members || [],
            admins: data.admins || [],
            tags: data.tags || [],
            isPublic: typeof data.isPublic === 'boolean' ? data.isPublic : true
          } as Community;
        });
      } catch (err) {
        console.error("Error in getDocs:", err);
        return [];
      }
      
      // Log before filtering
      console.log(`getCommunities - Before filtering: ${communities.length} communities`);
      
      // Then filter in memory instead of using complex Firebase queries
      const filteredCommunities = communities.filter(community => {
        // Safety check for null/undefined community
        if (!community) {
          console.warn("Found undefined or null community in results");
          return false;
        }
        
        try {
          // Skip deleted communities
          if (community.isDeleted === true) {
            return false;
          }
          
          // Filter by category if provided
          if (options?.category && community.category !== options.category) {
            return false;
          }
          
          // Filter by userId if provided (member of community)
          if (options?.userId && Array.isArray(community.members) && !community.members.includes(options.userId)) {
            return false;
          }
          
          // Filter by public status if needed
          if (options?.onlyPublic && community.isPublic === false) {
            return false;
          }
          
          // Apply text search filter if provided
          if (options?.searchQuery) {
            const searchTerm = options.searchQuery.toLowerCase();
            return (
              community.name.toLowerCase().includes(searchTerm) ||
              community.description.toLowerCase().includes(searchTerm) ||
              (Array.isArray(community.tags) && community.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
          }
          
          return true;
        } catch (filterError) {
          console.error("Error filtering community:", filterError, community);
          return false;
        }
      });
      
      console.log(`getCommunities - After filtering: ${filteredCommunities.length} communities`);
      return filteredCommunities;
    } catch (error) {
      console.error('Error getting communities:', error);
      return [];
    }
  }

  async getCommunityById(communityId: string): Promise<Community | null> {
    try {
      const docRef = doc(db, this.communitiesCollection, communityId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() 
          ? data.createdAt.toDate().toISOString() 
          : data.createdAt
      } as Community;
    } catch (error) {
      console.error('Error getting community:', error);
      return null;
    }
  }

  async joinCommunity(communityId: string, userId: string): Promise<void> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        throw new Error('Community not found');
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Check if it's a public community
      if (communityData.isPublic) {
        // User can join directly
        await updateDoc(communityRef, {
          members: arrayUnion(userId),
          membersCount: (communityData.membersCount || 0) + 1
        });
      } else {
        // Store the timestamp for the join request
        const timestamp = Timestamp.now();
        const joinRequestsTimestamps = { 
          ...(communityData.joinRequestsTimestamps || {}),
          [userId]: timestamp 
        };
        
        // Create a join request
        await updateDoc(communityRef, {
          joinRequests: arrayUnion(userId),
          joinRequestsTimestamps: joinRequestsTimestamps
        });
        
        // Send notification to community admins
        if (communityData.admins && communityData.admins.length > 0) {
          const userService = UserService.getInstance();
          const userData = await userService.getUserById(userId);
          const notificationService = NotificationService.getInstance();
          
          // Send notification to each admin
          for (const adminId of communityData.admins) {
            await notificationService.sendNotification({
              userId: adminId,
              title: 'Yeni Katılım İsteği',
              message: `${userData?.displayName || 'Bir kullanıcı'} "${communityData.name}" topluluğuna katılmak istiyor.`,
              type: 'info',
              data: { 
                communityId,
                userId,
                actionType: 'JOIN_REQUEST' 
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error joining community:', error);
      throw error;
    }
  }

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        throw new Error('Community not found');
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Remove user from members and potentially from admins
      await updateDoc(communityRef, {
        members: arrayRemove(userId),
        admins: arrayRemove(userId),
        membersCount: Math.max(0, (communityData.membersCount || 1) - 1)
      });
    } catch (error) {
      console.error('Error leaving community:', error);
      throw error;
    }
  }

  /**
   * Topluluk yöneticisinin bir üyeyi topluluktan çıkarmasını sağlar.
   * @param communityId Topluluk kimliği
   * @param memberId Çıkarılacak üyenin kimliği
   * @param adminId İşlemi yapan yöneticinin kimliği
   * @returns Promise<void>
   */
  async removeMember(communityId: string, memberId: string, adminId: string): Promise<void> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        throw new Error('Topluluk bulunamadı');
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Yönetici kontrolü
      if (!this.isUserAdmin(communityData, adminId)) {
        throw new Error('Bu işlemi yapmaya yetkiniz yok');
      }

      // Topluluğun kurucusu
      if (memberId === communityData.createdBy) {
        throw new Error('Topluluğun kurucusu çıkarılamaz');
      }
      
      // Üyeyi ve varsa yöneticilik rolünü kaldır
      await updateDoc(communityRef, {
        members: arrayRemove(memberId),
        admins: arrayRemove(memberId),
        membersCount: Math.max(0, (communityData.membersCount || 1) - 1)
      });
      
      console.log(`Üye ${memberId}, yönetici ${adminId} tarafından topluluktaın çıkarıldı: ${communityId}`);
    } catch (error) {
      console.error('Üye çıkarılırken hata oluştu:', error);
      throw error;
    }
  }

  async approveJoinRequest(communityId: string, userId: string, adminId: string): Promise<void> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        throw new Error('Community not found');
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Check if adminId is actually an admin
      if (!this.isUserAdmin(communityData, adminId)) {
        throw new Error('Only admins can approve join requests');
      }
      
      // Check if userId is in joinRequests
      if (!communityData.joinRequests?.includes(userId)) {
        throw new Error('No join request found for this user');
      }
      
      // Remove timestamp from joinRequestsTimestamps
      const joinRequestsTimestamps = { ...communityData.joinRequestsTimestamps };
      if (joinRequestsTimestamps && joinRequestsTimestamps[userId]) {
        delete joinRequestsTimestamps[userId];
      }
      
      // Add to members, remove from join requests
      await updateDoc(communityRef, {
        members: arrayUnion(userId),
        joinRequests: arrayRemove(userId),
        joinRequestsTimestamps: joinRequestsTimestamps,
        membersCount: (communityData.membersCount || 0) + 1
      });
      
      // Send notification to user
      const notificationService = NotificationService.getInstance();
      const userService = UserService.getInstance();
      const adminData = await userService.getUserById(adminId);
      
      await notificationService.sendNotification({
        userId: userId,
        title: 'Katılım İsteği Onaylandı',
        message: `"${communityData.name}" topluluğuna katılım isteğiniz onaylandı.`,
        type: 'success',
        data: { 
          communityId,
          actionType: 'JOIN_REQUEST_APPROVED' 
        }
      });
    } catch (error) {
      console.error('Error approving join request:', error);
      throw error;
    }
  }

  /**
   * Kullanıcıyı yönetici yapar
   * @param communityId Topluluk kimliği
   * @param userId Yönetici yapılacak kullanıcı kimliği
   * @param currentAdminId İşlemi yapan mevcut yönetici kimliği
   */
  async makeAdmin(communityId: string, userId: string, currentAdminId: string): Promise<void> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) throw new Error('Topluluk bulunamadı');
      
      const communityData = communitySnap.data() as Community;
      
      // Kullanıcının yönetici veya kurucu olup olmadığını kontrol et
      if (!this.isUserAdmin(communityData, currentAdminId)) {
        throw new Error('Bu işlemi yapmaya yetkiniz yok');
      }
      
      // Kullanıcı zaten yönetici mi kontrol et
      if (communityData.admins.includes(userId)) {
        throw new Error('Bu kullanıcı zaten yönetici');
      }
      
      // Kullanıcı topluluk üyesi mi kontrol et
      if (!communityData.members.includes(userId)) {
        throw new Error('Kullanıcı topluluk üyesi değil');
      }
      
      // Kullanıcıyı yönetici yap
      await updateDoc(communityRef, {
        admins: arrayUnion(userId)
      });
      
      console.log(`Kullanıcı ${userId} topluluğun yöneticisi yapıldı: ${communityId}`);
    } catch (error: any) {
      console.error('Kullanıcı yönetici yapılırken hata oluştu:', error);
      throw error;
    }
  }

  async updateCommunity(communityId: string, updates: Partial<Community>, adminId: string): Promise<void> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        throw new Error('Community not found');
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Check if adminId is an admin
      if (!this.isUserAdmin(communityData, adminId)) {
        throw new Error('Only admins can update community information');
      }
      
      // Prevent updating critical fields
      const { id, createdAt, createdBy, members, admins, membersCount, ...allowedUpdates } = updates;
      
      await updateDoc(communityRef, {
        ...allowedUpdates
      });
    } catch (error) {
      console.error('Error updating community:', error);
      throw error;
    }
  }

  async updateCommunityLastMessage(
    communityId: string, 
    lastMessage: { 
      content: string; 
      senderId: string; 
      senderName?: string; 
      createdAt: any 
    },
    unreadMessages?: { [userId: string]: number }
  ): Promise<void> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      
      const updateData: any = {
        lastMessage: {
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          senderName: lastMessage.senderName || 'Unknown User',
          createdAt: lastMessage.createdAt
        },
        lastActivity: lastMessage.createdAt
      };
      
      // Update unread message counts if provided
      if (unreadMessages) {
        updateData.unreadMessages = unreadMessages;
      }
      
      await updateDoc(communityRef, updateData);
    } catch (error) {
      console.error('Error updating community last message:', error);
      throw error;
    }
  }

  /**
   * E-posta adresi ile kullanıcı davet eder
   */
  async inviteUserByEmail(communityId: string, userEmail: string, adminId: string): Promise<{success: boolean, message: string}> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        return { success: false, message: 'Topluluk bulunamadı' };
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Yönetici kontrolü
      if (!this.isUserAdmin(communityData, adminId)) {
        return { success: false, message: 'Bu işlemi yapmaya yetkiniz yok' };
      }

      // Kullanıcıyı e-posta adresine göre bul
      const userService = await import('./userService').then(m => m.UserService.getInstance());
      const user = await userService.getUserByEmail(userEmail);
      
      if (!user) {
        return { success: false, message: 'Bu e-posta adresine sahip kullanıcı bulunamadı' };
      }
      
      // Kullanıcı zaten üye mi kontrol et
      if (communityData.members.includes(user.uid)) {
        return { success: false, message: 'Bu kullanıcı zaten topluluk üyesi' };
      }
      
      // Kullanıcının davet istekleri koleksiyonuna ekle
      // Gerçek uygulamada e-posta davetiyesi gönderme veya bildirim oluşturma eklenebilir
      await updateDoc(communityRef, {
        members: arrayUnion(user.uid),
        membersCount: increment(1)
      });
      
      console.log(`Kullanıcı ${user.uid} topluluğa davet edildi: ${communityId}`);
      return { success: true, message: 'Kullanıcı topluluğa başarıyla eklendi' };
    } catch (error) {
      console.error('Kullanıcı davet edilirken hata oluştu:', error);
      return { success: false, message: 'İşlem sırasında bir hata oluştu' };
    }
  }
  
  /**
   * Topluluğu kapatır/siler
   */
  async deleteCommunity(communityId: string, adminId: string): Promise<{success: boolean, message: string}> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        return { success: false, message: 'Topluluk bulunamadı' };
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Sadece topluluğun kurucusu (createdBy) topluluğu silebilir
      if (communityData.createdBy !== adminId) {
        return { success: false, message: 'Sadece topluluğun kurucusu topluluğu kapatabilir' };
      }
      
      // Topluluğu sil
      await updateDoc(communityRef, {
        isDeleted: true, 
        deletedAt: Timestamp.now(),
        deletedBy: adminId
      });
      
      console.log(`Topluluk ${communityId} kullanıcı ${adminId} tarafından silindi`);
      return { success: true, message: 'Topluluk başarıyla kapatıldı' };
    } catch (error) {
      console.error('Topluluk silinirken hata oluştu:', error);
      return { success: false, message: 'İşlem sırasında bir hata oluştu' };
    }
  }
  
  /**
   * Topluluğun ismini, açıklamasını ve ayarlarını değiştirmek için
   * @param communityId Topluluk kimliği
   * @param updates Güncellenecek alanlar
   * @param adminId İşlemi yapan yönetici kimliği
   * @returns Promise<{success: boolean, message: string}>
   */
  async updateCommunitySettings(
    communityId: string, 
    updates: { 
      name?: string; 
      description?: string; 
      isPublic?: boolean;
      tags?: string[];
      location?: {
        latitude: number;
        longitude: number;
        address: string;
      }
    }, 
    adminId: string
  ): Promise<{success: boolean, message: string}> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        return { success: false, message: 'Topluluk bulunamadı' };
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Yönetici kontrolü
      if (!this.isUserAdmin(communityData, adminId)) {
        return { success: false, message: 'Bu işlemi yapmaya yetkiniz yok' };
      }
      
      // Güncellenecek alanları doğrula
      const validUpdates: any = {};
      
      if (updates.name && updates.name.trim() !== '') {
        validUpdates.name = updates.name.trim();
      }
      
      if (updates.description && updates.description.trim() !== '') {
        validUpdates.description = updates.description.trim();
      }
      
      if (typeof updates.isPublic === 'boolean') {
        validUpdates.isPublic = updates.isPublic;
      }
      
      if (Array.isArray(updates.tags)) {
        validUpdates.tags = updates.tags;
      }
      
      if (updates.location && updates.location.address) {
        validUpdates.location = updates.location;
      }
      
      if (Object.keys(validUpdates).length === 0) {
        return { success: false, message: 'Güncellenecek geçerli alan bulunamadı' };
      }
      
      // Topluluğu güncelle
      await updateDoc(communityRef, {
        ...validUpdates,
        updatedAt: Timestamp.now(),
        updatedBy: adminId
      });
      
      console.log(`Topluluk ${communityId} kullanıcı ${adminId} tarafından güncellendi`);
      return { success: true, message: 'Topluluk ayarları başarıyla güncellendi' };
    } catch (error) {
      console.error('Topluluk güncellenirken hata oluştu:', error);
      return { success: false, message: 'İşlem sırasında bir hata oluştu' };
    }
  }
  
  /**
   * Topluluk mesaj izinlerini düzenler (kim mesaj gönderebilir)
   */
  async updateMessagePermissions(
    communityId: string,
    settings: {
      onlyAdminsCanPost?: boolean;
      approvalRequired?: boolean;
    },
    adminId: string
  ): Promise<{success: boolean, message: string}> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        return { success: false, message: 'Topluluk bulunamadı' };
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Yönetici kontrolü
      if (!this.isUserAdmin(communityData, adminId)) {
        return { success: false, message: 'Bu işlemi yapmaya yetkiniz yok' };
      }
      
      // Mesaj izinlerini güncelle
      await updateDoc(communityRef, {
        messagePermissions: {
          onlyAdminsCanPost: settings.onlyAdminsCanPost || false,
          approvalRequired: settings.approvalRequired || false,
          updatedAt: Timestamp.now(),
          updatedBy: adminId
        }
      });
      
      console.log(`Topluluk ${communityId} mesaj izinleri güncellendi`);
      return { success: true, message: 'Mesaj izinleri başarıyla güncellendi' };
    } catch (error) {
      console.error('Mesaj izinleri güncellenirken hata oluştu:', error);
      return { success: false, message: 'İşlem sırasında bir hata oluştu' };
    }
  }

  /**
   * Yöneticilik rolünü kaldırır
   */
  async removeAdmin(communityId: string, memberToRemoveId: string, adminId: string): Promise<{success: boolean, message: string}> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        return { success: false, message: 'Topluluk bulunamadı' };
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Sadece creator veya mevcut adminler diğer adminleri kaldırabilir
      if (!this.isUserAdmin(communityData, adminId)) {
        return { success: false, message: 'Bu işlemi yapmaya yetkiniz yok' };
      }
      
      // Creator rolünü kaldıramazsın
      if (memberToRemoveId === communityData.createdBy) {
        return { success: false, message: 'Topluluğun kurucusunun yöneticilik rolü kaldırılamaz' };
      }
      
      // Kendinizi admin rolünden çıkarıyorsanız, creatordan başka admin kalmadığında izin verme
      if (memberToRemoveId === adminId && 
          communityData.admins.filter(id => id !== adminId && id !== communityData.createdBy).length === 0) {
        return { success: false, message: 'En az bir yönetici olmalıdır' };
      }
      
      await updateDoc(communityRef, {
        admins: arrayRemove(memberToRemoveId),
        adminUpdates: arrayUnion({
          action: 'ADMIN_REMOVED',
          memberId: memberToRemoveId,
          byAdmin: adminId,
          timestamp: Timestamp.now()
        })
      });
      
      return { success: true, message: 'Yöneticilik rolü başarıyla kaldırıldı' };
    } catch (error) {
      console.error('Yöneticilik rolü kaldırılırken hata oluştu:', error);
      return { success: false, message: 'İşlem sırasında bir hata oluştu' };
    }
  }

  /**
   * Üyeyi engeller/yasaklar
   */
  async banMember(communityId: string, memberToBanId: string, adminId: string, reason?: string): Promise<{success: boolean, message: string}> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        return { success: false, message: 'Topluluk bulunamadı' };
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Yönetici kontrolü
      if (!this.isUserAdmin(communityData, adminId)) {
        return { success: false, message: 'Bu işlemi yapmaya yetkiniz yok' };
      }
      
      // Kurucu yasaklanamaz
      if (memberToBanId === communityData.createdBy) {
        return { success: false, message: 'Topluluğun kurucusu yasaklanamaz' };
      }
      
      // Admin, başka bir admini yasaklayamaz (sadece creator yapabilir)
      if (communityData.admins.includes(memberToBanId) && adminId !== communityData.createdBy) {
        return { success: false, message: 'Yöneticileri sadece topluluk kurucusu yasaklayabilir' };
      }
      
      // Üyelikten çıkar
      await updateDoc(communityRef, {
        members: arrayRemove(memberToBanId),
        admins: arrayRemove(memberToBanId),
        bannedMembers: arrayUnion({
          userId: memberToBanId,
          bannedBy: adminId,
          bannedAt: Timestamp.now(),
          reason: reason || 'Belirtilmedi'
        }),
        membersCount: Math.max(0, (communityData.membersCount || 1) - 1)
      });
      
      return { success: true, message: 'Üye topluluktan yasaklandı' };
    } catch (error) {
      console.error('Üye yasaklanırken hata oluştu:', error);
      return { success: false, message: 'İşlem sırasında bir hata oluştu' };
    }
  }

  /**
   * Üyenin yasağını kaldırır
   */
  async unbanMember(communityId: string, memberToUnbanId: string, adminId: string): Promise<{success: boolean, message: string}> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        return { success: false, message: 'Topluluk bulunamadı' };
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Yönetici kontrolü
      if (!this.isUserAdmin(communityData, adminId)) {
        return { success: false, message: 'Bu işlemi yapmaya yetkiniz yok' };
      }
      
      // Yasağı kaldır
      // Firestore'da nested arrayRemove kullanımı karmaşık olduğundan,
      // tüm banned listesini al, filtreleyip tekrar yaz
      const bannedMembers = communityData.bannedMembers || [];
      const updatedBannedMembers = bannedMembers.filter(
        (banned: any) => banned.userId !== memberToUnbanId
      );
      
      await updateDoc(communityRef, {
        bannedMembers: updatedBannedMembers
      });
      
      return { success: true, message: 'Üyenin yasağı kaldırıldı' };
    } catch (error) {
      console.error('Üye yasağı kaldırılırken hata oluştu:', error);
      return { success: false, message: 'İşlem sırasında bir hata oluştu' };
    }
  }

  /**
   * Üyeyi geçici olarak susturur
   */
  async muteMember(
    communityId: string,
    memberToMuteId: string,
    adminId: string,
    duration: number, // Susturma süresi (dakika)
    reason?: string
  ): Promise<{success: boolean, message: string}> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        return { success: false, message: 'Topluluk bulunamadı' };
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Yönetici kontrolü
      if (!this.isUserAdmin(communityData, adminId)) {
        return { success: false, message: 'Bu işlemi yapmaya yetkiniz yok' };
      }
      
      // Kurucu susturulamaz
      if (memberToMuteId === communityData.createdBy) {
        return { success: false, message: 'Topluluğun kurucusu susturulamaz' };
      }
      
      // Admin, başka bir admini susturamaz (sadece creator yapabilir)
      if (communityData.admins.includes(memberToMuteId) && adminId !== communityData.createdBy) {
        return { success: false, message: 'Yöneticileri sadece topluluk kurucusu susturabilir' };
      }
      
      // Geçerli bir süre olmalı
      if (!duration || duration <= 0) {
        return { success: false, message: 'Geçerli bir susturma süresi belirtmelisiniz' };
      }
      
      // Susturma bitiş zamanını hesapla
      const now = new Date();
      const muteEndTime = new Date(now.getTime() + duration * 60000); // dakika -> milisaniye
      
      await updateDoc(communityRef, {
        mutedMembers: arrayUnion({
          userId: memberToMuteId,
          mutedBy: adminId,
          mutedAt: Timestamp.now(),
          muteEndTime: Timestamp.fromDate(muteEndTime),
          reason: reason || 'Belirtilmedi'
        })
      });
      
      return { success: true, message: `Üye ${duration} dakika boyunca susturuldu` };
    } catch (error) {
      console.error('Üye susturulurken hata oluştu:', error);
      return { success: false, message: 'İşlem sırasında bir hata oluştu' };
    }
  }

  /**
   * Üyenin susturmasını kaldırır
   */
  async unmuteMember(communityId: string, memberToUnmuteId: string, adminId: string): Promise<{success: boolean, message: string}> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        return { success: false, message: 'Topluluk bulunamadı' };
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Yönetici kontrolü
      if (!this.isUserAdmin(communityData, adminId)) {
        return { success: false, message: 'Bu işlemi yapmaya yetkiniz yok' };
      }
      
      // Susturmayı kaldır (nested arrayRemove için)
      const mutedMembers = communityData.mutedMembers || [];
      const updatedMutedMembers = mutedMembers.filter(
        (muted: any) => muted.userId !== memberToUnmuteId
      );
      
      await updateDoc(communityRef, {
        mutedMembers: updatedMutedMembers
      });
      
      return { success: true, message: 'Üyenin susturması kaldırıldı' };
    } catch (error) {
      console.error('Üye susturması kaldırılırken hata oluştu:', error);
      return { success: false, message: 'İşlem sırasında bir hata oluştu' };
    }
  }

  /**
   * Topluluk ayarlarını tamamen günceller (WhatsApp ve Telegram benzeri)
   */
  async updateAdvancedSettings(
    communityId: string,
    settings: {
      onlyAdminsCanChangeName?: boolean;
      onlyAdminsCanChangeDescription?: boolean;
      onlyAdminsCanChangePhoto?: boolean;
      slowMode?: boolean;
      slowModeInterval?: number; // Saniye cinsinden mesaj gönderme aralığı
      membersCanAddMembers?: boolean;
      approveNewMembers?: boolean;
      showMemberList?: boolean;
      autoDeleteMessages?: boolean;
      autoDeleteAfter?: number; // Gün cinsinden
    },
    adminId: string
  ): Promise<{success: boolean, message: string}> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        return { success: false, message: 'Topluluk bulunamadı' };
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Yönetici kontrolü
      if (!this.isUserAdmin(communityData, adminId)) {
        return { success: false, message: 'Bu işlemi yapmaya yetkiniz yok' };
      }
      
      // Ayarları güncelle
      await updateDoc(communityRef, {
        advancedSettings: {
          ...settings,
          updatedAt: Timestamp.now(),
          updatedBy: adminId
        }
      });
      
      return { success: true, message: 'Topluluk gelişmiş ayarları güncellendi' };
    } catch (error) {
      console.error('Gelişmiş ayarlar güncellenirken hata oluştu:', error);
      return { success: false, message: 'İşlem sırasında bir hata oluştu' };
    }
  }

  /**
   * Toplu üye ekleme işlemi
   */
  async addMultipleMembers(
    communityId: string, 
    memberIds: string[], 
    adminId: string
  ): Promise<{success: boolean, message: string, addedCount: number, failedCount: number}> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        return { success: false, message: 'Topluluk bulunamadı', addedCount: 0, failedCount: memberIds.length };
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Yönetici kontrolü
      if (!this.isUserAdmin(communityData, adminId)) {
        return { success: false, message: 'Bu işlemi yapmaya yetkiniz yok', addedCount: 0, failedCount: memberIds.length };
      }
      
      // Mevcut üyeleri çıkart
      const newMembers = memberIds.filter(id => !communityData.members.includes(id));
      
      if (newMembers.length === 0) {
        return { success: false, message: 'Eklenecek yeni üye bulunamadı', addedCount: 0, failedCount: 0 };
      }
      
      // Yeni üyeleri ekle
      const currentMembers = communityData.members || [];
      await updateDoc(communityRef, {
        members: [...currentMembers, ...newMembers],
        membersCount: (communityData.membersCount || 0) + newMembers.length,
        memberUpdates: arrayUnion({
          action: 'MEMBERS_ADDED',
          memberIds: newMembers,
          byAdmin: adminId,
          timestamp: Timestamp.now()
        })
      });
      
      return { 
        success: true, 
        message: `${newMembers.length} yeni üye eklendi`, 
        addedCount: newMembers.length, 
        failedCount: memberIds.length - newMembers.length 
      };
    } catch (error) {
      console.error('Toplu üye eklerken hata oluştu:', error);
      return { success: false, message: 'İşlem sırasında bir hata oluştu', addedCount: 0, failedCount: memberIds.length };
    }
  }

  /**
   * Birden fazla üyeyi aynı anda yönetici yapar
   */
  async makeMultipleAdmins(
    communityId: string, 
    memberIds: string[], 
    adminId: string
  ): Promise<{success: boolean, message: string, addedCount: number, failedCount: number}> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        return { success: false, message: 'Topluluk bulunamadı', addedCount: 0, failedCount: memberIds.length };
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Yönetici kontrolü
      if (!this.isUserAdmin(communityData, adminId)) {
        return { success: false, message: 'Bu işlemi yapmaya yetkiniz yok', addedCount: 0, failedCount: memberIds.length };
      }
      
      // Sadece topluluk üyesi olanları ve henüz yönetici olmayanları filtrele
      const validMemberIds = memberIds.filter(id => 
        communityData.members.includes(id) && 
        !communityData.admins.includes(id)
      );
      
      if (validMemberIds.length === 0) {
        return { success: false, message: 'Yönetici yapılacak geçerli üye bulunamadı', addedCount: 0, failedCount: memberIds.length };
      }
      
      // Yönetici listesini güncelle
      const updatedAdmins = [...new Set([...communityData.admins, ...validMemberIds])];
      
      await updateDoc(communityRef, {
        admins: updatedAdmins,
        memberUpdates: arrayUnion({
          action: 'ADMIN_ADDED',
          memberIds: validMemberIds,
          byAdmin: adminId,
          timestamp: Timestamp.now()
        })
      });
      
      return { 
        success: true, 
        message: `${validMemberIds.length} üye yönetici yapıldı`, 
        addedCount: validMemberIds.length, 
        failedCount: memberIds.length - validMemberIds.length 
      };
    } catch (error) {
      console.error('Toplu yönetici atama sırasında hata oluştu:', error);
      return { success: false, message: 'İşlem sırasında bir hata oluştu', addedCount: 0, failedCount: memberIds.length };
    }
  }

  /**
   * Topluluk için davet bağlantısı oluşturur veya var olan bağlantıyı getirir
   * @param communityId Topluluk ID'si
   * @param expireHours Davet kodunun geçerlilik süresi (saat olarak, 0=sınırsız)
   * @param usageLimit Davet kodunun kullanım limiti (0=sınırsız)
   * @returns Topluluk için bağlantı kodu ve tam URL
   */
  async generateInviteLink(
    communityId: string, 
    expireHours: number = 0, 
    usageLimit: number = 0
  ): Promise<{inviteCode: string, inviteLink: string, webLink: string}> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        throw new Error('Topluluk bulunamadı');
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Eğer zaten bir davet kodu varsa ve hala geçerliyse, onu kullan
      if (communityData.inviteCode && this.isInviteCodeValid(communityData)) {
        return {
          inviteCode: communityData.inviteCode,
          inviteLink: `comunity://invite/${communityData.inviteCode}`,
          webLink: `https://app.domain.com/invite/${communityData.inviteCode}`
        };
      }
      
      // Yeni benzersiz bir davet kodu oluştur
      const codeChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let inviteCode = '';
      for (let i = 0; i < 8; i++) {
        inviteCode += codeChars.charAt(Math.floor(Math.random() * codeChars.length));
      }
      
      // Süre sınırı varsa, son geçerlilik tarihini hesapla
      let expiry = null;
      if (expireHours > 0) {
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + expireHours);
        expiry = Timestamp.fromDate(expiryDate);
      }
      
      // Davet kodunu topluluğa kaydet
      await updateDoc(communityRef, {
        inviteCode: inviteCode,
        inviteCodeExpiry: expiry,
        inviteCodeUsageLimit: usageLimit,
        inviteCodeUsageCount: 0
      });
      
      // Web URL ve derin bağlantı formatında davet linki oluştur
      const inviteLink = `comunity://invite/${inviteCode}`;
      const webLink = `https://app.domain.com/invite/${inviteCode}`;
      
      return { inviteCode, inviteLink, webLink };
    } catch (error) {
      console.error('Davet bağlantısı oluşturulurken hata oluştu:', error);
      throw error;
    }
  }

  /**
   * Bir topluluk için davet kodunun geçerli olup olmadığını kontrol eder
   * @param community - Topluluk verisi
   * @returns Davet kodunun geçerli olup olmadığı
   */
  private isInviteCodeValid(community: Community): boolean {
    // Davet kodu yoksa geçersiz
    if (!community.inviteCode) return false;
    
    // Süre kontrolü
    if (community.inviteCodeExpiry) {
      const now = new Date();
      const expiry = community.inviteCodeExpiry.toDate ? 
        community.inviteCodeExpiry.toDate() : 
        new Date(community.inviteCodeExpiry);
      
      if (now > expiry) return false;
    }
    
    // Kullanım limiti kontrolü
    if (community.inviteCodeUsageLimit && community.inviteCodeUsageCount) {
      if (community.inviteCodeUsageLimit > 0 && 
          community.inviteCodeUsageCount >= community.inviteCodeUsageLimit) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Davet kodu ile topluluğa katılır
   * @param inviteCode Topluluk davet kodu
   * @param userId Katılacak kullanıcı ID'si
   * @returns Başarı durumu ve mesaj
   */
  async joinCommunityByInviteCode(inviteCode: string, userId: string): Promise<{success: boolean, message: string, communityId?: string}> {
    try {
      // Önce davet kodunu doğrula
      const communityId = await this.validateInviteCode(inviteCode);
      
      if (!communityId) {
        return { success: false, message: 'Geçersiz davet kodu veya topluluk bulunamadı' };
      }
      
      // Topluluğu kontrol et
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        return { success: false, message: 'Topluluk bulunamadı' };
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Davet kodunun geçerliliğini kontrol et
      if (!this.isInviteCodeValid(communityData)) {
        return { success: false, message: 'Bu davet kodunun süresi dolmuş veya kullanım limiti aşılmış' };
      }
      
      // Kullanıcı zaten üye mi kontrol et
      if (communityData.members.includes(userId)) {
        return { success: false, message: 'Zaten bu topluluğun üyesisiniz', communityId };
      }
      
      // Kullanıcı yasaklı mı kontrol et
      const bannedMembers = communityData.bannedMembers || [];
      const isBanned = bannedMembers.some((banned: any) => banned.userId === userId);
      
      if (isBanned) {
        return { success: false, message: 'Bu topluluktan yasaklandınız' };
      }
      
      // Topluluğa katılma işlemi
      await updateDoc(communityRef, {
        members: arrayUnion(userId),
        membersCount: increment(1),
        inviteCodeUsageCount: increment(1)
      });
      
      return { 
        success: true, 
        message: 'Topluluğa başarıyla katıldınız', 
        communityId 
      };
    } catch (error) {
      console.error('Davet kodu ile katılırken hata oluştu:', error);
      return { success: false, message: 'İşlem sırasında bir hata oluştu' };
    }
  }

  /**
   * Davet kodunu doğrular ve ilgili topluluğun ID'sini döndürür
   * @param inviteCode Topluluk davet kodu
   * @returns Topluluk ID'si veya null
   */
  async validateInviteCode(inviteCode: string): Promise<string | null> {
    try {
      // Davet koduna göre topluluğu bul
      const communitiesRef = collection(db, this.communitiesCollection);
      const q = query(communitiesRef, where('inviteCode', '==', inviteCode));
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      // İlk eşleşen topluluğun ID'sini döndür
      return querySnapshot.docs[0].id;
    } catch (error) {
      console.error('Davet kodu doğrulanırken hata oluştu:', error);
      return null;
    }
  }

  /**
   * Topluluk davet kodunu sıfırlar
   * @param communityId Topluluk ID'si
   * @param adminId İşlemi yapan yönetici ID'si
   * @param expireHours Davet kodunun geçerlilik süresi (saat olarak, 0=sınırsız)
   * @param usageLimit Davet kodunun kullanım limiti (0=sınırsız)
   * @returns Başarı durumu ve mesaj
   */
  async resetInviteLink(
    communityId: string, 
    adminId: string,
    expireHours: number = 0,
    usageLimit: number = 0
  ): Promise<{success: boolean, message: string, inviteCode?: string, inviteLink?: string, webLink?: string}> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        return { success: false, message: 'Topluluk bulunamadı' };
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Yönetici kontrolü
      if (!this.isUserAdmin(communityData, adminId)) {
        return { success: false, message: 'Bu işlemi yapmaya yetkiniz yok' };
      }
      
      // Yeni davet bağlantısı oluştur
      const linkData = await this.generateInviteLink(communityId, expireHours, usageLimit);
      
      return { 
        success: true, 
        message: 'Davet bağlantısı başarıyla sıfırlandı',
        inviteCode: linkData.inviteCode,
        inviteLink: linkData.inviteLink,
        webLink: linkData.webLink
      };
    } catch (error) {
      console.error('Davet bağlantısı sıfırlanırken hata oluştu:', error);
      return { success: false, message: 'İşlem sırasında bir hata oluştu' };
    }
  }

  /**
   * Kullanıcı adına göre kullanıcıyı topluluk davet bağlantısıyla davet eder
   * @param communityId Topluluk ID'si
   * @param username Davet edilecek kullanıcı adı
   * @param adminId İşlemi yapan yönetici ID'si
   * @param expireHours Davet kodunun geçerlilik süresi (saat olarak, 0=sınırsız)
   * @param usageLimit Davet kodunun kullanım limiti (0=sınırsız)
   * @returns Başarı durumu ve mesaj
   */
  async inviteUserByUsername(
    communityId: string,
    username: string,
    adminId: string,
    expireHours: number = 72, // Varsayılan 3 gün
    usageLimit: number = 1 // Varsayılan tek kullanımlık
  ): Promise<{success: boolean, message: string, inviteCode?: string, inviteLink?: string, webLink?: string}> {
    try {
      // Topluluk bilgilerini kontrol et
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        return { success: false, message: 'Topluluk bulunamadı' };
      }
      
      // Yönetici yetkisini kontrol et
      const communityData = communitySnap.data() as Community;
      if (!this.isUserAdmin(communityData, adminId)) {
        return { success: false, message: 'Bu işlemi yapmaya yetkiniz yok' };
      }
      
      // Kullanıcıyı adına göre bul
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: false, message: 'Bu kullanıcı adıyla kayıtlı kullanıcı bulunamadı' };
      }
      
      const userData = querySnapshot.docs[0].data();
      const userId = querySnapshot.docs[0].id;
      
      // Kullanıcı zaten topluluk üyesi mi kontrol et
      if (communityData.members.includes(userId)) {
        return { success: false, message: 'Bu kullanıcı zaten topluluğun üyesi' };
      }
      
      // Kullanıcı yasaklı mı kontrol et
      const bannedMembers = communityData.bannedMembers || [];
      const isBanned = bannedMembers.some((banned: any) => banned.userId === userId);
      
      if (isBanned) {
        return { success: false, message: 'Bu kullanıcı topluluktan yasaklanmış' };
      }
      
      // Davet bağlantısı oluştur - özelleştirilmiş davet kodu (süreli ve tek kullanımlık)
      const linkData = await this.generateInviteLink(communityId, expireHours, usageLimit);
      
      // Admin kullanıcı bilgilerini al
      const adminUserRef = doc(db, 'users', adminId);
      const adminUserSnap = await getDoc(adminUserRef);
      const adminName = adminUserSnap.exists() 
        ? adminUserSnap.data().displayName || 'Bir yönetici'
        : 'Bir yönetici';
      
      // Kullanıcıya bildirim gönder
      const notificationService = NotificationService.getInstance();
      await notificationService.sendInvitationNotification(
        userId,
        adminName,
        communityData.name,
        linkData.inviteCode
      );
      
      // Davet süresi bilgisi
      let expiryInfo = '';
      if (expireHours > 0) {
        expiryInfo = ` (${expireHours} saat geçerli)`;
      }
      
      return { 
        success: true, 
        message: `${username} kullanıcısına özel davet bağlantısı oluşturuldu ve bildirim gönderildi${expiryInfo}`,
        inviteCode: linkData.inviteCode,
        inviteLink: linkData.inviteLink,
        webLink: linkData.webLink
      };
    } catch (error) {
      console.error('Kullanıcı davet edilirken hata oluştu:', error);
      return { success: false, message: 'İşlem sırasında bir hata oluştu' };
    }
  }

  /**
   * Yönetici olduğu toplulukların katılım isteklerini getirir
   * @param adminId Yönetici ID'si
   * @returns Katılım istekleri
   */
  async getJoinRequestsForAdmin(adminId: string): Promise<any[]> {
    try {
      // Kullanıcının yönetici olduğu toplulukları bul
      const communitiesRef = collection(db, this.communitiesCollection);
      const q = query(
        communitiesRef,
        where('admins', 'array-contains', adminId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return [];
      }
      
      const requests: any[] = [];
      const userService = UserService.getInstance();
      
      // Her topluluktaki katılım isteklerini kontrol et
      for (const doc of querySnapshot.docs) {
        const communityData = doc.data() as Community;
        
        // Katılım istekleri varsa
        if (communityData.joinRequests && communityData.joinRequests.length > 0) {
          for (const userId of communityData.joinRequests) {
            // Kullanıcı bilgilerini getir
            const userData = await userService.getUserById(userId);
            
            if (userData) {
              requests.push({
                communityId: doc.id,
                communityName: communityData.name,
                communityPhotoURL: communityData.photoURL,
                userId: userId,
                userName: userData.displayName || userData.username || 'Kullanıcı',
                userPhotoURL: userData.photoURL,
                timestamp: communityData.joinRequestsTimestamps?.[userId] || new Date(),
              });
            }
          }
        }
      }
      
      // Tarih sırasına göre sırala (en yeniler önce)
      return requests.sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error getting join requests for admin:', error);
      return [];
    }
  }

  /**
   * Katılım isteğini reddeder
   * @param communityId Topluluk ID'si
   * @param userId Kullanıcı ID'si
   * @param adminId İşlemi yapan yönetici ID'si
   * @returns Başarı durumu ve mesaj
   */
  async rejectJoinRequest(communityId: string, userId: string, adminId: string): Promise<{success: boolean, message: string}> {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communitySnap = await getDoc(communityRef);
      
      if (!communitySnap.exists()) {
        return { success: false, message: 'Topluluk bulunamadı' };
      }
      
      const communityData = communitySnap.data() as Community;
      
      // Yönetici kontrolü
      if (!this.isUserAdmin(communityData, adminId)) {
        return { success: false, message: 'Bu işlemi yapmaya yetkiniz yok' };
      }
      
      // İstek var mı kontrol et
      if (!communityData.joinRequests?.includes(userId)) {
        return { success: false, message: 'Bu kullanıcı için katılım isteği bulunamadı' };
      }
      
      // Katılım isteğini kaldır
      const joinRequestsTimestamps = { ...communityData.joinRequestsTimestamps };
      if (joinRequestsTimestamps && joinRequestsTimestamps[userId]) {
        delete joinRequestsTimestamps[userId];
      }
      
      await updateDoc(communityRef, {
        joinRequests: arrayRemove(userId),
        joinRequestsTimestamps: joinRequestsTimestamps
      });
      
      // Bildirim gönder
      const notificationService = NotificationService.getInstance();
      await notificationService.sendNotification({
        userId: userId,
        title: 'Katılım İsteği Reddedildi',
        message: `"${communityData.name}" topluluğuna katılım isteğiniz reddedildi.`,
        type: 'info',
        data: { communityId }
      });
      
      return { success: true, message: 'Katılım isteği reddedildi' };
    } catch (error) {
      console.error('Error rejecting join request:', error);
      return { success: false, message: 'İşlem sırasında bir hata oluştu' };
    }
  }
} 