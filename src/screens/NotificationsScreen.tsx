import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Text, Avatar, Divider, Badge, IconButton, Surface, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../hooks/useAuth';
import { NotificationService, NotificationData } from '../services/notificationService';
import { CommunityService } from '../services/communityService';
import { colors, spacing, borderRadius, shadows, typography } from '../config/theme';
import { AlertCircle, CheckCircle, X, Bell, Users, ArrowLeft, Clock } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSelector, useDispatch } from 'react-redux';
import { markAsRead, markAllAsRead } from '../store/notifications/notificationSlice';

type NotificationsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const NotificationsScreen = () => {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const notificationService = NotificationService.getInstance();
  const communityService = CommunityService.getInstance();

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get general notifications
      const userNotifications = await notificationService.getUserNotifications(user.uid);
      setNotifications(userNotifications);
      
      // Get join requests for communities where user is admin
      const joinRequestsData = await communityService.getJoinRequestsForAdmin(user.uid);
      setJoinRequests(joinRequestsData);
      
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const markNotificationRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      await notificationService.markNotificationAsRead(notificationId, user.uid);
      dispatch(markAsRead(notificationId));
      
      // Update local state too
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? {...n, read: true} : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleAcceptJoinRequest = async (communityId: string, userId: string) => {
    if (!user) return;
    
    try {
      await communityService.approveJoinRequest(communityId, userId, user.uid);
      
      // Remove from UI
      setJoinRequests(prev => 
        prev.filter(req => !(req.communityId === communityId && req.userId === userId))
      );
    } catch (error) {
      console.error('Error accepting join request:', error);
    }
  };

  const handleRejectJoinRequest = async (communityId: string, userId: string) => {
    if (!user) return;
    
    try {
      await communityService.rejectJoinRequest(communityId, userId, user.uid);
      
      // Remove from UI
      setJoinRequests(prev => 
        prev.filter(req => !(req.communityId === communityId && req.userId === userId))
      );
    } catch (error) {
      console.error('Error rejecting join request:', error);
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: tr });
  };

  const renderJoinRequest = ({ item }: { item: any }) => (
    <Surface style={styles.requestCard}>
      <View style={styles.requestContent}>
        <View style={styles.requestHeader}>
          <Avatar.Image 
            size={50} 
            source={{ uri: item.userPhotoURL || 'https://ui-avatars.com/api/?background=random' }} 
          />
          
          <View style={styles.requestInfo}>
            <Text style={styles.requestTitle}>Topluluk Katılım İsteği</Text>
            <Text style={styles.requestText}>
              <Text style={styles.userName}>{item.userName}</Text> kullanıcısı{' '}
              <Text style={styles.communityName}>{item.communityName}</Text> topluluğuna 
              katılmak istiyor
            </Text>
            <Text style={styles.timeAgo}>{getTimeAgo(item.timestamp)}</Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            style={styles.acceptButton}
            onPress={() => handleAcceptJoinRequest(item.communityId, item.userId)}
          >
            Kabul Et
          </Button>
          
          <Button 
            mode="outlined" 
            style={styles.rejectButton}
            onPress={() => handleRejectJoinRequest(item.communityId, item.userId)}
          >
            Reddet
          </Button>
        </View>
      </View>
    </Surface>
  );

  const renderNotification = ({ item }: { item: NotificationData }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        item.read ? styles.readNotification : styles.unreadNotification
      ]}
      onPress={() => markNotificationRead(item.id || '')}
    >
      <View style={styles.notificationIconContainer}>
        {item.type === 'success' ? (
          <CheckCircle size={24} color={colors.success} />
        ) : item.type === 'warning' ? (
          <AlertCircle size={24} color={colors.warning} />
        ) : item.type === 'error' ? (
          <X size={24} color={colors.error} />
        ) : (
          <Bell size={24} color={colors.info} />
        )}
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{getTimeAgo(item.timestamp)}</Text>
      </View>
      
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  // Combine join requests and notifications for the list
  const combinedData = [
    ...joinRequests.map(item => ({
      ...item,
      type: 'join_request',
      id: `jr_${item.communityId}_${item.userId}`
    })),
    ...notifications
  ];
  
  // Sort by timestamp (newest first)
  const sortedData = combinedData.sort((a, b) => {
    const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
    const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
    return dateB - dateA;
  });

  // Create sections for the FlatList
  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'join_request') {
      return renderJoinRequest({ item });
    } else {
      return renderNotification({ item });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Bildirimler</Text>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => {
              if (user) {
                dispatch(markAllAsRead());
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
              }
            }}
          >
            <Text style={styles.markAllText}>Tümünü Okundu İşaretle</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
        </View>
      ) : sortedData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bell size={60} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Henüz bildiriminiz bulunmuyor</Text>
        </View>
      ) : (
        <FlatList
          data={sortedData}
          renderItem={renderItem}
          keyExtractor={item => item.id || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <Divider style={styles.divider} />}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              colors={[colors.primary]} 
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

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
    backgroundColor: colors.background,
    ...shadows.small,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: spacing.sm,
  },
  markAllText: {
    color: colors.primary,
    ...typography.body2,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.background,
  },
  readNotification: {
    backgroundColor: colors.background,
  },
  unreadNotification: {
    backgroundColor: colors.primaryLight + '10',
  },
  notificationIconContainer: {
    marginRight: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...typography.subtitle1,
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  notificationMessage: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  notificationTime: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
    alignSelf: 'center',
  },
  divider: {
    marginVertical: spacing.sm,
  },
  requestCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.surface,
    ...shadows.small,
  },
  requestContent: {
    padding: spacing.md,
  },
  requestHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  requestInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  requestTitle: {
    ...typography.subtitle1,
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  requestText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  userName: {
    fontWeight: 'bold',
    color: colors.text,
  },
  communityName: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  timeAgo: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  acceptButton: {
    backgroundColor: colors.primary,
  },
  rejectButton: {
    borderColor: colors.error,
  },
});

export default NotificationsScreen;
