import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Keyboard,
  Alert,
  Modal,
  Linking,
  TextInput,
} from 'react-native';
import { Text, Avatar, IconButton, Divider, Badge, Dialog, Portal, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import { useAuth } from '../hooks/useAuth';
import { MessagingService } from '../services/messagingService';
import { UserService } from '../services/userService';
import { CommunityService } from '../services/communityService';
import { ChevronLeft, Send, Image as ImageIcon, Paperclip, Check, CheckCheck, Clock, Smile, Link } from 'lucide-react-native';
import { RootStackParamList } from '../types/navigation';
import { Message } from '../types/community';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { getDoc, doc, onSnapshot, addDoc, collection, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';

type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

// Common emojis
const EMOJIS = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️', 
                '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', 
                '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', 
                '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕',
                '👍', '👎', '👏', '🙌', '🤝', '👊', '✌️', '🤞', '🤘', '👌'];

type MessageStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'PENDING';

export default function ChatScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const route = useRoute<ChatScreenRouteProp>();
  const { conversationId, recipientId, recipientName, isCommunityChat } = route.params;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [recipient, setRecipient] = useState<any>(null);
  const [community, setCommunity] = useState<any>(null);
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recipientLastSeen, setRecipientLastSeen] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [linkDialogVisible, setLinkDialogVisible] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  
  const messagingService = MessagingService.getInstance();
  const userService = UserService.getInstance();
  const communityService = CommunityService.getInstance();
  
  const flatListRef = useRef<FlatList>(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const inputHeight = useRef(new Animated.Value(50)).current;
  
  // Add retry state for uploads
  const [uploadRetries, setUploadRetries] = useState(0);
  const MAX_RETRIES = 3;

  // Add storage rules test state
  const [storageRulesTested, setStorageRulesTested] = useState(false);

  // Add state for upload debugging
  const [uploadErrorDetails, setUploadErrorDetails] = useState<string | null>(null);

  // Add state for storage errors and fallback mode
  const [storageErrorOccurred, setStorageErrorOccurred] = useState(false);
  const [usingFallbackMode, setUsingFallbackMode] = useState(false);

  const communityConversationId = isCommunityChat ? `community_${recipientId}` : conversationId;

  const [userNamesCache, setUserNamesCache] = useState<{ [userId: string]: string }>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        console.log(`ChatScreen: Current user ID is ${user.uid}`);
        
        // Validate recipient ID
        if (!recipientId || recipientId.trim() === '') {
          console.error('Invalid or empty recipient ID');
          return;
        }
        
        // Load messages
        let messagesList: Message[] = [];
        
        // Get messages based on conversation type
        messagesList = await messagingService.getConversationMessages(
          communityConversationId,
          isCommunityChat,
          recipientId
        );
        
        // Filter messages to only include those from groups the user has joined
        if (isCommunityChat) {
          const userJoinedDate = community?.joinedAt || new Date().toISOString();
          messagesList = messagesList.filter(msg => new Date(msg.createdAt) >= new Date(userJoinedDate));
        }

        // Sort messages by date, ensuring the latest message is at the top
        messagesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        console.log(`Fetched ${messagesList.length} messages for ${isCommunityChat ? 'community' : 'direct'} conversation`);
        
        // Get recipient details (user or community)
        if (isCommunityChat) {
          try {
            const communityData = await communityService.getCommunityById(recipientId);
            if (communityData) {
              console.log(`Found community: ${communityData.name}`);
              setCommunity(communityData);
            }
          } catch (communityError) {
            console.error('Error loading community:', communityError);
          }
        } else {
          try {
            const userData = await userService.getUserById(recipientId);
            if (userData) {
              console.log(`Found recipient user: ${userData.displayName || 'Unknown User'}`);
              setRecipient(userData);
              
              // Get online status from presence system
              const presenceDoc = await getDoc(doc(db, 'userPresence', recipientId));
              if (presenceDoc.exists()) {
                const presenceData = presenceDoc.data();
                const isOnline = presenceData.state === 'online' && 
                               (new Date().getTime() - presenceData.lastChanged.toDate().getTime()) < 300000; // 5 minutes
                
                setIsRecipientOnline(isOnline);
                if (!isOnline && presenceData.lastChanged) {
                  setRecipientLastSeen(presenceData.lastChanged.toDate().toISOString());
                }
              }
            }
          } catch (userError) {
            console.error('Error loading user:', userError);
          }
        }
        
        setMessages(messagesList);
        
        // Mark messages as read
        if (communityConversationId && !isCommunityChat) {
          messagingService.markMessagesAsRead(communityConversationId, user.uid);
        } else if (isCommunityChat && recipientId) {
          messagingService.markCommunityMessagesAsRead(recipientId, user.uid);
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Improved real-time listener for new messages
    const unsubscribe = messagingService.subscribeToMessages(
      communityConversationId,
      recipientId,
      user?.uid || '',
      isCommunityChat || false,
      (newMessages) => {
        // Apply sorting to ensure newest messages are at the bottom
        const sortedMessages = [...newMessages].sort((a, b) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        setMessages(sortedMessages);
        
        // Mark messages as read when received - with a slight delay to ensure UI updates first
        setTimeout(() => {
          if (communityConversationId && !isCommunityChat) {
            messagingService.markMessagesAsRead(communityConversationId, user?.uid || '');
          } else if (isCommunityChat && recipientId) {
            messagingService.markCommunityMessagesAsRead(recipientId, user?.uid || '');
          }
        }, 500);
      }
    );
    
    // Set up presence listener for direct chats
    let presenceUnsubscribe: (() => void) | undefined;
    if (!isCommunityChat && recipientId) {
      presenceUnsubscribe = onSnapshot(doc(db, 'userPresence', recipientId), (doc) => {
        if (doc.exists()) {
          const presenceData = doc.data();
          const isOnline = presenceData.state === 'online' && 
                         (new Date().getTime() - presenceData.lastChanged.toDate().getTime()) < 300000;
          
          setIsRecipientOnline(isOnline);
          if (!isOnline && presenceData.lastChanged) {
            setRecipientLastSeen(presenceData.lastChanged.toDate().toISOString());
          }
        }
      });
    }
    
    // Simulate typing indicator occasionally
    const typingInterval = setInterval(() => {
      if (Math.random() > 0.9 && !isCommunityChat) {
        setIsTyping(true);
        
        // Animate the typing indicator
        Animated.loop(
          Animated.sequence([
            Animated.timing(typingAnimation, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(typingAnimation, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        ).start();
        
        // Stop typing after 2-3 seconds
        setTimeout(() => setIsTyping(false), 2000 + Math.random() * 1000);
      }
    }, 10000);
    
    // Listen for keyboard events to adjust input height
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      Animated.timing(inputHeight, {
        toValue: 70,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(inputHeight, {
        toValue: 50,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });

    // Check if Firebase storage rules allow uploads
    const checkStoragePermissions = async () => {
      if (!user || storageRulesTested) return;
      
      try {
        const storage = getStorage();
        // Try to upload a tiny test file
        const testRef = ref(storage, `permissions_test/${user.uid}_${Date.now()}.txt`);
        const testBytes = new Uint8Array([0, 1, 2, 3]);
        await uploadBytes(testRef, testBytes);
        console.log("Storage permissions test: Success");
        setStorageRulesTested(true);
        setUsingFallbackMode(false);
      } catch (error) {
        console.warn("Storage permissions test failed:", error);
        setStorageRulesTested(true);
        setStorageErrorOccurred(true);
        setUsingFallbackMode(true);
      }
    };
    
    checkStoragePermissions();

    // Create community conversation document if needed
    if (isCommunityChat && recipientId) {
      ensureCommunityConversationDoc(recipientId);
    }

    return () => {
      unsubscribe?.();
      presenceUnsubscribe?.();
      clearInterval(typingInterval);
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [user, communityConversationId, recipientId, isCommunityChat]);

  useEffect(() => {
    if (!user || !communityConversationId) return;

    // Subscribe to message read status updates
    const unsubscribe = onSnapshot(
      doc(db, 'conversations', communityConversationId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const lastReadTimestamps = data.lastReadTimestamps || {};
          
          // Update message read status
          setMessages(prev => prev.map(msg => {
            if (msg.senderId === user.uid) {
              const recipientLastRead = lastReadTimestamps[msg.recipientId];
              if (recipientLastRead && new Date(recipientLastRead) >= new Date(msg.createdAt)) {
                return { ...msg, isRead: true, status: 'READ' };
              } else if (msg.status === 'SENT') {
                return { ...msg, status: 'DELIVERED' };
              }
            } else if (msg.isRead !== undefined) {
              // For incoming messages, update isRead if changed in Firestore
              return { ...msg };
            }
            return msg;
          }));
        }
      },
      (error) => {
        console.error('Error listening to message read status:', error);
      }
    );

    return () => unsubscribe();
  }, [user, communityConversationId]);

  // Update last read timestamp when messages are viewed
  const markMessagesAsRead = async () => {
    if (!user || !communityConversationId) return;

    try {
      const conversationRef = doc(db, 'conversations', communityConversationId);
      await updateDoc(conversationRef, {
        [`lastReadTimestamps.${user.uid}`]: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Call markMessagesAsRead when messages are viewed
  useEffect(() => {
    if (messages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages.length]);

  const handleSend = async () => {
    const messageContent = newMessage.trim();
    if (newMessage !== '') setNewMessage('');
    if (!user || (!messageContent && !selectedImage)) return;
    let imageUrl: string | undefined;
    if (selectedImage) {
      try {
        setUploading(true);
        imageUrl = await uploadImage(selectedImage);
        setUploading(false);
        setSelectedImage(null);
      } catch (uploadError) {
        setUploading(false);
        setSelectedImage(null);
        Alert.alert('Hata', 'Resim yüklenemedi.');
        if (!messageContent) return;
      }
    }
    const attachments = imageUrl ? [imageUrl] : [];
    const tempId = `temp_${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      senderId: user.uid,
      recipientId: recipientId,
      content: messageContent,
      createdAt: new Date().toISOString(),
      isRead: false,
      isDelivered: false,
      attachments,
      type: isCommunityChat ? 'GROUP' : 'DIRECT',
      conversationId: communityConversationId || '',
      status: 'SENDING'
    };
    setMessages(prev => [...prev, tempMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 10);
    try {
      let sentMessage;
      if (isCommunityChat) {
        sentMessage = await messagingService.sendGroupMessage(
          user.uid,
          recipientId,
          messageContent,
          user.displayName || '',
          attachments
        );
      } else {
        sentMessage = await messagingService.sendDirectMessage(
          user.uid,
          recipientId,
          messageContent,
          attachments
        );
      }
      setMessages(prev => prev.map(msg => msg.id === tempId ? { ...sentMessage, status: 'SENT' } : msg));
    } catch (error) {
      setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, status: 'FAILED' } : msg));
      Alert.alert('Hata', 'Mesaj gönderilemedi.');
    }
  };

  const handleLinkShare = async () => {
    if (!user || !linkUrl.trim()) return;
    
    try {
      setLinkDialogVisible(false);
      
      console.log(`Sending link to ${isCommunityChat ? 'community' : 'user'} ${recipientId}: ${linkUrl.trim()}`);
      
      // Create a temporary message for optimistic UI update
      const tempId = `temp_${Date.now()}`;
      const linkPreview = {
        title: linkTitle.trim() || linkUrl.trim(),
        description: linkDescription.trim(),
        imageUrl: '' // We don't have a preview image generation service
      };
      
      const tempMessage: Message = {
        id: tempId,
        senderId: user.uid,
        recipientId: recipientId,
        content: linkUrl.trim(),
        createdAt: new Date().toISOString(),
        isRead: false,
        isDelivered: false,
        attachments: [],
        type: isCommunityChat ? 'GROUP' : 'DIRECT',
        conversationId: communityConversationId || '',
        status: 'SENT' as MessageStatus,
        messageType: 'LINK',
        linkPreview
      };
      
      // Update UI optimistically for better user experience
      setMessages(prev => [...prev, tempMessage]);
      
      // Clear input immediately
      setLinkUrl('');
      setLinkTitle('');
      setLinkDescription('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 10);
      
      // Actually send the message
      try {
        const sentMessage = await messagingService.sendLinkMessage(
          user.uid,
          recipientId,
          linkUrl.trim(),
          linkPreview,
          isCommunityChat
        );
        
        // Replace temporary message with actual message
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? sentMessage : msg
        ));
      } catch (error) {
        console.error('Error sending link message:', error);
        
        // Mark the temp message as failed
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'FAILED' as MessageStatus } : msg
        ));
        
        Alert.alert('Hata', 'Bağlantı gönderilemedi. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Error in handleLinkShare:', error);
      Alert.alert('Hata', 'Bağlantı gönderilirken bir sorun oluştu.');
    }
  };

  const formatTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    
    // Same day - show time only
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Within last 7 days - show day name
    const daysDiff = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' }) + ' ' + 
             messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show date
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
           messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatLastSeen = (timestamp: string) => {
    const lastSeenDate = new Date(timestamp);
    const now = new Date();
    
    // Within last hour
    const minutesDiff = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    if (minutesDiff < 60) {
      return `son görülme ${minutesDiff} dakika önce`;
    }
    
    // Within today
    const hoursDiff = Math.floor(minutesDiff / 60);
    if (lastSeenDate.toDateString() === now.toDateString()) {
      return `son görülme bugün ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastSeenDate.toDateString() === yesterday.toDateString()) {
      return `son görülme dün ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Other days
    return `son görülme ${lastSeenDate.toLocaleDateString()}`;
  };

  // Updated getMessageStatus to properly show read/unread status
  const getMessageStatus = (message: Message) => {
    if (message.senderId !== user?.uid) return null;
    if (message.isRead || message.status === 'READ') {
      return <CheckCheck size={16} color={colors.success} />;
    } else if (message.isDelivered || message.status === 'DELIVERED') {
      return <Check size={16} color={colors.success} />;
    } else {
      return <Clock size={16} color={colors.textSecondary} />;
    }
  };

  // Render message function with local image handling
  // Update the renderMessage function to highlight unread messages
  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === user?.uid;
    const isUnread = !item.isRead && item.senderId !== user?.uid;
    
    // Check if this is a local image (fallback mode)
    const hasLocalImage = item.attachments && 
                        item.attachments.length > 0 && 
                        item.attachments[0].startsWith('local://');
    
    // Get sender name for community chats
    let senderName = 'Unknown User';
    if (!isCurrentUser && isCommunityChat) {
      if (item.senderName) {
        senderName = item.senderName;
      } else if (userNamesCache[item.senderId]) {
        senderName = userNamesCache[item.senderId];
      } else {
        // Fetch and cache sender name
        UserService.getInstance().getUserById(item.senderId).then(userData => {
          if (userData && userData.displayName) {
            setUserNamesCache(prev => ({ ...prev, [item.senderId]: userData.displayName }));
          }
        });
      }
    }
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
      ]}>
        {!isCurrentUser && (
          <Avatar.Image
            source={{ 
              uri: isCommunityChat 
                ? 'https://picsum.photos/200'  // Placeholder for community member
                : recipient?.photoURL || 'https://picsum.photos/200' 
            }}
            size={30}
            style={styles.messageAvatar}
          />
        )}
        
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          isUnread && styles.unreadMessageBubble
        ]}>
          {!isCurrentUser && isCommunityChat && (
            <Text style={styles.senderName}>{senderName}</Text>
          )}
          
          {isUnread && (
            <View style={styles.unreadIndicator} />
          )}
          
          {/* Handle both remote and local images */}
          {item.attachments && item.attachments.length > 0 && (
            <>
              {hasLocalImage ? (
                <View style={styles.localImageContainer}>
                  <Image 
                    source={{ uri: selectedImage || 'https://via.placeholder.com/200x150?text=Image+Not+Available' }}
                    style={styles.messageImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.localImageText}>
                    Resim yüklenemedi (sadece size görünür)
                  </Text>
                </View>
              ) : (
                <Image 
                  source={{ uri: item.attachments[0] }}
                  style={styles.messageImage}
                  resizeMode="contain"
                />
              )}
            </>
          )}
          
          {item.messageType === 'LINK' ? (
            <TouchableOpacity 
              style={styles.linkPreviewContainer}
              onPress={() => {
                const url = item.content;
                // Check if it's a community invite link
                if (url.includes('/invite/')) {
                  // Extract invite code
                  const inviteCode = url.split('/invite/')[1];
                  if (inviteCode) {
                    // Navigate to JoinByInvite screen with the code
                    navigation.navigate('JoinByInvite', { inviteCode });
                  } else {
                    Alert.alert('Hata', 'Geçersiz davet bağlantısı');
                  }
                } else {
                  // For regular URLs, open with Linking API
                  Linking.canOpenURL(url).then(supported => {
                    if (supported) {
                      Linking.openURL(url);
                    } else {
                      Alert.alert('Hata', 'Bu bağlantı açılamıyor: ' + url);
                    }
                  }).catch(err => {
                    console.error('Bağlantı açılırken hata oluştu:', err);
                    Alert.alert('Hata', 'Bağlantı açılırken bir sorun oluştu');
                  });
                }
              }}
            >
              <View style={styles.linkContent}>
                <Link size={16} color={isCurrentUser ? colors.background : colors.primary} style={styles.linkIcon} />
                <Text style={[
                  styles.linkTitle,
                  { color: isCurrentUser ? colors.background : colors.text }
                ]}>
                  {item.linkPreview?.title || item.content}
                </Text>
              </View>
              {item.linkPreview?.description && (
                <Text style={[
                  styles.linkDescription,
                  { color: isCurrentUser ? colors.background + 'DD' : colors.textSecondary }
                ]}>
                  {item.linkPreview.description}
                </Text>
              )}
              <Text style={[
                styles.linkUrl,
                { color: isCurrentUser ? colors.background + 'AA' : colors.textTertiary }
              ]}>
                {item.content}
              </Text>
            </TouchableOpacity>
          ) : item.content && item.content.trim() !== '' && (
            <Text style={[
              styles.messageText, 
              { color: isCurrentUser ? colors.background : colors.text }
            ]}>
              {item.content}
            </Text>
          )}
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime, 
              { color: isCurrentUser ? colors.background + '99' : colors.textSecondary }
            ]}>
              {formatTime(item.createdAt)}
            </Text>
            
            {isCurrentUser && (
              <View style={styles.messageStatus}>
                {getMessageStatus(item)}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };
  
  // Render date header for message groups
  const renderDateHeader = (date: string) => {
    return (
      <View style={styles.dateHeaderContainer}>
        <Text style={styles.dateHeaderText}>{date}</Text>
      </View>
    );
  };

  // Improved image picking with size validation and lower quality setting
  // Updated image picker with fixed deprecation warning
  const pickImage = async () => {
    try {
      // Request permissions first (often a cause of failures)
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("İzin Gerekli", "Fotoğraf seçebilmek için galeri izni gereklidir.");
        return;
      }
  
      // Use the updated API: MediaTypeOptions.Images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, // Lower quality for smaller file size
        exif: false, // Don't include EXIF data to reduce size
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        
        // Validate the image file if FileSystem is available
        try {
          const fileInfo = await FileSystem.getInfoAsync(selectedUri);
          
          if (!fileInfo.exists) {
            Alert.alert("Hata", "Seçilen dosya bulunamadı.");
            return;
          }
          
          // Check file size
          if (fileInfo.size > 5 * 1024 * 1024) { // 5MB limit
            Alert.alert(
              "Dosya Çok Büyük", 
              "Seçilen görsel 5MB'dan büyük. Lütfen daha küçük bir görsel seçin veya kırpma özelliğini kullanın."
            );
            return;
          }
          
          console.log("Image selected:", selectedUri, "Size:", fileInfo.size);
        } catch (error) {
          // If FileSystem fails, still allow upload but log the error
          console.warn("FileSystem info error:", error);
          console.log("Image selected:", selectedUri);
        }
        
        setSelectedImage(selectedUri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Hata", "Fotoğraf seçilirken bir sorun oluştu.");
    }
  };

  // Simplified image upload function with better error handling
  const uploadImage = async (uri: string): Promise<string> => {
    try {
      console.log("Starting image upload process...");
      setUploading(true);
      setUploadErrorDetails(null);
      
      // If we're already in fallback mode, don't attempt real uploads
      if (usingFallbackMode) {
        console.log("Using fallback mode - skipping actual upload");
        // Create a placeholder URL that indicates this is a local image
        const localImageId = Date.now().toString();
        
        // Store the image in memory (in a real app, you'd use AsyncStorage)
        // This is just a demo placeholder
        console.log("Created local reference to image:", localImageId);
        
        // Simulate network delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Return a fake URL that we can detect later
        return `local://images/${localImageId}`;
      }
      
      // Regular upload flow
      const storage = getStorage();
      
      // Try multiple paths - sometimes the specific path is the issue
      const paths = [
        `chat_images/${user.uid}_${Date.now()}.jpg`,
        `uploads/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`,
        `images/${user.uid}/${Date.now()}.jpg`
      ];
      
      let uploadError = null;
      
      // Try each path until one works
      for (let i = 0; i < paths.length; i++) {
        try {
          const path = paths[i];
          console.log(`Trying upload path ${i+1}/${paths.length}: ${path}`);
          
          // Fetch the image and convert to blob
          const response = await fetch(uri);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          
          const blob = await response.blob();
          console.log("Image blob created, size:", blob.size);
          
          // Upload to Firebase Storage
          const storageRef = ref(storage, path);
          console.log("Starting direct upload...");
          const snapshot = await uploadBytes(storageRef, blob);
          console.log(`Upload successful to path: ${path}`);
          
          // Get the download URL
          const downloadURL = await getDownloadURL(snapshot.ref);
          console.log("Download URL:", downloadURL);
          
          // Reset error states on success
          setStorageErrorOccurred(false);
          setUsingFallbackMode(false);
          
          return downloadURL;
        } catch (e) {
          console.error(`Upload to path ${i+1} failed:`, e);
          uploadError = e;
          // Continue to the next path
        }
      }
      
      // If we get here, all paths failed
      throw uploadError || new Error("All upload paths failed");
    } catch (error) {
      console.error("Upload error:", error);
      
      // Set error states
      setStorageErrorOccurred(true);
      
      // Build error message
      let errorMessage = "Unknown error";
      let errorDetails = "";
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = "You don't have permission to upload files";
        errorDetails = "Firebase Storage rules may be too restrictive";
      } else if (error.code === 'storage/unknown') {
        errorMessage = "Firebase Storage error";
        errorDetails = "This could be due to network issues, incorrect Firebase configuration, or storage rules";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Save error details for debugging
      setUploadErrorDetails(`${errorMessage} (${error.code || 'no code'})`);
      
      // Ask if user wants to use fallback mode
      if (!usingFallbackMode) {
        const wantsFallback = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Resim Yükleme Sorunu',
            'Firebase Storage\'a resim yüklenirken bir sorun oluştu. Alternatif bir yöntem kullanmak ister misiniz?',
            [
              { text: 'İptal', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Alternatif Yöntemi Kullan', onPress: () => resolve(true) }
            ]
          );
        });
        
        if (wantsFallback) {
          setUsingFallbackMode(true);
          // Try again with fallback mode
          return uploadImage(uri);
        }
      }
      
      // Handle retries
      if (uploadRetries < MAX_RETRIES) {
        console.log(`Retry attempt ${uploadRetries + 1} of ${MAX_RETRIES}`);
        setUploadRetries(prev => prev + 1);
        
        Alert.alert(
          'Dosya Yükleme Hatası',
          `Resim yükleme başarısız oldu: ${errorMessage}. Tekrar denemek ister misiniz?`,
          [
            { 
              text: 'İptal', 
              style: 'cancel', 
              onPress: () => {
                setSelectedImage(null);
                
                // Offer to send message without image
                if (newMessage.trim()) {
                  Alert.alert(
                    'Mesajı Göndermek İster misiniz?',
                    'Resim olmadan sadece metni gönderebilirsiniz.',
                    [
                      { text: 'İptal', style: 'cancel' },
                      { text: 'Gönder', onPress: handleSend }
                    ]
                  );
                }
              }
            },
            { text: 'Tekrar Dene', onPress: () => handleSend() }
          ]
        );
      } else {
        setUploadRetries(0);
        setSelectedImage(null);
        
        // Show debug info for developer
        Alert.alert(
          'Dosya Yükleme Hatası',
          `Resim yüklenemedi: ${errorMessage}\n\nHata detayları: ${errorDetails}`,
          [
            { text: 'Tamam' },
            { 
              text: 'Hata Detayları', 
              onPress: () => {
                Alert.alert(
                  'Teknik Detaylar',
                  `Hata Kodu: ${error.code || 'Yok'}\nHata Mesajı: ${error.message || 'Yok'}\n` +
                  `\nLütfen bu bilgileri geliştiricinizle paylaşın.`
                );
              }
            }
          ]
        );
      }
      
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Add utility function to convert base64 to blob if needed
  const base64ToBlob = async (base64: string, mimeType: string): Promise<Blob> => {
    const response = await fetch(`data:${mimeType};base64,${base64}`);
    return response.blob();
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setEmojiPickerVisible(false);
  };

  const showLinkDialog = () => {
    setLinkDialogVisible(true);
  };

  const hideLinkDialog = () => {
    setLinkDialogVisible(false);
  };

  // After messages are loaded or updated, call markMessagesAsRead/markCommunityMessagesAsRead
  useEffect(() => {
    if (!user || !communityConversationId) return;
    if (messages.length > 0) {
      if (isCommunityChat) {
        messagingService.markCommunityMessagesAsRead(recipientId, user.uid);
      } else {
        messagingService.markMessagesAsRead(communityConversationId, user.uid);
      }
    }
  }, [messages.length, user, communityConversationId, isCommunityChat, recipientId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Show storage error notice if needed */}
      {storageErrorOccurred && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            Firebase Storage hatası: Resim yüklemesi şu anda çalışmıyor. 
            {usingFallbackMode ? ' Alternatif mod kullanılıyor.' : ''}
          </Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => setStorageErrorOccurred(false)}
          >
            <Text style={styles.errorButtonText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerInfo}
            onPress={() => {
              if (isCommunityChat) {
                navigation.navigate('CommunityDetail', { communityId: recipientId });
              } else {
                // Would navigate to user profile if implemented
                // navigation.navigate('UserProfile', { userId: recipientId });
              }
            }}
          >
            <Avatar.Image
              source={{ 
                uri: isCommunityChat 
                  ? community?.photoURL || 'https://picsum.photos/200'
                  : recipient?.photoURL || 'https://picsum.photos/200'
              }}
              size={40}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.headerTitle}>{recipientName}</Text>
              <Text style={styles.headerSubtitle}>
                {isCommunityChat 
                  ? `${community?.membersCount || 0} üye` 
                  : isRecipientOnline 
                    ? 'çevrimiçi'
                    : recipientLastSeen 
                      ? formatLastSeen(recipientLastSeen)
                      : 'çevrimdışı'
                }
              </Text>
              
              {isTyping && !isCommunityChat && (
                <View style={styles.typingContainer}>
                  <Text style={styles.typingText}>yazıyor</Text>
                  <Animated.View style={[
                    styles.typingDot,
                    {
                      opacity: typingAnimation,
                      transform: [{ scale: typingAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      })}]
                    }
                  ]} />
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          {isRecipientOnline && !isCommunityChat && (
            <Badge
              size={12}
              style={styles.onlineBadge}
            />
          )}
        </LinearGradient>
        
        <Divider />
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Mesajlar yükleniyor...</Text>
          </View>
        ) : (
          <>
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Image
                  source={require('../assets/paw.png')}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
                <Text style={styles.emptyText}>
                  {isCommunityChat 
                    ? 'Bu toplulukta henüz mesaj bulunmuyor. İlk mesajı göndererek sohbete başlayabilirsiniz.'
                    : 'Bu kişiyle henüz mesajlaşmadınız. İlk mesajı göndererek sohbete başlayabilirsiniz.'}
                </Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                showsVerticalScrollIndicator={false}
                initialNumToRender={15}
                maxToRenderPerBatch={10}
                windowSize={10}
                removeClippedSubviews={true}
                extraData={user?.uid}
                inverted={false}
              />
            )}
          </>
        )}
        
        {selectedImage && (
          <View style={styles.selectedImageContainer}>
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.selectedImagePreview} 
              resizeMode="contain"
            />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
            >
              <Text style={styles.removeImageText}>X</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <Animated.View
          style={[
            styles.inputContainer,
            { height: inputHeight }
          ]}
        >
          <TouchableOpacity
            style={styles.attachButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Paperclip
              size={24}
              color={uploading ? colors.textTertiary : colors.text}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.imageButton,
              usingFallbackMode && styles.fallbackModeButton
            ]}
            onPress={() => {
              if (usingFallbackMode) {
                Alert.alert(
                  'Alternatif Mod Aktif',
                  'Firebase Storage ile ilgili sorunlar nedeniyle, resimler gerçekten yüklenemiyor. Resimler sadece size görünecek.',
                  [
                    { text: 'İptal', style: 'cancel' },
                    { text: 'Yine de Seç', onPress: pickImage }
                  ]
                );
              } else {
                pickImage();
              }
            }}
            disabled={uploading}
          >
            <ImageIcon
              size={24}
              color={uploading ? colors.textTertiary : usingFallbackMode ? "#ff9800" : colors.text}
            />
            {usingFallbackMode && (
              <View style={styles.fallbackIndicator} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={showLinkDialog}
            disabled={uploading}
          >
            <Link
              size={24}
              color={uploading ? colors.textTertiary : colors.text}
            />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Mesaj yaz..."
              multiline
              style={styles.input}
              blurOnSubmit={false}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Enter') {
                  // Prevent default new line kaldırıldı
                  const messageToSend = newMessage;
                  setNewMessage('');
                  if (messageToSend.trim() || selectedImage) {
                    handleSend();
                  }
                  return true;
                }
              }}
            />
            
            <TouchableOpacity
              style={styles.emojiButton}
              onPress={() => setEmojiPickerVisible(!emojiPickerVisible)}
            >
              <Smile size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <IconButton
            icon="send"
            iconColor={colors.background}
            size={20}
            style={[
              styles.sendButton,
              (!newMessage.trim() && !selectedImage) ? styles.sendButtonDisabled : {}
            ]}
            disabled={(!newMessage.trim() && !selectedImage) || uploading}
            onPress={handleSend}
          />
        </Animated.View>
        
        {/* Emoji picker */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={emojiPickerVisible}
          onRequestClose={() => setEmojiPickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.emojiModalOverlay}
            activeOpacity={1}
            onPress={() => setEmojiPickerVisible(false)}
          >
            <View style={styles.emojiPickerContainer}>
              <View style={styles.emojiPickerHeader}>
                <Text style={styles.emojiPickerTitle}>Emoji Seç</Text>
                <TouchableOpacity onPress={() => setEmojiPickerVisible(false)}>
                  <Text style={styles.emojiPickerClose}>Kapat</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.emojiGrid}>
                {EMOJIS.map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.emojiButton}
                    onPress={() => addEmoji(emoji)}
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
        
        {/* Link Dialog */}
        <Portal>
          <Dialog visible={linkDialogVisible} onDismiss={hideLinkDialog}>
            <Dialog.Title>Bağlantı Paylaş</Dialog.Title>
            <Dialog.Content>
              <TextInput
                value={linkUrl}
                onChangeText={setLinkUrl}
                placeholder="https://example.com"
                autoCapitalize="none"
                keyboardType="url"
                style={styles.dialogInput}
              />
              <TextInput
                value={linkTitle}
                onChangeText={setLinkTitle}
                placeholder="Bağlantı başlığı"
                style={styles.dialogInput}
              />
              <TextInput
                value={linkDescription}
                onChangeText={setLinkDescription}
                placeholder="Bağlantı açıklaması"
                multiline
                numberOfLines={2}
                style={styles.dialogInput}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={hideLinkDialog}>İptal</Button>
              <Button 
                mode="contained" 
                onPress={handleLinkShare}
                disabled={!linkUrl.trim()}
              >
                Gönder
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        
        {/* Add a debug banner when upload errors occur */}
        {uploadErrorDetails && __DEV__ && (
          <View style={styles.debugBanner}>
            <Text style={styles.debugText}>
              Firebase Storage Error: {uploadErrorDetails}
            </Text>
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={() => setUploadErrorDetails(null)}
            >
              <Text style={styles.debugButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    marginRight: spacing.md,
  },
  headerTitle: {
    ...typography.subtitle1,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  onlineBadge: {
    backgroundColor: '#4CAF50',
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    ...typography.caption,
    color: colors.primary,
    marginRight: spacing.xxs,
  },
  typingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyImage: {
    width: 100,
    height: 100,
    opacity: 0.5,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: 'bold' as const,
  },
  emptyText: {
    ...typography.body2,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl * 2,
    paddingTop: spacing.md,
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dateHeaderText: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.background + '99',
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.medium,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    marginRight: spacing.xs,
    marginLeft: spacing.xs,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.medium,
    ...shadows.small,
    maxWidth: '100%',
  },
  currentUserBubble: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
    marginRight: 5,
    marginLeft: spacing.lg,
  },
  otherUserBubble: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 4,
    marginLeft: 5,
    marginRight: spacing.lg,
  },
  senderName: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  messageText: {
    ...typography.body2,
    lineHeight: 20,
    fontSize: 15,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.xxs,
  },
  messageTime: {
    ...typography.caption,
    fontSize: 10,
  },
  messageStatus: {
    marginLeft: spacing.xxs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachButton: {
    padding: spacing.xs,
    marginRight: spacing.xxs,
  },
  imageButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? spacing.xs : 4,
    paddingHorizontal: spacing.sm,
    maxHeight: 100,
    ...typography.body2,
  },
  emojiButton: {
    padding: spacing.xxs,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    margin: 0,
    marginLeft: spacing.xs,
  },
  sendButtonDisabled: {
    backgroundColor: colors.primary + '80',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: borderRadius.small,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  selectedImageContainer: {
    padding: spacing.xs,
    margin: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.small,
    position: 'relative',
  },
  selectedImagePreview: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.small,
    overflow: 'hidden',
  },
  removeImageButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.error,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emojiModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  emojiPickerContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.large,
    borderTopRightRadius: borderRadius.large,
    padding: spacing.md,
    paddingBottom: spacing.xl + (Platform.OS === 'ios' ? 20 : 0),
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  emojiPickerTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
  emojiPickerClose: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: 'normal',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emoji: {
    fontSize: 24,
    padding: spacing.sm,
  },
  linkButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  dialogInput: {
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  linkPreviewContainer: {
    backgroundColor: colors.surfaceVariant + '50',
    padding: spacing.xs,
    borderRadius: borderRadius.small,
    marginBottom: spacing.xxs,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  linkIcon: {
    marginRight: spacing.xs,
  },
  linkTitle: {
    ...typography.subtitle2,
    fontWeight: '600',
    flex: 1,
  },
  linkDescription: {
    ...typography.caption,
    marginBottom: spacing.xxs,
  },
  linkUrl: {
    ...typography.caption,
    fontSize: 10,
  },
  debugBanner: {
    backgroundColor: '#ffcccc',
    padding: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debugText: {
    color: '#990000',
    flex: 1,
    fontSize: 12,
  },
  debugButton: {
    backgroundColor: '#990000',
    padding: spacing.xs,
    borderRadius: borderRadius.small,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 10,
  },
  errorBanner: {
    backgroundColor: '#ffcccc',
    padding: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#990000',
    flex: 1,
    fontSize: 12,
  },
  errorButton: {
    backgroundColor: '#990000',
    padding: spacing.xs,
    borderRadius: borderRadius.small,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 10,
  },
  fallbackModeButton: {
    borderWidth: 1,
    borderColor: '#ff9800',
    position: 'relative',
  },
  fallbackIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff9800',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  localImageContainer: {
    borderWidth: 1,
    borderColor: '#ff9800',
    borderStyle: 'dashed',
    borderRadius: borderRadius.small,
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  localImageText: {
    ...typography.caption,
    color: '#ff9800',
    fontSize: 10,
    textAlign: 'center',
    marginTop: spacing.xxs,
  },
  unreadMessageBubble: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
});

// Helper function to convert base64 to array buffer
const atob = (base64: string) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let buffer = '';
  
  let i = 0;
  while (i < base64.length) {
    const enc1 = chars.indexOf(base64.charAt(i++));
    const enc2 = chars.indexOf(base64.charAt(i++));
    const enc3 = chars.indexOf(base64.charAt(i++));
    const enc4 = chars.indexOf(base64.charAt(i++));
    
    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;
    
    buffer += String.fromCharCode(chr1);
    
    if (enc3 !== 64) buffer += String.fromCharCode(chr2);
    if (enc4 !== 64) buffer += String.fromCharCode(chr3);
  }
  
  return buffer;
};

// Helper function to create community conversation document
async function ensureCommunityConversationDoc(communityId: string) {
  const conversationId = `community_${communityId}`;
  const conversationRef = doc(db, 'conversations', conversationId);
  const docSnap = await getDoc(conversationRef);

  if (!docSnap.exists()) {
    // Get community information
    const communityRef = doc(db, 'communities', communityId);
    const communitySnap = await getDoc(communityRef);
    const communityData = communitySnap.data();

    await setDoc(conversationRef, {
      id: conversationId,
      type: 'GROUP',
      name: communityData?.name || '',
      photoURL: communityData?.photoURL || '',
      members: communityData?.members || [],
      lastMessage: null,
      lastMessageAt: new Date().toISOString(),
      unreadCount: {},
      communityId: communityId
    });
  }
}