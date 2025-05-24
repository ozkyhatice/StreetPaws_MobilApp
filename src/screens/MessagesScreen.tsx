import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Searchbar,
  Avatar,
  Chip,
  Surface,
  TouchableRipple,
  Divider,
  Badge,
} from 'react-native-paper';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../hooks/useAuth';
import { MessagingService } from '../services/messagingService';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Users, MessageCircle, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type MessagesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string | any; // Allow firebase Timestamp
  isRead: boolean;
  isDelivered: boolean;
  attachments?: string[];
  type?: string;
  status?: string;
  messageType?: string;
  linkPreview?: {
    title?: string;
    description?: string;
    imageUrl?: string;
  };
}

interface Conversation {
  id: string;
  // otherUser is only present for direct messages fetched via getUserConversations
  otherUser?: { 
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  lastMessage?: { // Simplified last message based on getAllConversations return
    content: string;
    senderId: string;
    senderName?: string;
    createdAt: string | any; // Allow firebase Timestamp
  } | null;
  unreadCount: { [userId: string]: number }; // Unread count per user
  isCommunityChat?: boolean; // Make optional as it might be derived
  members?: string[];
  type: 'DIRECT' | 'GROUP'; // Explicit type
  participants: string[]; // Array of user IDs
  name?: string; // Group name
  photoURL?: string; // Group photo
  lastMessageAt?: string | any; // Timestamp of last message/activity
  communityId?: string; // For GROUP type
}

interface ProcessedConversation extends Conversation {
  displayName: string;
  photoURL: string;
  messagePreview: string;
  unreadCount: number; // Flatten unread count for current user
}

export default function MessagesScreen() {
  const navigation = useNavigation<MessagesScreenNavigationProp>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<ProcessedConversation[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'direct' | 'community'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const messagingService = MessagingService.getInstance();

  // Helper to process raw conversation data
  const processConversation = (conversation: Conversation, currentUserId: string): ProcessedConversation => {
    const isCommunity = conversation.type === 'GROUP';
    
    // Determine display name and photo
    let displayName = 'Unknown';
    let photoURL = '';

    if (isCommunity) {
      displayName = conversation.name || 'Unknown Community';
      photoURL = conversation.photoURL || '';
    } else if (conversation.otherUser) { // Use otherUser if available (from getUserConversations type)
       displayName = conversation.otherUser.name || 'Unknown User';
       photoURL = conversation.otherUser.avatar || '';
    } else if (conversation.participants) { // Fallback using participants if otherUser not directly available
       const otherParticipantId = conversation.participants.find(id => id !== currentUserId);
       // Note: This won't give displayName/photoURL directly, might need a separate fetch or update Conversation type
       displayName = `User: ${otherParticipantId?.substring(0, 6)}...`
    }

    // Determine message preview
    let messagePreview = '';
    if (conversation.lastMessage) {
      if (isCommunity && conversation.lastMessage.senderId !== currentUserId) {
        messagePreview = `${conversation.lastMessage.senderName || 'Someone'}: ${conversation.lastMessage.content}`;
      } else {
        messagePreview = conversation.lastMessage.content || '';
      }
    } else {
      messagePreview = isCommunity 
        ? 'Topluluk sohbeti başlat' 
        : 'Mesajlaşma başlat';
    }

    // Get unread count for the current user
    const unreadCount = conversation.unreadCount?.[currentUserId] || 0;
    
    return {
      ...conversation,
      isCommunityChat: isCommunity,
      displayName,
      photoURL,
      messagePreview,
      unreadCount,
    };
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        if (!user) return;
        
        // Use the corrected getAllConversations from MessagingService
        const conversationsList = await messagingService.getAllConversations(user.uid);
        
        const processedConversations = conversationsList.map(conv => processConversation(conv, user.uid));
        
        // Sorting is already done in getAllConversations, but re-sort here for safety
        processedConversations.sort((a, b) => {
          const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return timeB - timeA;
        });
        
        setConversations(processedConversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
    
    // Subscribe to conversation list updates
    const unsubscribe = messagingService.subscribeToConversationUpdates(
      user?.uid || '',
      (updatedConversations) => {
        const processedAndSorted = updatedConversations
          .map(conv => processConversation(conv, user?.uid || ''))
          .sort((a, b) => {
            const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return timeB - timeA;
          });
        
        setConversations(processedAndSorted);
      }
    );
    
    return () => unsubscribe?.();
  }, [user]);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.messagePreview.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedTab === 'direct') {
      return matchesSearch && !conv.isCommunityChat;
    } else if (selectedTab === 'community') {
      return matchesSearch && conv.isCommunityChat;
    }
    
    return matchesSearch;
  });

  const getTotalUnreadCount = () => {
    return conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  };

  const getDirectUnreadCount = () => {
    return conversations
      .filter(conv => !conv.isCommunityChat)
      .reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  };

  const getCommunityUnreadCount = () => {
    return conversations
      .filter(conv => conv.isCommunityChat)
      .reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  };

  const formatMessageTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'HH:mm');
    }
    
    if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return format(date, 'EEEE', { locale: tr });
    }
    
    return format(date, 'd MMM', { locale: tr });
  };

  const renderConversationItem = ({ item }: { item: ProcessedConversation }) => {
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigation.navigate('Chat', {
          conversationId: item.isCommunityChat ? item.id : item.id,
          recipientId: item.isCommunityChat ? item.id : item.otherUser?.id,
          recipientName: item.displayName,
          isCommunityChat: item.isCommunityChat
        })}
      >
        <Avatar.Image
          source={{ uri: item.photoURL || 'https://picsum.photos/200' }}
          size={50}
        />
        {item.unreadCount > 0 && (
          <Badge
            style={styles.badge}
            size={22}
          >
            {item.unreadCount}
          </Badge>
        )}
        <View style={styles.conversationDetails}>
          <Text style={styles.conversationTitle}>{item.displayName}</Text>
          <Text numberOfLines={1} style={styles.conversationPreview}>
            {item.messagePreview}
          </Text>
        </View>
        <Text style={styles.timeText}>
          {item.lastMessage?.createdAt ? formatMessageTime(item.lastMessage.createdAt) : 'Invalid Date'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MessageCircle size={64} color={colors.primary} style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
      <Text style={styles.emptyText}>
        Gönüllüler veya topluluklar ile iletişime geçerek sohbet başlatabilirsiniz.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <LinearGradient
        colors={[colors.primary + '15', colors.background]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Mesajlar</Text>
            {getTotalUnreadCount() > 0 && (
              <View style={styles.totalUnreadBadge}>
                <Text style={styles.totalUnreadText}>{getTotalUnreadCount()}</Text>
              </View>
            )}
          </View>

          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Mesajlarda ara..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
              icon={({size, color}) => <Search size={20} color={colors.textSecondary} />}
            />
          </View>
        </View>

        <View style={styles.tabContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScroll}
          >
            <Chip
              selected={selectedTab === 'all'}
              onPress={() => setSelectedTab('all')}
              style={[
                styles.tab,
                selectedTab === 'all' && styles.selectedTab
              ]}
              textStyle={[
                styles.tabText,
                selectedTab === 'all' && styles.selectedTabText
              ]}
            >
              Tümü ({conversations.length})
            </Chip>

            <Chip
              selected={selectedTab === 'direct'}
              onPress={() => setSelectedTab('direct')}
              style={[
                styles.tab,
                selectedTab === 'direct' && styles.selectedTab
              ]}
              textStyle={[
                styles.tabText,
                selectedTab === 'direct' && styles.selectedTabText
              ]}
              icon={({size, color}) => (
                <MessageCircle 
                  size={16} 
                  color={selectedTab === 'direct' ? colors.primary : colors.textSecondary} 
                />
              )}
            >
              Direkt ({conversations.filter(c => !c.isCommunityChat).length})
              {getDirectUnreadCount() > 0 && (
                <Text style={styles.tabBadge}> • {getDirectUnreadCount()}</Text>
              )}
            </Chip>

            <Chip
              selected={selectedTab === 'community'}
              onPress={() => setSelectedTab('community')}
              style={[
                styles.tab,
                selectedTab === 'community' && styles.selectedTab
              ]}
              textStyle={[
                styles.tabText,
                selectedTab === 'community' && styles.selectedTabText
              ]}
              icon={({size, color}) => (
                <Users 
                  size={16} 
                  color={selectedTab === 'community' ? colors.primary : colors.textSecondary} 
                />
              )}
            >
              Topluluklar ({conversations.filter(c => c.isCommunityChat).length})
              {getCommunityUnreadCount() > 0 && (
                <Text style={styles.tabBadge}> • {getCommunityUnreadCount()}</Text>
              )}
            </Chip>
          </ScrollView>
        </View>
      </LinearGradient>

      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmptyList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? spacing.xl : spacing.md,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  totalUnreadBadge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  totalUnreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: spacing.sm,
  },
  searchbar: {
    borderRadius: borderRadius.medium,
    elevation: 0,
    backgroundColor: colors.surfaceVariant + '80',
    height: 45,
  },
  tabContainer: {
    marginBottom: spacing.sm,
  },
  tabScroll: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.xs,
  },
  tab: {
    backgroundColor: colors.surfaceVariant + '80',
    borderRadius: borderRadius.medium,
  },
  selectedTab: {
    backgroundColor: colors.primary + '15',
  },
  tabText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  selectedTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabBadge: {
    color: colors.error,
    fontWeight: '600',
  },
  list: {
    paddingTop: spacing.xs,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  conversationDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  conversationTitle: {
    ...typography.subtitle1,
    fontWeight: '600',
    color: colors.text,
  },
  conversationPreview: {
    fontSize: typography.body2.fontSize,
    color: colors.textSecondary,
  },
  timeText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border + '20',
    marginVertical: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.md,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: typography.h6.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.body1.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});