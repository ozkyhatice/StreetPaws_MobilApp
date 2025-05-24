import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Text,
  Searchbar,
  Avatar,
  Chip,
  Surface,
  TouchableRipple,
  Divider,
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
import { BlurView } from 'expo-blur';

type MessagesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  lastMessage?: Message;
  unreadCount: number;
  isCommunityChat: boolean;
  members?: string[];
}

export default function MessagesScreen() {
  const navigation = useNavigation<MessagesScreenNavigationProp>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'direct' | 'community'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const messagingService = MessagingService.getInstance();

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;
      
      try {
        const allConversations = await messagingService.getUserConversations(user.uid);
        setConversations(allConversations);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setIsLoading(false);
      }
    };

    fetchConversations();

    const unsubscribe = messagingService.subscribeToNewMessages(user?.uid, () => {
      fetchConversations();
    });

    return () => {
      unsubscribe?.();
    };
  }, [user]);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
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

  const renderConversation = ({ item, index }: { item: Conversation; index: number }) => {
    const hasUnread = item.unreadCount > 0;
    const hasMessages = item.lastMessage && item.lastMessage.content !== 'Henüz mesaj yok';
    const isFirst = index === 0;

    return (
      <TouchableRipple
        onPress={() => navigation.navigate('Chat', {
          conversationId: item.id,
          recipientId: item.otherUser.id,
          recipientName: item.otherUser.name,
          isCommunityChat: item.isCommunityChat
        })}
        style={[
          styles.conversationContainer,
          isFirst && styles.firstConversation
        ]}
      >
        <LinearGradient
          colors={[
            hasUnread ? colors.primary + '10' : colors.background,
            colors.background
          ]}
          style={styles.conversationGradient}
        >
          <View style={styles.conversationContent}>
            <View style={styles.avatarContainer}>
              {item.otherUser.avatar ? (
                <Avatar.Image
                  source={{ uri: item.otherUser.avatar }}
                  size={60}
                  style={[
                    styles.avatar,
                    hasUnread && styles.unreadAvatar
                  ]}
                />
              ) : (
                <LinearGradient
                  colors={[
                    item.isCommunityChat ? colors.success : colors.primary,
                    item.isCommunityChat ? colors.success + '80' : colors.primary + '80'
                  ]}
                  style={styles.avatarGradient}
                >
                  <Avatar.Icon
                    icon={item.isCommunityChat ? "account-group" : "account"}
                    size={60}
                    style={styles.avatarIcon}
                    color="white"
                  />
                </LinearGradient>
              )}
              {hasUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>

            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text 
                  style={[
                    styles.userName,
                    hasUnread && styles.unreadText
                  ]} 
                  numberOfLines={1}
                >
                  {item.otherUser.name}
                </Text>
                {item.isCommunityChat && (
                  <Chip 
                    style={styles.communityChip}
                    textStyle={styles.communityChipText}
                  >
                    Topluluk
                  </Chip>
                )}
              </View>

              <View style={styles.messagePreview}>
                {hasMessages ? (
                  <>
                    <Text 
                      style={[
                        styles.previewText,
                        hasUnread && styles.unreadText
                      ]} 
                      numberOfLines={1}
                    >
                      {item.isCommunityChat && item.lastMessage?.senderId !== user?.uid 
                        ? `${item.lastMessage?.senderName}: ${item.lastMessage?.content}`
                        : item.lastMessage?.senderId === user?.uid 
                          ? `Sen: ${item.lastMessage?.content}`
                          : item.lastMessage?.content}
                    </Text>
                    <Text style={styles.messageTime}>
                      {formatMessageTime(item.lastMessage!.createdAt)}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.emptyText}>
                    {item.isCommunityChat ? 'Topluluk sohbeti başlat' : 'Yeni sohbet başlat'}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableRipple>
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
            <BlurView intensity={30} style={styles.searchBlur}>
              <Searchbar
                placeholder="Mesajlarda ara..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchbar}
                icon={({size, color}) => <Search size={20} color={colors.textSecondary} />}
              />
            </BlurView>
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
        renderItem={renderConversation}
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
  searchBlur: {
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
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
  conversationContainer: {
    backgroundColor: colors.background,
  },
  firstConversation: {
    marginTop: spacing.xs,
  },
  conversationGradient: {
    paddingVertical: spacing.sm,
  },
  conversationContent: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    backgroundColor: colors.primaryLight + '30',
  },
  unreadAvatar: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    backgroundColor: 'transparent',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  userName: {
    fontSize: typography.subtitle1.fontSize,
    color: colors.text,
    flex: 1,
  },
  communityChip: {
    backgroundColor: colors.success + '20',
    height: 22,
  },
  communityChipText: {
    fontSize: 11,
    color: colors.success,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewText: {
    fontSize: typography.body2.fontSize,
    color: colors.textSecondary,
    flex: 1,
  },
  unreadText: {
    color: colors.text,
    fontWeight: '600',
  },
  messageTime: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: typography.body2.fontSize,
    color: colors.textSecondary,
    fontStyle: 'italic',
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