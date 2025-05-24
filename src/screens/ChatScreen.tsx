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
} from 'react-native';
import { Text, TextInput, Avatar, IconButton, Divider, Badge, Dialog, Portal, Button } from 'react-native-paper';
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
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

// Common emojis
const EMOJIS = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️', 
                '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', 
                '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', 
                '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕',
                '👍', '👎', '👏', '🙌', '🤝', '👊', '✌️', '🤞', '🤘', '👌'];

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
          conversationId,
          isCommunityChat,
          recipientId
        );
        
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
        if (conversationId && !isCommunityChat) {
          messagingService.markMessagesAsRead(conversationId, user.uid);
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
    
    // Set up real-time listener for new messages
    const unsubscribe = messagingService.subscribeToMessages(
      conversationId,
      recipientId,
      user?.uid || '',
      isCommunityChat || false,
      (newMessages) => {
        setMessages(newMessages);
        
        // Mark messages as read when received
        if (conversationId && !isCommunityChat) {
          messagingService.markMessagesAsRead(conversationId, user?.uid || '');
        } else if (isCommunityChat && recipientId) {
          messagingService.markCommunityMessagesAsRead(recipientId, user?.uid || '');
        }
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
    
    return () => {
      unsubscribe?.();
      presenceUnsubscribe?.();
      clearInterval(typingInterval);
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [user, conversationId, recipientId, isCommunityChat]);

  const handleSend = async () => {
    if (!user || (!newMessage.trim() && !selectedImage)) return;
    
    try {
      console.log(`Current user: ${user.uid}`);
      console.log(`Sending message to ${isCommunityChat ? 'community' : 'user'} ${recipientId}: ${newMessage.trim()}`);
      
      // Upload image if selected
      let imageUrl: string | undefined;
      if (selectedImage) {
        setUploading(true);
        imageUrl = await uploadImage(selectedImage);
        setUploading(false);
        setSelectedImage(null);
      }
      
      const attachments = imageUrl ? [imageUrl] : [];
      
      // Create a temporary message for optimistic UI update
      const tempId = `temp_${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        senderId: user.uid,
        recipientId: recipientId,
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
        isRead: false,
        isDelivered: false,
        attachments: attachments,
        type: isCommunityChat ? 'GROUP' : 'DIRECT',
        conversationId: conversationId || '',
        status: 'SENT'
      };
      
      // Update UI optimistically for better user experience
      setMessages(prev => [...prev, tempMessage]);
      
      // Clear input immediately for better UX
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 10);
      
      // Actually send the message
      try {
        let sentMessage;
        if (isCommunityChat) {
          sentMessage = await messagingService.sendGroupMessage(
            user.uid,
            recipientId,
            newMessage.trim(),
            attachments
          );
        } else {
          sentMessage = await messagingService.sendDirectMessage(
            user.uid,
            recipientId,
            newMessage.trim(),
            attachments
          );
        }
        
        // Replace temporary message with actual message
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? sentMessage : msg
        ));
      } catch (error) {
        console.error('Error sending message:', error);
        
        // Mark the temp message as failed
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'FAILED' as any } : msg
        ));
        
        Alert.alert('Hata', 'Mesaj gönderilemedi. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Error in handleSend:', error);
      Alert.alert('Hata', 'Mesaj gönderilirken bir sorun oluştu.');
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
        conversationId: conversationId || '',
        status: 'SENT',
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
          msg.id === tempId ? { ...msg, status: 'FAILED' as any } : msg
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

  const getMessageStatus = (message: Message) => {
    if (message.senderId !== user?.uid) return null;
    
    // Simulate message statuses for demo
    const messageTime = new Date(message.createdAt).getTime();
    const now = Date.now();
    
    // Messages older than 1 minute are read
    if (now - messageTime > 60000) {
      return <CheckCheck size={16} color={colors.success} />; 
    }
    // Messages older than 30 seconds are delivered
    else if (now - messageTime > 30000) {
      return <Check size={16} color={colors.success} />; 
    }
    // Recent messages are just sent
    else {
      return <Clock size={16} color={colors.textSecondary} />;
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === user?.uid;
    
    // Get sender name for community chats
    let senderName = "Unknown User";
    if (!isCurrentUser && isCommunityChat) {
      // Use the sender name from the message or fallback to mock data
      const userNames = {
        '1': 'Ahmet Yılmaz',
        '2': 'Ayşe Kaya',
        '3': 'Mehmet Demir',
        '4': 'Zeynep Çelik',
        '5': 'Can Aydın'
      };
      
      senderName = item.senderName || userNames[item.senderId] || `User-${item.senderId.substr(0, 5)}`;
    }
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
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
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          {!isCurrentUser && isCommunityChat && (
            <Text style={styles.senderName}>{senderName}</Text>
          )}
          
          {item.attachments && item.attachments.length > 0 && (
            <Image 
              source={{ uri: item.attachments[0] }}
              style={styles.messageImage}
              resizeMode="contain"
            />
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
          ) : item.content.trim() !== '' && (
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

  // Add image picking functionality
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };
  
  const uploadImage = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storage = getStorage();
      const filename = `chat/${Date.now()}_${user?.uid}`;
      const storageRef = ref(storage, filename);
      
      console.log(`Uploading image to Firebase Storage: ${filename}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, blob);
      console.log('Image uploaded successfully');
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log(`Download URL obtained: ${downloadURL}`);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image to Firebase Storage:', error);
      Alert.alert(
        'Dosya Yükleme Hatası',
        'Resim yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.'
      );
      throw new Error(`Image upload failed: ${error.message}`);
    }
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={colors.text} />
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
        </View>
        
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
            style={styles.imageButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <ImageIcon
              size={24}
              color={uploading ? colors.textTertiary : colors.text}
            />
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
                label="Bağlantı URL"
                value={linkUrl}
                onChangeText={setLinkUrl}
                placeholder="https://example.com"
                autoCapitalize="none"
                keyboardType="url"
                style={styles.dialogInput}
              />
              <TextInput
                label="Başlık (İsteğe Bağlı)"
                value={linkTitle}
                onChangeText={setLinkTitle}
                placeholder="Bağlantı başlığı"
                style={styles.dialogInput}
              />
              <TextInput
                label="Açıklama (İsteğe Bağlı)"
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
    paddingVertical: Platform.OS === 'ios' ? spacing.xs : 0,
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
    fontWeight: 'bold' as const,
  },
  emojiPickerClose: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: 'normal' as const,
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
}); 