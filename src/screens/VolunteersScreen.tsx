import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { Text, Card, Button, Avatar, Searchbar, Chip, Divider, Menu, ActivityIndicator, FAB, TouchableRipple, Badge } from 'react-native-paper';
import { MapPin, Star, Clock, Award, Loader, MessageCircle, Filter, Users, UserPlus, Plus, Bell, Code, Home } from 'lucide-react-native';
import { colors, spacing, shadows, borderRadius, typography } from '../config/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../hooks/useAuth';
import { Community } from '../types/community';
import { CommunityService } from '../services/communityService';
import { MessagingService } from '../services/messagingService';
import { UserService } from '../services/userService';
import { XPService } from '../services/xpService';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { calculateLevelFromXP, calculateXpForLevel, calculateXpForNextLevel, calculateLevelProgress } from '../utils/levelUtils';
import { User } from '../types/user';

// Define conversation interface to handle both direct and community conversations
interface ConversationItem {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar: string;
  };
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: number;
  isCommunityChat?: boolean;
}

// Tabs
enum TabName {
  VOLUNTEERS = 'volunteers',
  BUSINESSES = 'businesses',
  VETERINARIANS = 'veterinarians',
  COMMUNITIES = 'communities',
  MESSAGES = 'messages',
}

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

type VolunteersScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function VolunteersScreen() {
  const navigation = useNavigation<VolunteersScreenNavigationProp>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>(TabName.VOLUNTEERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<User[]>([]);
  const [veterinarians, setVeterinarians] = useState<User[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedUserType, setSelectedUserType] = useState<'volunteer' | 'business' | 'veterinarian'>('volunteer');

  const userService = UserService.getInstance();
  const communityService = CommunityService.getInstance();
  const messagingService = MessagingService.getInstance();

  useEffect(() => {
    const fetchVolunteers = async () => {
      if (!user) return;
      
      try {
        console.log("Fetching users...");
        const allUsers = await userService.getAllUsers();
        
        // Filter users by type
        const volunteerUsers = allUsers
          .filter(u => u.uid !== user.uid && u.role === 'user' && !u.isBusinessAccount)
          .map(u => ({
            ...u,
            xp: u.stats?.xpPoints || 0,
            level: u.stats?.level || 1,
            completedTasks: u.stats?.tasksCompleted || 0,
            badge: getBadgeForLevel(u.stats?.level || 1),
            skills: u.skills || []
          })) as User[];

        const businessUsers = allUsers
          .filter(u => u.isBusinessAccount && u.businessType === 'business' && u.isApproved)
          .map(u => ({
            ...u,
            xp: u.stats?.xpPoints || 0,
            level: u.stats?.level || 1,
            completedTasks: u.stats?.tasksCompleted || 0,
            badge: 'İşletme',
            skills: u.services || []
          })) as User[];

        const veterinarianUsers = allUsers
          .filter(u => u.isBusinessAccount && u.businessType === 'healthcare' && u.isApproved)
          .map(u => ({
            ...u,
            xp: u.stats?.xpPoints || 0,
            level: u.stats?.level || 1,
            completedTasks: u.stats?.tasksCompleted || 0,
            badge: 'Veteriner',
            skills: u.services || []
          })) as User[];

        setVolunteers(volunteerUsers);
        setBusinesses(businessUsers);
        setVeterinarians(veterinarianUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const fetchCommunities = async () => {
      if (!user) return;
      
      try {
        console.log("Fetching communities...");
        const allCommunities = await communityService.getCommunities();
        setCommunities(allCommunities);
      } catch (error) {
        console.error('Error fetching communities:', error);
      }
    };

    const fetchConversations = async () => {
      if (!user) return;
      
      try {
        console.log("Fetching conversations for Messages tab...");
        
        // Fetch user's direct conversations
        const userConversations = await messagingService.getUserConversations(user.uid);
        console.log(`Fetched ${userConversations.length} direct conversations`);
        
        // Fetch user's communities
        const userCommunities = await communityService.getCommunities();
        const joinedCommunities = userCommunities.filter(c => c.members.includes(user.uid));
        console.log(`Fetched ${joinedCommunities.length} joined communities`);
        
        // Transform direct conversations to match our ConversationItem interface
        const directConversations: ConversationItem[] = userConversations
          .filter(conv => conv && (conv.recipientId || (conv.otherUser && conv.otherUser.id)))
          .map(conv => ({
            id: conv.id,
            otherUser: {
              id: conv.otherUser?.id || conv.recipientId || '',
              name: conv.otherUser?.name || 'Unknown User',
              avatar: conv.otherUser?.avatar || 'https://picsum.photos/200'
            },
            lastMessage: conv.lastMessage,
            unreadCount: conv.unreadCount?.[user.uid] || 0,
            isCommunityChat: false
          }));

        // Transform communities to match our ConversationItem interface
        const communityConversations: ConversationItem[] = joinedCommunities.map(community => ({
          id: `community_${community.id}`,
          otherUser: {
            id: community.id,
            name: community.name,
            avatar: community.photoURL || 'https://picsum.photos/200'
          },
          lastMessage: community.lastMessage,
          unreadCount: community.unreadMessages?.[user.uid] || 0,
          isCommunityChat: true
        }));

        // Combine and sort all conversations by last message time
        const allConversations = [...directConversations, ...communityConversations]
          .sort((a, b) => {
            const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return timeB - timeA;
          });

        console.log(`Total conversations: ${allConversations.length} (${directConversations.length} direct, ${communityConversations.length} community)`);
        
        setConversations(allConversations);
        
        // Calculate total unread messages
        const totalUnread = allConversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setUnreadMessages(totalUnread);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchVolunteers(),
        fetchCommunities(),
        fetchConversations()
      ]);
      setIsLoading(false);
    };

    loadData();

    // Set up message notification listener
    const unsubscribeMessages = messagingService.subscribeToNewMessages(user?.uid, () => {
      fetchConversations();
    });

    return () => {
      unsubscribeMessages?.();
    };
  }, [user]);

  // Add debug logging for conversations
  useEffect(() => {
    // Debug log conversations when they change
    if (conversations.length > 0) {
      console.log(`Loaded ${conversations.length} conversations`);
      conversations.forEach((conv, i) => {
        if (!conv.otherUser || !conv.otherUser.id) {
          console.error(`Invalid conversation at index ${i}:`, JSON.stringify(conv));
        }
      });
    }
  }, [conversations]);

  // Update filteredVolunteers
  // GÜNCELLENDİ: Filtreleme kullanıcı tipi ile eşleşecek şekilde düzeltildi

const filteredUsers = useMemo(() => {
  let users = [];
  switch (selectedUserType) {
    case 'volunteer':
      users = volunteers;
      break;
    case 'business':
      users = businesses.filter(u => u.userType === 'business');
      break;
    case 'veterinarian':
      users = businesses.filter(u => u.userType === 'veteriner');
      break;
  }

  return users.filter(user =>
    searchQuery === '' ||
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.location?.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [selectedUserType, searchQuery, volunteers, businesses]);

  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const getBadgeColor = (level: number) => {
    if (level >= 10) return colors.secondary;
    if (level >= 7) return colors.primary;
    if (level >= 5) return colors.info;
    if (level >= 3) return colors.success;
    return colors.warning;
  };

  const getBadgeForLevel = (level: number): string => {
    if (level >= 10) return 'Uzman Gönüllü';
    if (level >= 7) return 'Deneyimli Gönüllü';
    if (level >= 5) return 'Aktif Gönüllü';
    if (level >= 3) return 'Gönüllü';
    return 'Yeni Gönüllü';
  };

  const renderUserCard = ({ item, userType }: { item: User; userType: 'volunteer' | 'business' | 'veterinarian' }) => {
    const isVolunteer = userType === 'volunteer';
    const cardColor = userType === 'veterinarian' ? colors.success : 
                     userType === 'business' ? colors.warning : 
                     colors.primary;

    return (
      <TouchableRipple
        onPress={() => navigation.navigate('UserProfile', { userId: item.uid })}
        style={styles.cardWrapper}
      >
        <LinearGradient
          colors={[colors.surface, colors.surface + '95']}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.avatarSection}>
              <LinearGradient
                colors={[cardColor + '20', cardColor + '05']}
                style={styles.avatarContainer}
              >
                {item.photoURL ? (
                  <Avatar.Image 
                    source={{ uri: item.photoURL }} 
                    size={70} 
                    style={styles.avatar}
                  />
                ) : (
                  <Avatar.Icon 
                    icon={isVolunteer ? "account" : "domain"}
                    size={70} 
                    style={[styles.avatarIcon, { backgroundColor: cardColor + '30' }]}
                    color={cardColor}
                  />
                )}
                {isVolunteer ? (
                  <View style={[styles.levelBadge, { backgroundColor: getBadgeColor(item.level) }]}>
                    <Text style={styles.levelText}>{item.level}</Text>
                  </View>
                ) : (
                  <View style={[styles.roleBadge, { backgroundColor: cardColor }]}>
                    <Text style={styles.roleText}>
                      {userType === 'veterinarian' ? 'Vet' : 'İşletme'}
                    </Text>
                  </View>
                )}
              </LinearGradient>

              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>{item.displayName}</Text>
                
                <View style={styles.roleContainer}>
                  <Text style={[styles.roleLabel, { color: cardColor }]}>
                    {isVolunteer ? getBadgeForLevel(item.level) :
                     userType === 'veterinarian' ? 'Veteriner Kliniği' : 
                     'Pet Dostu İşletme'}
                  </Text>
                </View>
                
                {item.location && item.location.address && (
                  <View style={styles.locationContainer}>
                    <MapPin size={14} color={colors.textSecondary} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {item.location.address}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableRipple
              onPress={() => navigation.navigate('Chat', { 
                conversationId: '', 
                recipientId: item.uid, 
                recipientName: item.displayName 
              })}
              style={[styles.messageButton, { backgroundColor: cardColor + '15' }]}
            >
              <MessageCircle size={22} color={cardColor} />
            </TouchableRipple>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.bio} numberOfLines={2}>
              {item.bio || (userType !== 'volunteer' ? item.businessDescription : 'Henüz bir açıklama eklenmemiş.')}
            </Text>

            <View style={styles.statsContainer}>
              <LinearGradient
                colors={[colors.surfaceVariant + '30', colors.surfaceVariant + '10']}
                style={styles.statsGradient}
              >
                <View style={styles.statItem}>
                  <Star size={18} color={cardColor} />
                  <Text style={[styles.statValue, { color: cardColor }]}>
                    {isVolunteer ? `${Math.round(item.xp)} XP` : `${item.rating || 0} Puan`}
                  </Text>
                  <Text style={styles.statLabel}>
                    {isVolunteer ? 'Tecrübe' : 'Değerlendirme'}
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Award size={18} color={cardColor} />
                  <Text style={[styles.statValue, { color: cardColor }]}>
                    {isVolunteer ? `${item.completedTasks}` : `${item.reviewCount || 0}`}
                  </Text>
                  <Text style={styles.statLabel}>
                    {isVolunteer ? 'Görev' : 'Yorum'}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {isVolunteer && (
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Seviye {item.level}</Text>
                  <Text style={styles.progressXP}>
                    {Math.round(item.xp)} / {calculateXpForNextLevel(item.level)} XP
                  </Text>
                </View>
                <LinearGradient
                  colors={[colors.surfaceVariant + '20', colors.surfaceVariant + '05']}
                  style={styles.progressBarBackground}
                >
                  <LinearGradient
                    colors={[getBadgeColor(item.level), getBadgeColor(item.level) + '80']}
                    style={[
                      styles.progressBar,
                      { width: `${calculateLevelProgress(item.level, item.xp)}%` }
                    ]}
                  />
                </LinearGradient>
              </View>
            )}

            <View style={styles.skillsContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.skillsScroll}
              >
                {item.skills?.map(skill => (
                  <Chip 
                    key={skill} 
                    style={[
                      styles.skillChip,
                      selectedSkill === skill && { backgroundColor: cardColor + '30' },
                      !isVolunteer && { backgroundColor: cardColor + '15' }
                    ]}
                    textStyle={[
                      styles.skillChipText,
                      selectedSkill === skill && { color: cardColor, fontWeight: '600' },
                      !isVolunteer && { color: cardColor }
                    ]}
                    onPress={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
                  >
                    {skill}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          </View>
        </LinearGradient>
      </TouchableRipple>
    );
  };

  const renderCommunityCard = ({ item }: { item: Community }) => {
    // Safety check for invalid community
    if (!item || !item.id || !item.name) {
      console.error("Invalid community object:", item);
      return null;
    }
    
    console.log(`Rendering community card for: ${item.name} (${item.id})`);
    
    return (
      <View style={styles.cardWrapper}>
        <Card 
          style={styles.card}
          mode="elevated"
          onPress={() => navigation.navigate('CommunityDetail', { communityId: item.id })}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarContainer}>
                {item.photoURL ? (
                  <Avatar.Image 
                    source={{ uri: item.photoURL }} 
                    size={70} 
                    style={styles.avatar}
                  />
                ) : (
                  <Avatar.Icon 
                    icon="account-group" 
                    size={70} 
                    style={styles.avatarIcon}
                  />
                )}
                {item.isPublic === false && (
                  <View style={[styles.privateBadge]}>
                    <Text style={styles.privateText}>Özel</Text>
                  </View>
                )}
              </View>

              <View style={styles.headerInfo}>
                <Text style={styles.communityName}>{item.name}</Text>
                
                <View style={styles.categoryContainer}>
                  <Chip 
                    style={styles.categoryChip}
                    textStyle={styles.categoryChipText}
                  >
                    {getCategoryLabel(item.category)}
                  </Chip>
                </View>
                
                {item.location && item.location.address && (
                  <View style={styles.locationContainer}>
                    <MapPin size={14} color={colors.textSecondary} />
                    <Text style={styles.locationText}>{item.location.address}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.communityContent}>
              <Text style={styles.communityDescription} numberOfLines={3}>
                {item.description || 'Bu topluluk hakkında açıklama bulunmuyor.'}
              </Text>
              
              {Array.isArray(item.tags) && item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.tags.slice(0, 3).map(tag => (
                    <Chip
                      key={tag}
                      style={styles.tagChip}
                      textStyle={styles.tagChipText}
                    >
                      #{tag}
                    </Chip>
                  ))}
                  {item.tags.length > 3 && (
                    <Text style={styles.moreTags}>+{item.tags.length - 3}</Text>
                  )}
                </View>
              )}
              
              <View style={styles.communityStats}>
                <View style={styles.statItem}>
                  <Users size={14} color={colors.textSecondary} />
                  <Text style={styles.statText}>{item.membersCount || 0} Üye</Text>
                </View>
                <Text style={styles.createdText}>
                  {new Date(item.createdAt).toLocaleDateString('tr-TR', { 
                    year: 'numeric', 
                    month: 'short' 
                  })}
                </Text>
              </View>
              
              <View style={styles.buttonContainer}>
                <Button 
                  mode={isMember(item) ? "outlined" : "contained"} 
                  style={isMember(item) ? styles.leaveButton : styles.joinButton}
                  onPress={() => handleJoinCommunity(item.id)}
                >
                  {isMember(item) ? 'Ayrıl' : 'Katıl'}
                </Button>
                
                {isMember(item) && (
                  <Button 
                    mode="contained" 
                    style={styles.chatButton}
                    icon={({size, color}) => <MessageCircle size={18} color={color} />}
                    onPress={() => navigateToCommunityChat(item.id, item.name)}
                  >
                    Sohbet
                  </Button>
                )}
              </View>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  const renderConversationCard = ({ item }) => {
    // Safety check for invalid conversation
    if (!item || !item.otherUser || !item.otherUser.id) {
      console.error("Invalid conversation object:", JSON.stringify(item));
      return null;
    }
    
    const hasMessages = item.lastMessage && item.lastMessage.content !== 'Henüz mesaj yok';
    
    // Ensure recipientId is valid
    const navigateToChat = () => {
      // Make sure we have a valid ID
      if (!item.otherUser.id || item.otherUser.id.trim() === '') {
        console.error('Invalid conversation: missing recipient ID');
        return;
      }
      
      navigation.navigate('Chat', { 
        conversationId: item.id, 
        recipientId: item.otherUser.id, 
        recipientName: item.otherUser.name || 'Unknown',
        isCommunityChat: item.isCommunityChat
      });
    };
    
    return (
      <TouchableOpacity
        style={[
          styles.conversationCard,
          !hasMessages && styles.noMessagesCard
        ]}
        onPress={navigateToChat}
      >
        <View style={styles.conversationAvatar}>
          {item.otherUser?.avatar ? (
            <Avatar.Image 
              source={{ uri: item.otherUser.avatar }} 
              size={50}
              style={styles.conversationAvatarImage}
            />
          ) : (
            <Avatar.Icon 
              icon={item.isCommunityChat ? "account-group" : "account"} 
              size={50}
              style={styles.conversationAvatarIcon}
            />
          )}
          {(item.unreadCount > 0) && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
          {item.isCommunityChat && (
            <View style={styles.communityBadge}>
              <Users size={12} color="#fff" />
            </View>
          )}
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>{item.otherUser?.name || 'Unknown'}</Text>
            <Text style={styles.conversationTime}>
              {hasMessages && item.lastMessage?.createdAt ? formatTime(item.lastMessage.createdAt) : ''}
            </Text>
          </View>
          
          <View style={styles.messagePreview}>
            {item.isCommunityChat && item.lastMessage?.senderId !== user?.uid && hasMessages ? (
              <Text 
                style={[
                  styles.messageText, 
                  item.unreadCount > 0 && styles.unreadMessage
                ]} 
                numberOfLines={1}
              >
                {item.lastMessage?.senderName ? `${item.lastMessage.senderName}: ` : ''}
                {item.lastMessage?.content || ''}
              </Text>
            ) : hasMessages ? (
              <Text 
                style={[
                  styles.messageText, 
                  item.unreadCount > 0 && styles.unreadMessage
                ]} 
                numberOfLines={1}
              >
                {item.lastMessage?.senderId === user?.uid ? 'Sen: ' : ''}
                {item.lastMessage?.content || ''}
              </Text>
            ) : (
              <Text 
                style={[
                  styles.noMessagesText
                ]} 
                numberOfLines={1}
              >
                {item.isCommunityChat ? 'Topluluk sohbeti başlat' : 'Yeni sohbet başlat'}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../assets/paw.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Gönüllü Bulunamadı</Text>
      <Text style={styles.emptyText}>
        Arama kriterlerinize uygun gönüllü bulunamadı. Lütfen farklı bir arama deneyin.
      </Text>
      <Button 
        mode="outlined" 
        style={styles.resetButton}
        onPress={() => {
          setSearchQuery('');
        }}
      >
        Filtreleri Temizle
      </Button>
    </View>
  );

  const renderEmptyCommunities = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../assets/paw.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Topluluk Bulunamadı</Text>
      <Text style={styles.emptyText}>
        Henüz topluluk bulunmuyor. İlk topluluğu oluşturmak ister misiniz?
      </Text>
      <Button 
        mode="contained" 
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateCommunity')}
      >
        Topluluk Oluştur
      </Button>
    </View>
  );

  const renderEmptyMessages = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../assets/paw.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Mesaj Bulunamadı</Text>
      <Text style={styles.emptyText}>
        Henüz hiç mesajlaşmanız veya katıldığınız topluluk yok. Gönüllülerle iletişime geçebilir veya bir topluluğa katılabilirsiniz.
      </Text>
      <Button 
        mode="contained" 
        style={styles.createButton}
        onPress={() => setActiveTab(TabName.COMMUNITIES)}
      >
        Toplulukları Keşfet
      </Button>
    </View>
  );

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

  const isMember = (community: Community) => {
    return user && community.members.includes(user.uid);
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) return;
    
    try {
      // Find the community
      const community = communities.find(c => c.id === communityId);
      if (!community) return;
      
      if (isMember(community)) {
        // Leave community
        await communityService.leaveCommunity(communityId, user.uid);
        
        // Update local state
        setCommunities(prev => 
          prev.map(c => 
            c.id === communityId 
              ? { 
                  ...c, 
                  members: c.members.filter(id => id !== user.uid),
                  membersCount: c.membersCount - 1
                } 
              : c
          )
        );
      } else {
        // Join community
        await communityService.joinCommunity(communityId, user.uid);
        
        // Update local state if public community (auto-join)
        if (community.isPublic) {
          setCommunities(prev => 
            prev.map(c => 
              c.id === communityId 
                ? { 
                    ...c, 
                    members: [...c.members, user.uid],
                    membersCount: c.membersCount + 1
                  } 
                : c
            )
          );
        }
      }
    } catch (error) {
      console.error('Error joining/leaving community:', error);
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    
    // Same day
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // This week
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      return days[date.getDay()];
    }
    
    // Older
    return date.toLocaleDateString();
  };

  const navigateToCommunityChat = (communityId: string, communityName: string) => {
    // Validate community ID
    if (!communityId || communityId.trim() === '') {
      console.error('Invalid community ID for chat');
      return;
    }
    
    navigation.navigate('Chat', {
      conversationId: '',
      recipientId: communityId,
      recipientName: communityName,
      isCommunityChat: true
    });
  };

  const navigateToJoinByInvite = () => {
    navigation.navigate('JoinByInvite');
  };

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      <View style={styles.tabBackground}>
        <LinearGradient
          colors={[colors.surfaceVariant + '40', colors.surfaceVariant + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.tabGradient}
        >
          <TouchableRipple
            style={[
              styles.mainTab,
              activeTab === TabName.VOLUNTEERS && styles.activeMainTab
            ]}
            onPress={() => setActiveTab(TabName.VOLUNTEERS)}
          >
            <View style={styles.tabContent}>
              <Users size={20} color={activeTab === TabName.VOLUNTEERS ? colors.primary : colors.textSecondary} />
              <Text style={[styles.mainTabText, activeTab === TabName.VOLUNTEERS && styles.activeMainTabText]}>
                Kullanıcılar
              </Text>
            </View>
          </TouchableRipple>

          <TouchableRipple
            style={[
              styles.mainTab,
              activeTab === TabName.COMMUNITIES && styles.activeMainTab
            ]}
            onPress={() => setActiveTab(TabName.COMMUNITIES)}
          >
            <View style={styles.tabContent}>
              <UserPlus size={20} color={activeTab === TabName.COMMUNITIES ? colors.primary : colors.textSecondary} />
              <Text style={[styles.mainTabText, activeTab === TabName.COMMUNITIES && styles.activeMainTabText]}>
                Topluluklar
              </Text>
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{communities.length}</Text>
              </View>
            </View>
          </TouchableRipple>

          <TouchableRipple
            style={[
              styles.mainTab,
              activeTab === TabName.MESSAGES && styles.activeMainTab
            ]}
            onPress={() => setActiveTab(TabName.MESSAGES)}
          >
            <View style={styles.tabContent}>
              <MessageCircle size={20} color={activeTab === TabName.MESSAGES ? colors.primary : colors.textSecondary} />
              <Text style={[styles.mainTabText, activeTab === TabName.MESSAGES && styles.activeMainTabText]}>
                Mesajlar
              </Text>
              {unreadMessages > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadMessages}</Text>
                </View>
              )}
            </View>
          </TouchableRipple>
        </LinearGradient>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <LinearGradient
          colors={[colors.primary + '10', colors.background]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Text style={styles.title}>
              {activeTab === TabName.VOLUNTEERS && 'Kullanıcılar'}
              {activeTab === TabName.COMMUNITIES && 'Topluluklar'}
              {activeTab === TabName.MESSAGES && 'Mesajlar'}
            </Text>
            
            {activeTab === TabName.COMMUNITIES && (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={navigateToJoinByInvite}
                >
                  <LinearGradient
                    colors={[colors.primary + '20', colors.primary + '10']}
                    style={styles.headerButtonGradient}
                  >
                    <Code size={18} color={colors.primary} />
                    <Text style={styles.headerButtonText}>Kod ile Katıl</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => navigation.navigate('CreateCommunity')}
                >
                  <LinearGradient
                    colors={[colors.primary + '20', colors.primary + '10']}
                    style={styles.headerButtonGradient}
                  >
                    <Plus size={18} color={colors.primary} />
                    <Text style={styles.headerButtonText}>Kanal Oluştur</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.searchContainer}>
            <Searchbar
              placeholder={
                activeTab === TabName.VOLUNTEERS ? "Kullanıcı ara..." :
                activeTab === TabName.COMMUNITIES ? "Topluluk ara..." :
                "Mesajlarda ara..."
              }
              onChangeText={handleSearch}
              value={searchQuery}
              style={styles.searchbar}
              iconColor={colors.primary}
              inputStyle={styles.searchInput}
            />
          </View>

          {renderTabBar()}

          {activeTab === TabName.VOLUNTEERS && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContainer}
            >
              <Chip
                selected={selectedUserType === 'volunteer'}
                onPress={() => setSelectedUserType('volunteer')}
                style={[
                  styles.filterChip,
                  selectedUserType === 'volunteer' && styles.selectedFilterChip
                ]}
                textStyle={[
                  styles.filterChipText,
                  selectedUserType === 'volunteer' && styles.selectedFilterChipText
                ]}
                icon={({size, color}) => (
                  <Users size={16} color={selectedUserType === 'volunteer' ? colors.primary : colors.textSecondary} />
                )}
              >
                Gönüllüler ({volunteers.length})
              </Chip>

              <Chip
                selected={selectedUserType === 'business'}
                onPress={() => setSelectedUserType('business')}
                style={[
                  styles.filterChip,
                  selectedUserType === 'business' && styles.selectedFilterChip
                ]}
                textStyle={[
                  styles.filterChipText,
                  selectedUserType === 'business' && styles.selectedFilterChipText
                ]}
                icon={({size, color}) => (
                  <Home size={16} color={selectedUserType === 'business' ? colors.primary : colors.textSecondary} />
                )}
              >
                İşletmeler ({businesses.length})
              </Chip>

              <Chip
                selected={selectedUserType === 'veterinarian'}
                onPress={() => setSelectedUserType('veterinarian')}
                style={[
                  styles.filterChip,
                  selectedUserType === 'veterinarian' && styles.selectedFilterChip
                ]}
                textStyle={[
                  styles.filterChipText,
                  selectedUserType === 'veterinarian' && styles.selectedFilterChipText
                ]}
                icon={({size, color}) => (
                  <Plus size={16} color={selectedUserType === 'veterinarian' ? colors.primary : colors.textSecondary} />
                )}
              >
                Veterinerler ({veterinarians.length})
              </Chip>
            </ScrollView>
          )}
        </LinearGradient>
      </View>

      <View style={styles.content}>
        {activeTab === TabName.VOLUNTEERS && (
          <FlatList
            data={filteredUsers}
            renderItem={(props) => renderUserCard({ ...props, userType: selectedUserType })}
            keyExtractor={item => item.uid}
            contentContainerStyle={styles.list}
            ListEmptyComponent={renderEmptyList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />
        )}

        {activeTab === TabName.COMMUNITIES && (
          <FlatList
            data={communities.filter(c => 
              searchQuery === '' || 
              c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (c.tags && c.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
            )}
            renderItem={renderCommunityCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={renderEmptyCommunities}
            showsVerticalScrollIndicator={false}
          />
        )}

        {activeTab === TabName.MESSAGES && (
          <FlatList
            data={conversations.filter(c => 
              searchQuery === '' || 
              c.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            renderItem={renderConversationCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={renderEmptyMessages}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    ...shadows.medium,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? spacing.xl : spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
  },
  headerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  searchContainer: {
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  searchbar: {
    borderRadius: borderRadius.medium,
    elevation: 0,
    backgroundColor: colors.surfaceVariant + '40',
    height: 45,
  },
  searchInput: {
    fontSize: 15,
    color: colors.text,
  },
  tabContainer: {
    marginBottom: spacing.sm,
  },
  tabBackground: {
    marginHorizontal: spacing.screenPadding,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    backgroundColor: colors.surfaceVariant + '20',
  },
  tabGradient: {
    flexDirection: 'row',
    height: 48,
  },
  mainTab: {
    flex: 1,
    justifyContent: 'center',
  },
  activeMainTab: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    margin: 4,
    ...shadows.small,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  mainTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeMainTabText: {
    color: colors.primary,
  },
  tabBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  unreadBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  filterContainer: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.surfaceVariant + '40',
    borderRadius: borderRadius.medium,
  },
  selectedFilterChip: {
    backgroundColor: colors.primary + '15',
  },
  filterChipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  selectedFilterChipText: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  list: {
    padding: spacing.screenPadding,
  },
  separator: {
    height: spacing.sm,
  },
  cardWrapper: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    ...shadows.medium,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  avatarSection: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatar: {
    backgroundColor: 'transparent',
  },
  avatarIcon: {
    backgroundColor: 'transparent',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  levelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  roleBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  roleText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.subtitle1.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  roleContainer: {
    marginBottom: 2,
  },
  roleLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginLeft: spacing.xxs,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    padding: spacing.md,
  },
  bio: {
    fontSize: typography.body2.fontSize,
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  statsContainer: {
    marginBottom: spacing.md,
  },
  statsGradient: {
    flexDirection: 'row',
    borderRadius: borderRadius.medium,
    padding: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border + '30',
    marginHorizontal: spacing.md,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressTitle: {
    fontSize: typography.body2.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  progressXP: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  skillsContainer: {
    marginTop: spacing.sm,
  },
  skillsScroll: {
    gap: spacing.xs,
  },
  skillChip: {
    backgroundColor: colors.primaryLight + '15',
  },
  skillChipText: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyImage: {
    width: 100,
    height: 100,
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.text,
  },
  emptyText: {
    fontSize: typography.body1.fontSize,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  resetButton: {
    borderColor: colors.border,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  conversationAvatar: {
    marginRight: spacing.md,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conversationName: {
    fontSize: typography.subtitle1.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  conversationTime: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  messagePreview: {
    marginBottom: spacing.xs,
  },
  messageText: {
    fontSize: typography.body2.fontSize,
    color: colors.text,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  unreadMessage: {
    fontWeight: 'bold',
  },
  privateBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.warning,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privateText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationAvatarImage: {
    backgroundColor: colors.primaryLight + '30',
  },
  conversationAvatarIcon: {
    backgroundColor: colors.primary,
  },
  noMessagesCard: {
    backgroundColor: colors.surfaceVariant,
  },
  noMessagesText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  communityBadge: {
    backgroundColor: colors.primary + '20',
  },
  headerInfo: undefined,
  communityName: undefined,
  categoryContainer: undefined,
  categoryChip: undefined,
  categoryChipText: undefined,
  communityContent: undefined,
  communityDescription: undefined,
  tagsContainer: undefined,
  tagChip: undefined,
  tagChipText: undefined,
  moreTags: undefined,
  communityStats: undefined,
  statText: undefined,
  createdText: undefined,
  buttonContainer: undefined,
  leaveButton: undefined,
  joinButton: undefined,
  chatButton: undefined,
});

