import React, { useState, useEffect } from 'react';
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
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { calculateLevelFromXP, calculateXpForLevel, calculateXpForNextLevel, calculateLevelProgress } from '../utils/levelUtils';

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
  COMMUNITIES = 'communities',
  MESSAGES = 'messages',
}

// Mock volunteer data - keeping for now
const mockVolunteers = [
  {
    id: '1',
    name: 'Ahmet Yılmaz',
    avatar: 'https://picsum.photos/id/1/200',
    bio: 'Hayvan sever ve 3 yıllık StreetPaws gönüllüsü',
    level: 5,
    xp: 2500,
    completedTasks: 42,
    skills: ['Besleme', 'Veteriner', 'Barınak'],
    location: 'İstanbul, Kadıköy',
    badge: 'Barınak Kahramanı'
  },
  {
    id: '2',
    name: 'Ayşe Kaya',
    avatar: 'https://picsum.photos/id/2/200',
    bio: 'Veteriner hekim ve sokak hayvanları koruyucusu',
    level: 8,
    xp: 4200,
    completedTasks: 75,
    skills: ['Sağlık', 'İlkyardım', 'Eğitim'],
    location: 'İstanbul, Beşiktaş',
    badge: 'Veteriner Uzmanı'
  },
  {
    id: '3',
    name: 'Mehmet Demir',
    avatar: 'https://picsum.photos/id/3/200',
    bio: 'Barınak görevlisi ve sokak hayvanları için çalışan aktivist',
    level: 6,
    xp: 3100,
    completedTasks: 51,
    skills: ['Barınak', 'Besleme', 'Tasarım'],
    location: 'İstanbul, Üsküdar',
    badge: 'Hayvan Dostu'
  },
  {
    id: '4',
    name: 'Zeynep Çelik',
    avatar: 'https://picsum.photos/id/4/200',
    bio: 'Çevreci ve hayvan hakları savunucusu',
    level: 4,
    xp: 1800,
    completedTasks: 28,
    skills: ['Organizasyon', 'Sosyal Medya', 'Eğitim'],
    location: 'İstanbul, Bakırköy',
    badge: 'Sosyal Medya Uzmanı'
  },
  {
    id: '5',
    name: 'Can Aydın',
    avatar: 'https://picsum.photos/id/5/200',
    bio: 'Hayvansever mühendis ve hafta sonları gönüllü',
    level: 3,
    xp: 1200,
    completedTasks: 18,
    skills: ['Bakım', 'Tasarım', 'İnşaat'],
    location: 'İstanbul, Beylikdüzü',
    badge: 'Yeni Gönüllü'
  }
];

// Sample communities data for initial UI
const mockCommunities: Community[] = [
  {
    id: '1',
    name: 'İstanbul Sokak Hayvanları',
    description: 'İstanbul\'daki sokak hayvanlarına yardım için kurulmuş topluluk',
    category: 'ANIMAL_RESCUE',
    photoURL: 'https://picsum.photos/id/237/200',
    createdAt: new Date().toISOString(),
    createdBy: '1',
    members: ['1', '2', '3'],
    membersCount: 3,
    admins: ['1'],
    isPublic: true,
    location: {
      latitude: 41.0082,
      longitude: 28.9784,
      address: 'İstanbul'
    },
    tags: ['sokak hayvanları', 'kedi', 'köpek', 'yardım']
  },
  {
    id: '2',
    name: 'Kadıköy Mama Dağıtım Ekibi',
    description: 'Kadıköy bölgesinde sokak hayvanları için mama dağıtımı yapan ekip',
    category: 'FEEDING',
    photoURL: 'https://picsum.photos/id/169/200',
    createdAt: new Date().toISOString(),
    createdBy: '2',
    members: ['2', '4'],
    membersCount: 2,
    admins: ['2'],
    isPublic: true,
    location: {
      latitude: 40.9916,
      longitude: 29.0233,
      address: 'Kadıköy, İstanbul'
    },
    tags: ['besleme', 'mama dağıtımı', 'kadıköy']
  },
  {
    id: '3',
    name: 'Veteriner Gönüllüleri',
    description: 'Sokak hayvanları için gönüllü veteriner hizmeti veren grup',
    category: 'VETERINARY',
    photoURL: 'https://picsum.photos/id/219/200',
    createdAt: new Date().toISOString(),
    createdBy: '3',
    members: ['3', '2'],
    membersCount: 2,
    admins: ['3'],
    isPublic: false,
    tags: ['veteriner', 'tedavi', 'sağlık']
  }
];

// Sample conversations for Messages tab
const mockConversations: ConversationItem[] = [
  {
    id: '1',
    otherUser: {
      id: '2',
      name: 'Ayşe Kaya',
      avatar: 'https://picsum.photos/id/2/200'
    },
    lastMessage: {
      content: 'Merhaba, bu hafta sonu etkinliğe katılabilecek misin?',
      senderId: '2',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    },
    unreadCount: 1
  },
  {
    id: '2',
    otherUser: {
      id: '3',
      name: 'Mehmet Demir',
      avatar: 'https://picsum.photos/id/3/200'
    },
    lastMessage: {
      content: 'Görev için teşekkür ederim, yarın görüşürüz!',
      senderId: 'currentUser',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    unreadCount: 0
  }
];

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

type VolunteersScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function VolunteersScreen() {
  const navigation = useNavigation<VolunteersScreenNavigationProp>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>(TabName.VOLUNTEERS);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Services
  const communityService = CommunityService.getInstance();
  const messagingService = MessagingService.getInstance();
  const userService = UserService.getInstance();
  
  // Replace mock data with real user data
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  
  // Davet ile katılma sayfasına yönlendirme
  const navigateToJoinByInvite = () => {
    navigation.navigate('JoinByInvite', {});
  };
  
  // Fetch real user data
  useEffect(() => {
    const fetchVolunteers = async () => {
      setIsLoading(true);
      try {
        const allUsers = await userService.getAllUsers();
        
        // Transform user data to match volunteer format
        const transformedUsers = allUsers
          .filter(userData => userData && userData.uid)
          .map(userData => {
            // Calculate the correct level based on XP
            const xp = userData.stats?.xpPoints || userData.xp || 0;
            const calculatedLevel = calculateLevelFromXP(xp);
            
            return {
              id: userData.uid,
              name: userData.displayName || userData.username || `Kullanıcı-${userData.uid.substr(0, 5)}`,
              avatar: userData.photoURL,
              bio: userData.bio || 'StreetPaws gönüllüsü',
              level: calculatedLevel, // Use calculated level instead of stored level
              xp: xp,
              completedTasks: userData.stats?.tasksCompleted || (userData.completedTasks ? userData.completedTasks.length : 0),
              skills: userData.skills || ['Besleme'],
              location: userData.city || 'İstanbul',
              createdAt: userData.createdAt,
              badge: getBadgeForLevel(calculatedLevel, userData.createdAt)
            };
          });
        
        // Get all unique skills
        const skillsSet = new Set<string>();
        transformedUsers.forEach(user => {
          if (user.skills && Array.isArray(user.skills)) {
            user.skills.forEach(skill => skillsSet.add(skill));
          } else if (typeof user.skills === 'string') {
            skillsSet.add(user.skills);
          }
        });
        
        setVolunteers(transformedUsers);
        setAllSkills(Array.from(skillsSet));
      } catch (error) {
        console.error('Error fetching volunteers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVolunteers();
  }, []);
  
  // Helper function to determine badge based on level and registration date
  const getBadgeForLevel = (level: number, createdAt?: string) => {
    if (level >= 10) return 'Kurtarıcı Kahraman';
    if (level >= 7) return 'Veteriner Uzmanı';
    if (level >= 5) return 'Barınak Kahramanı';
    if (level >= 3) return 'Hayvan Dostu';
    
    // Only return 'Yeni Gönüllü' if the user registered less than a week ago
    if (createdAt) {
      const registrationDate = new Date(createdAt);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      if (registrationDate > oneWeekAgo) {
        return 'Yeni Gönüllü';
      }
    }
    
    // Default badge if not a new volunteer and level < 3
    return 'Hayvan Dostu';
  };
  
  // Real-time data fetching
  useEffect(() => {
    const fetchCommunities = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        console.log("Fetching communities...");
        
        // Fetch all public communities
        const publicCommunities = await communityService.getCommunities({ onlyPublic: true });
        console.log("Public communities fetched:", publicCommunities.length);
        
        // Fetch user's communities
        const userCommunities = await communityService.getCommunities({ userId: user.uid });
        console.log("User communities fetched:", userCommunities.length);
        
        // Combine and remove duplicates for all communities tab
        const combinedCommunitiesMap = new Map();
        
        // First add all public communities
        publicCommunities.forEach(community => {
          combinedCommunitiesMap.set(community.id, community);
        });
        
        // Then add user communities (will overwrite duplicates with user's version)
        userCommunities.forEach(community => {
          combinedCommunitiesMap.set(community.id, community);
        });
        
        const combinedCommunities = Array.from(combinedCommunitiesMap.values());
        console.log("Total combined communities:", combinedCommunities.length);
        
        setCommunities(combinedCommunities);
      } catch (error) {
        console.error('Error fetching communities:', error);
        setCommunities([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchConversations = async () => {
      if (!user) return;
      
      try {
        console.log("Fetching conversations for Messages tab...");
        
        // Fetch user's direct conversations
        const userConversations = await messagingService.getUserConversations(user.uid);
        console.log(`Fetched ${userConversations.length} direct conversations`);
        
        // Transform direct conversations to match our ConversationItem interface
        const directConversations: ConversationItem[] = userConversations
          .filter(conv => conv && (conv.recipientId || (conv.otherUser && conv.otherUser.id)))
          .map(conv => {
            console.log(`Processing direct conversation: ${conv.id}`);
            
            // Ensure we have valid data
            if (!conv.otherUser || !conv.otherUser.id) {
              // Create fallback user data if missing
              conv.otherUser = {
                id: conv.recipientId || 'unknown',
                name: conv.recipientName || 'Unknown User',
                avatar: conv.recipientAvatar || 'https://picsum.photos/200'
              };
            }
            
            // Use mock data for testing with hardcoded IDs
            const userNames = {
              '1': 'Ahmet Yılmaz',
              '2': 'Ayşe Kaya',
              '3': 'Mehmet Demir',
              '4': 'Zeynep Çelik',
              '5': 'Can Aydın'
            };
            
            // Check if this is a test/mock conversation
            const isTestUser = Object.keys(userNames).includes(conv.otherUser.id);
            
            // Convert DirectConversation to ConversationItem
            return {
              id: conv.id || `direct_${Date.now()}`,
              otherUser: {
                id: conv.otherUser.id || conv.recipientId || 'unknown',
                name: isTestUser ? userNames[conv.otherUser.id] : (conv.otherUser.name || conv.recipientName || 'Unknown User'),
                avatar: conv.otherUser.avatar || conv.recipientAvatar || 'https://picsum.photos/200'
              },
              lastMessage: conv.lastMessage,
              unreadCount: typeof conv.unreadCount === 'number' ? conv.unreadCount : 
                          (conv.unreadCount && conv.unreadCount[user.uid]) || 0,
              isCommunityChat: false
            };
          });
        
        console.log(`Processed ${directConversations.length} direct conversations`);
        
        // Fetch user's communities for community conversations
        const userCommunities = await communityService.getCommunities({ userId: user.uid });
        console.log(`Fetched ${userCommunities.length} user communities`);
        
        // Transform communities to look like conversations for the messages tab
        // Include all communities the user is a member of, even without messages
        const communityConversations: ConversationItem[] = userCommunities
          .filter(community => community && community.id && community.name) // Filter out invalid communities
          .map(community => {
            console.log(`Processing community conversation: ${community.name} (${community.id})`);
            
            return {
              id: `community_${community.id}`,
              otherUser: {
                id: community.id || '',
                name: community.name || 'Unknown Community',
                avatar: community.photoURL || 'https://picsum.photos/200'
              },
              lastMessage: community.lastMessage ? {
                content: community.lastMessage.content || '',
                senderId: community.lastMessage.senderId || '',
                senderName: community.lastMessage.senderName || '',
                createdAt: typeof community.lastMessage.createdAt === 'string' 
                  ? community.lastMessage.createdAt 
                  : community.lastMessage.createdAt?.toDate?.().toISOString() || community.createdAt
              } : {
                content: 'Henüz mesaj yok',
                senderId: '',
                senderName: '',
                createdAt: community.createdAt
              },
              unreadCount: community.unreadMessages?.[user.uid] || 0,
              isCommunityChat: true
            };
          });
        
        // For testing: Add a mock direct conversation if none exist
        if (directConversations.length === 0) {
          console.log("No direct conversations found, adding a mock conversation for testing");
          
          // Add a mock conversation
          directConversations.push({
            id: `mock_direct_${Date.now()}`,
            otherUser: {
              id: '1',
              name: 'Ahmet Yılmaz',
              avatar: 'https://picsum.photos/id/1/200',
            },
            lastMessage: {
              content: 'Merhaba, nasılsınız?',
              senderId: '1',
              createdAt: new Date().toISOString()
            },
            unreadCount: 1,
            isCommunityChat: false
          });
        }
        
        // Combine direct and community conversations
        const allConversations: ConversationItem[] = [
          ...directConversations,
          ...communityConversations
        ];
        
        console.log(`Total conversations: ${allConversations.length} (${directConversations.length} direct, ${communityConversations.length} community)`);
        
        // Sort by most recent message
        allConversations.sort((a, b) => {
          // If either is a community chat without messages, prioritize those with messages
          const aHasNoMessages = a.isCommunityChat && (!a.lastMessage || a.lastMessage.content === 'Henüz mesaj yok');
          const bHasNoMessages = b.isCommunityChat && (!b.lastMessage || b.lastMessage.content === 'Henüz mesaj yok');
          
          if (aHasNoMessages && !bHasNoMessages) return 1;
          if (!aHasNoMessages && bHasNoMessages) return -1;
          
          // Otherwise sort by date
          const dateA = new Date(a.lastMessage?.createdAt || 0);
          const dateB = new Date(b.lastMessage?.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Count unread messages
        let unreadCount = 0;
        allConversations.forEach(conv => {
          unreadCount += conv.unreadCount || 0;
        });
        setUnreadMessages(unreadCount);
        
        // Set conversations (even if empty array)
        setConversations(allConversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        
        // Fall back to mock data if there's an error
        console.log("Using mock conversation data due to error");
        const mockConversations: ConversationItem[] = [
          {
            id: '1',
            otherUser: {
              id: '2',
              name: 'Ayşe Kaya',
              avatar: 'https://picsum.photos/id/2/200'
            },
            lastMessage: {
              content: 'Merhaba, bu hafta sonu etkinliğe katılabilecek misin?',
              senderId: '2',
              createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
            },
            unreadCount: 1,
            isCommunityChat: false
          },
          {
            id: '2',
            otherUser: {
              id: '3',
              name: 'Mehmet Demir',
              avatar: 'https://picsum.photos/id/3/200'
            },
            lastMessage: {
              content: 'Görev için teşekkür ederim, yarın görüşürüz!',
              senderId: user?.uid || 'currentUser',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
            },
            unreadCount: 0,
            isCommunityChat: false
          }
        ];
        
        setConversations(mockConversations);
        setUnreadMessages(1);
      }
    };
    
    fetchCommunities();
    fetchConversations();
    
    // Set up message notification listener
    const unsubscribeMessages = messagingService.subscribeToNewMessages(user?.uid, () => {
      fetchConversations(); // Refresh conversations on new message
    });
    
    return () => {
      // Clean up listeners
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
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

  // Update filter to use this new state
  const filteredVolunteers = volunteers.filter(v => {
    // Search filter
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        v.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        v.location.toLowerCase().includes(searchQuery.toLowerCase());
  
    // Skill filter
    const matchesSkill = selectedSkill ? v.skills.includes(selectedSkill) : true;
    
    return matchesSearch && matchesSkill;
  });
  
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

  // Render tab bar
  const renderTabBar = () => (
    <View style={styles.tabBarContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === TabName.VOLUNTEERS && styles.activeTab]}
        onPress={() => setActiveTab(TabName.VOLUNTEERS)}
      >
        <Users size={20} color={activeTab === TabName.VOLUNTEERS ? colors.primary : colors.textSecondary} />
        <Text style={[styles.tabText, activeTab === TabName.VOLUNTEERS && styles.activeTabText]}>
          Gönüllüler
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === TabName.COMMUNITIES && styles.activeTab]}
        onPress={() => setActiveTab(TabName.COMMUNITIES)}
      >
        <UserPlus size={20} color={activeTab === TabName.COMMUNITIES ? colors.primary : colors.textSecondary} />
        <Text style={[styles.tabText, activeTab === TabName.COMMUNITIES && styles.activeTabText]}>
          Topluluklar
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === TabName.MESSAGES && styles.activeTab]}
        onPress={() => setActiveTab(TabName.MESSAGES)}
      >
        <View style={{position: 'relative'}}>
          <MessageCircle size={20} color={activeTab === TabName.MESSAGES ? colors.primary : colors.textSecondary} />
          {unreadMessages > 0 && (
            <View style={styles.messageBadge}>
              <Text style={styles.messageBadgeText}>
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.tabText, activeTab === TabName.MESSAGES && styles.activeTabText]}>
          Mesajlar
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderVolunteerCard = ({ item }) => (
    <Card 
      style={styles.card}
      mode="elevated"
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Avatar.Image 
              source={{ uri: item.avatar }} 
              size={70} 
              style={styles.avatar}
            />
          ) : (
            <Avatar.Icon 
              icon="account" 
              size={70} 
              style={styles.avatarIcon}
            />
          )}
          <View style={[styles.levelBadge, { backgroundColor: getBadgeColor(item.level) }]}>
            <Text style={styles.levelText}>{item.level}</Text>
          </View>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.volunteerName} numberOfLines={1}>{item.name}</Text>
          
          <View style={styles.badgeContainer}>
            <Award size={14} color={getBadgeColor(item.level)} />
            <Text style={[styles.badgeText, { color: getBadgeColor(item.level) }]}>
              {item.badge}
            </Text>
          </View>
          
          <View style={styles.locationContainer}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
          </View>
        </View>
      </View>
      
      <Divider style={styles.divider} />
      
      <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Star size={16} color={colors.warning} />
          <Text style={styles.statText}>{Math.round(item.xp)} XP</Text>
        </View>
        <View style={styles.statItem}>
          <Clock size={16} color={colors.primary} />
          <Text style={styles.statText}>{item.completedTasks} Görev</Text>
        </View>
      </View>
      
      <View style={styles.levelProgressContainer}>
        <Text style={styles.levelProgressText}>Seviye {item.level}</Text>
        <View style={styles.levelProgressBarBackground}>
          <View 
            style={[
              styles.levelProgressBar, 
              {
                width: `${calculateLevelProgress(item.level, item.xp)}%`,
                backgroundColor: item.xp >= 2000 ? colors.warning : getBadgeColor(item.level)
              }
            ]} 
          />
        </View>
        <Text style={styles.levelProgressTextXP}>
          {Math.round(item.xp)} / {calculateXpForNextLevel(item.level)} XP
        </Text>
      </View>
      
      <View style={styles.skillContainer}>
        {item.skills.map(skill => (
          <Chip 
            key={skill} 
            style={[
              styles.skillChip,
              selectedSkill === skill && styles.selectedSkillChip
            ]}
            textStyle={[
              styles.skillChipText,
              selectedSkill === skill && styles.selectedSkillText
            ]}
            onPress={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
          >
            {skill}
          </Chip>
        ))}
      </View>
      
      <Button 
        mode="contained" 
        style={styles.connectButton}
        icon={({size, color}) => <MessageCircle size={18} color={color} />}
        buttonColor={colors.primary}
        onPress={() => navigation.navigate('Chat', { 
          conversationId: '', 
          recipientId: item.id, 
          recipientName: item.name 
        })}
      >
        İletişime Geç
      </Button>
    </Card>
  );

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
                    labelStyle={styles.buttonLabel}
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
          setSelectedSkill(null);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {activeTab === TabName.VOLUNTEERS && 'Gönüllüler'}
            {activeTab === TabName.MESSAGES && 'Mesajlar'}
          </Text>
          
          {activeTab === TabName.COMMUNITIES && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.joinByCodeButton}
                onPress={navigateToJoinByInvite}
              >
                <Code size={20} color={colors.primary} />
                <Text style={styles.joinByCodeText}>Kod ile Katıl</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.createCommunityButton]}
                onPress={() => navigation.navigate('CreateCommunity')}
              >
                <Plus size={20} color={colors.primary} />
                <Text style={styles.joinByCodeText}>Kanal Oluştur</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Tab Bar */}
      {renderTabBar()}
      
      {/* Content based on active tab */}
      {activeTab === TabName.VOLUNTEERS && (
        <>
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Gönüllü ara..."
              onChangeText={handleSearch}
              value={searchQuery}
              style={styles.searchbar}
            />
          </View>
          
          <View style={styles.filtersContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.filtersScroll}
            >
              <Chip
                mode="outlined"
                style={[styles.filterChip, !selectedSkill && styles.activeFilterChip]}
                onPress={() => setSelectedSkill(null)}
                textStyle={!selectedSkill ? styles.activeFilterText : styles.filterChipText}
              >
                Tümü
              </Chip>
              {allSkills.map(skill => (
                <Chip
                  key={skill}
                  mode="outlined"
                  style={[
                    styles.filterChip, 
                    selectedSkill === skill && styles.activeFilterChip
                  ]}
                  onPress={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
                  textStyle={
                    selectedSkill === skill 
                      ? styles.activeFilterText 
                      : styles.filterChipText
                  }
                >
                  {skill}
                </Chip>
              ))}
            </ScrollView>
          </View>
          
          <FlatList
            data={filteredVolunteers}
            renderItem={renderVolunteerCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>Gönüllü Bulunamadı</Text>
                <Text style={styles.emptyText}>
                  Arama kriterlerinize uygun gönüllü bulunamadı. Farklı bir arama deneyin.
                </Text>
              </View>
            )}
          />
        </>
      )}
      
      {activeTab === TabName.COMMUNITIES && (
        <>
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Topluluk ara..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
            />
          </View>
          
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
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>Topluluk Bulunamadı</Text>
                <Text style={styles.emptyText}>
                  Arama kriterlerinize uygun topluluk bulunamadı veya henüz topluluk yok.
                </Text>
                <Button 
                  mode="contained" 
                  onPress={() => navigation.navigate('CreateCommunity')}
                >
                  Topluluk Oluştur
                </Button>
              </View>
            )}
          />
          

        </>
      )}
      
      {activeTab === TabName.MESSAGES && (
        <>
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Mesajlarda ara..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
            />
          </View>
          
          <FlatList
            data={conversations.filter(c => 
              searchQuery === '' || 
              c.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            renderItem={renderConversationCard}
            keyExtractor={item => item.id}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>Mesaj Bulunamadı</Text>
                <Text style={styles.emptyText}>
                  Henüz hiç mesajınız yok. Gönüllüler veya topluluklar ile iletişime geçebilirsiniz.
                </Text>
              </View>
            )}
          />
        </>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinByCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.medium,
    marginRight: spacing.sm,
  },
  createCommunityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.medium,
  },
  joinByCodeText: {
    color: colors.primary,
    marginLeft: spacing.xs,
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: typography.h2.fontSize,
    color: colors.text,
    fontWeight: '700',
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
    ...shadows.small,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primaryLight + '20',
  },
  tabText: {
    fontSize: typography.body2.fontSize,
    color: colors.textSecondary,
    marginLeft: spacing.xxs,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
  },
  searchbar: {
    borderRadius: borderRadius.medium,
    height: 45,
  },
  filtersContainer: {
    marginBottom: spacing.md,
    paddingLeft: spacing.screenPadding,
  },
  filtersScroll: {
    paddingRight: spacing.screenPadding,
  },
  filterChip: {
    marginRight: spacing.sm,
    backgroundColor: colors.background,
  },
  filterChipText: {
    color: colors.textSecondary,
  },
  activeFilterChip: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  activeFilterText: {
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 80,
  },
  card: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardContent: {
    overflow: 'hidden',
    borderRadius: borderRadius.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.primaryLight + '30',
  },
  avatarIcon: {
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.primary,
  },
  headerInfo: {
    flex: 1,
  },
  volunteerName: {
    fontSize: typography.subtitle1.fontSize,
    fontWeight: '600',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  badgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    marginLeft: spacing.xxs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    ...typography.caption,
    marginLeft: spacing.xxs,
    color: colors.textSecondary,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
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
  divider: {
    marginVertical: spacing.sm,
  },
  bio: {
    ...typography.body2,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  statText: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '500',
    marginLeft: spacing.xxs,
  },
  skillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  skillChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.primaryLight + '15',
  },
  skillChipText: {
    ...typography.caption,
    color: colors.primary,
  },
  selectedSkillChip: {
    backgroundColor: colors.primary + '30',
  },
  selectedSkillText: {
    color: colors.primary,
    fontWeight: '600',
  },
  connectButton: {
    margin: spacing.md,
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
    marginBottom: spacing.lg,
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
    ...typography.caption,
    color: colors.textSecondary,
  },
  messagePreview: {
    marginBottom: spacing.xs,
  },
  messageText: {
    ...typography.body2,
    color: colors.text,
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  communityName: {
    fontSize: typography.subtitle1.fontSize,
    fontWeight: '600',
  },
  categoryContainer: {
    marginBottom: spacing.xxs,
  },
  categoryChip: {
    backgroundColor: colors.primaryLight + '15',
  },
  categoryChipText: {
    color: colors.primary,
  },
  communityContent: {
    padding: spacing.md,
  },
  communityDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  tagChip: {
    backgroundColor: colors.primary + '15',
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    height: 26,
  },
  tagChipText: {
    ...typography.caption,
    color: colors.primary,
  },
  moreTags: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  communityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  createdText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  leaveButton: {
    borderColor: colors.border,
    flex: 1,
    marginRight: spacing.xs,
  },
  joinButton: {
    backgroundColor: colors.primary,
    flex: 1,
    marginRight: spacing.xs,
  },
  chatButton: {
    backgroundColor: colors.primary,
    flex: 1,
    marginLeft: spacing.xs,
  },
  buttonLabel: {
    color: 'white',
    fontWeight: '600',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium
  },
  messageBadge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  messageBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  communityBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMessagesCard: {
    backgroundColor: colors.surfaceVariant + '40',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  noMessagesText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontStyle: 'italic',
  },
  cardWrapper: {
    marginBottom: spacing.md,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  conversationAvatarImage: {
    backgroundColor: colors.primaryLight + '30',
  },
  conversationAvatarIcon: {
    backgroundColor: colors.primary,
  },
  levelProgressContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  levelProgressText: {
    ...typography.body2,
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
  levelProgressBarBackground: {
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xxs,
  },
  levelProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  levelProgressTextXP: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
  },
});
