import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, limit, Timestamp, increment, or, onSnapshot, writeBatch, serverTimestamp, setDoc } from 'firebase/firestore';
import { Message, DirectConversation } from '../types/community';

/**
 * FIREBASE INDEXES
 * 
 * If you see errors like:
 * "The query requires multiple indexes that are currently building and cannot be used yet"
 * 
 * You need to create indexes in Firebase console:
 * https://console.firebase.google.com/project/streetpaws-59fd2/firestore/indexes
 * 
 * Required indexes for this service:
 * - Collection: messages, Fields: conversationId (ASC), createdAt (ASC)
 * - Collection: messages, Fields: type (ASC), createdAt (ASC)
 * - Collection: messages, Fields: recipientId (ASC), createdAt (DESC)
 * - Collection: messages, Fields: type (ASC), createdAt (DESC)
 * 
 * You can also export your indexes from Firebase console and track them in your codebase.
 */

export class MessagingService {
  private static instance: MessagingService;
  private messageObservers: Map<string, (() => void)[]>;
  private readonly messagesCollection = 'messages';
  private readonly conversationsCollection = 'conversations';
  private readonly userPresenceCollection = 'userPresence';

  private constructor() {
    this.messageObservers = new Map();
  }

  public static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  // Helper method to get or create a conversation between two users
  private async getOrCreateConversation(user1Id: string, user2Id: string): Promise<DirectConversation> {
    try {
      console.log(`Looking for conversation between ${user1Id} and ${user2Id}`);
      
      // Sort user IDs to ensure consistent conversation ID
      const participants = [user1Id, user2Id].sort();
      
      // Check if conversation already exists
      const q = query(
        collection(db, this.conversationsCollection),
        where('participants', '==', participants)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const conversationDoc = querySnapshot.docs[0];
        console.log(`Found existing conversation: ${conversationDoc.id}`);
        return {
          id: conversationDoc.id,
          ...conversationDoc.data()
        } as DirectConversation;
      }
      
      console.log(`Creating new conversation between ${user1Id} and ${user2Id}`);
      
      // Create new conversation
      const newConversation: Omit<DirectConversation, 'id'> = {
        participants,
        unreadCount: {
          [user1Id]: 0,
          [user2Id]: 0
        },
        lastActivity: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, this.conversationsCollection), newConversation);
      console.log(`Created new conversation with ID: ${docRef.id}`);
      
      return {
        ...newConversation,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error getting or creating conversation:', error);
      throw error;
    }
  }

  async sendDirectMessage(
    senderId: string, 
    recipientId: string, 
    content: string, 
    attachments?: string[], 
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'LINK' = 'TEXT',
    linkPreview?: {
      title?: string;
      description?: string;
      imageUrl?: string;
    }
  ): Promise<Message> {
    try {
      // Create or get conversation
      const participants = [senderId, recipientId].sort();
      const conversationId = `${participants[0]}_${participants[1]}`;

      // Create message data
      const messageData: any = {
        senderId,
        recipientId,
        conversationId,
        content,
        type: 'DIRECT',
        messageType,
        status: 'SENT',
        isRead: false,
        isDelivered: false,
        createdAt: serverTimestamp()
      };

      if (attachments && attachments.length > 0) {
        messageData.attachments = attachments;
      }

      if (messageType === 'LINK' && linkPreview) {
        messageData.linkPreview = linkPreview;
      }

      // Add message to messages collection
      const messageRef = await addDoc(collection(db, this.messagesCollection), messageData);

      // Update or create conversation
      const conversationRef = doc(db, this.conversationsCollection, conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (conversationDoc.exists()) {
        // Update existing conversation
        await updateDoc(conversationRef, {
          lastMessage: {
            content,
            senderId,
            createdAt: serverTimestamp()
          },
          lastActivity: serverTimestamp(),
          [`unreadCount.${recipientId}`]: increment(1)
        });
      } else {
        // Create new conversation
        await setDoc(conversationRef, {
          participants,
          lastMessage: {
            content,
            senderId,
            createdAt: serverTimestamp()
          },
          lastActivity: serverTimestamp(),
          unreadCount: {
            [recipientId]: 1,
            [senderId]: 0
          }
        });
      }

      return {
        id: messageRef.id,
        ...messageData,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error sending direct message:', error);
      throw error;
    }
  }

  async sendGroupMessage(
    senderId: string, 
    communityId: string, 
    content: string, 
    attachments?: string[],
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'LINK' = 'TEXT',
    linkPreview?: {
      title?: string;
      description?: string;
      imageUrl?: string;
    }
  ): Promise<Message> {
    try {
      // Get sender data
      const userDoc = await getDoc(doc(db, 'users', senderId));
      const userData = userDoc.data();
      const senderName = userData?.displayName || userData?.username || `User-${senderId.substr(0, 5)}`;

      // Create message data
      const messageData: any = {
        senderId,
        communityId,
        recipientId: communityId,
        conversationId: `community_${communityId}`,
        content,
        type: 'GROUP',
        messageType,
        status: 'SENT',
        createdAt: serverTimestamp(),
        senderName
      };

      if (attachments && attachments.length > 0) {
        messageData.attachments = attachments;
      }

      if (messageType === 'LINK' && linkPreview) {
        messageData.linkPreview = linkPreview;
      }

      // Add message
      const messageRef = await addDoc(collection(db, this.messagesCollection), messageData);

      // Update community last message
      const communityRef = doc(db, 'communities', communityId);
      await updateDoc(communityRef, {
        lastMessage: {
          content,
          senderId,
          senderName,
          createdAt: serverTimestamp()
        },
        lastActivity: serverTimestamp()
      });

      return {
        id: messageRef.id,
        ...messageData,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error sending group message:', error);
      throw error;
    }
  }

  async getDirectMessages(conversationId: string, limit = 50): Promise<Message[]> {
    try {
      const conversationDoc = await getDoc(doc(db, this.conversationsCollection, conversationId));
      
      if (!conversationDoc.exists()) {
        throw new Error('Conversation not found');
      }
      
      const { participants } = conversationDoc.data() as DirectConversation;
      
      // Get messages between these participants
      const q = query(
        collection(db, this.messagesCollection),
        where('type', '==', 'DIRECT'),
        where('senderId', 'in', participants),
        where('recipientId', 'in', participants),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() 
          ? doc.data().createdAt.toDate().toISOString() 
          : doc.data().createdAt
      } as Message)).sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting direct messages:', error);
      return [];
    }
  }

  async getGroupMessages(communityId: string, limit = 50): Promise<Message[]> {
    try {
      const q = query(
        collection(db, this.messagesCollection),
        where('type', '==', 'GROUP'),
        where('communityId', '==', communityId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() 
          ? doc.data().createdAt.toDate().toISOString() 
          : doc.data().createdAt
      } as Message)).sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting group messages:', error);
      return [];
    }
  }

  async getUserConversations(userId: string): Promise<DirectConversation[]> {
    try {
      console.log(`Fetching conversations for user ${userId}`);
      
      // Update query to use array-contains for participants field correctly
      const q = query(
        collection(db, this.conversationsCollection),
        // Use array-contains if participants is array, otherwise use equality
        where('participants', 'array-contains', userId)
      );
      
      console.log('Running conversation query...');
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.docs.length} conversations for user ${userId}`);
      
      // Process the conversations
      const conversations = await Promise.all(querySnapshot.docs.map(async docSnapshot => {
        const data = docSnapshot.data();
        const conversationId = docSnapshot.id;
        console.log(`Processing conversation ${conversationId}`);
        
        // Find the other user ID in the participants array
        const otherUserId = data.participants.find(id => id !== userId);
        
        // If we can't find the other user, this might be a special or invalid conversation
        if (!otherUserId) {
          console.log(`Could not find other user in conversation ${conversationId}`);
          return {
            id: conversationId,
            participants: data.participants || [],
            lastMessage: data.lastMessage,
            unreadCount: data.unreadCount || { [userId]: 0 },
            lastActivity: data.lastActivity,
          } as DirectConversation;
        }
        
        try {
          // Get user info for the other participant
          const userService = await import('./userService').then(m => m.UserService.getInstance());
          const otherUserData = await userService.getUserById(otherUserId);
          
          return {
            id: conversationId,
            participants: data.participants,
            lastMessage: data.lastMessage ? {
              ...data.lastMessage,
              createdAt: data.lastMessage.createdAt?.toDate?.() 
                ? data.lastMessage.createdAt.toDate().toISOString() 
                : (typeof data.lastMessage.createdAt === 'string' 
                  ? data.lastMessage.createdAt : new Date().toISOString())
            } : undefined,
            unreadCount: data.unreadCount || { [userId]: 0 },
            lastActivity: data.lastActivity?.toDate?.()
              ? data.lastActivity.toDate().toISOString()
              : (typeof data.lastActivity === 'string' 
                ? data.lastActivity : new Date().toISOString()),
            // Add convenience fields for the other user
            otherUser: {
              id: otherUserId,
              name: otherUserData?.displayName || `User-${otherUserId.substr(0, 5)}`,
              avatar: otherUserData?.photoURL || 'https://picsum.photos/200'
            },
            recipientId: otherUserId,
            recipientName: otherUserData?.displayName || `User-${otherUserId.substr(0, 5)}`,
            recipientAvatar: otherUserData?.photoURL || 'https://picsum.photos/200'
          } as DirectConversation;
        } catch (userError) {
          console.error(`Error fetching data for user ${otherUserId}:`, userError);
          
          // Return conversation with basic info even if we can't get user details
          return {
            id: conversationId,
            participants: data.participants,
            lastMessage: data.lastMessage ? {
              ...data.lastMessage,
              createdAt: data.lastMessage.createdAt?.toDate?.() 
                ? data.lastMessage.createdAt.toDate().toISOString() 
                : (typeof data.lastMessage.createdAt === 'string' 
                  ? data.lastMessage.createdAt : new Date().toISOString())
            } : undefined,
            unreadCount: data.unreadCount || { [userId]: 0 },
            lastActivity: data.lastActivity?.toDate?.()
              ? data.lastActivity.toDate().toISOString()
              : (typeof data.lastActivity === 'string' 
                ? data.lastActivity : new Date().toISOString()),
            // Add mock data for the other user
            otherUser: {
              id: otherUserId,
              name: `User-${otherUserId.substr(0, 5)}`,
              avatar: 'https://picsum.photos/200'
            },
            recipientId: otherUserId,
            recipientName: `User-${otherUserId.substr(0, 5)}`,
            recipientAvatar: 'https://picsum.photos/200'
          } as DirectConversation;
        }
      }));
      
      // Filter out null values (in case any promise rejected)
      return conversations.filter(Boolean);
    } catch (error) {
      console.error('Error getting user conversations:', error);
      return [];
    }
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      // Update unread count for this user in the conversation
      await updateDoc(doc(db, this.conversationsCollection, conversationId), {
        [`unreadCount.${userId}`]: 0
      });
      
      // Get the conversation to find the other participant
      const conversationDoc = await getDoc(doc(db, this.conversationsCollection, conversationId));
      
      if (!conversationDoc.exists()) {
        throw new Error('Conversation not found');
      }
      
      const { participants } = conversationDoc.data() as DirectConversation;
      const otherUserId = participants.find(id => id !== userId);
      
      if (!otherUserId) {
        throw new Error('Other participant not found');
      }
      
      // Mark messages from the other user to this user as read
      const messagesQuery = query(
        collection(db, this.messagesCollection),
        where('conversationId', '==', conversationId),
        where('senderId', '==', otherUserId),
        where('recipientId', '==', userId),
        where('isRead', '==', false)
      );
      
      const querySnapshot = await getDocs(messagesQuery);
      
      // Use batch update for better performance
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach(docSnapshot => {
        batch.update(doc(db, this.messagesCollection, docSnapshot.id), {
          isRead: true,
          status: 'READ'
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }
  
  async markMessagesAsDelivered(conversationId: string, userId: string): Promise<void> {
    try {
      // Get the conversation to find the other participant
      const conversationDoc = await getDoc(doc(db, this.conversationsCollection, conversationId));
      
      if (!conversationDoc.exists()) {
        throw new Error('Conversation not found');
      }
      
      const { participants } = conversationDoc.data() as DirectConversation;
      const otherUserId = participants.find(id => id !== userId);
      
      if (!otherUserId) {
        throw new Error('Other participant not found');
      }
      
      // Mark messages from the other user to this user as delivered if not already read
      const messagesQuery = query(
        collection(db, this.messagesCollection),
        where('conversationId', '==', conversationId),
        where('senderId', '==', otherUserId),
        where('recipientId', '==', userId),
        where('isDelivered', '==', false)
      );
      
      const querySnapshot = await getDocs(messagesQuery);
      
      // Use batch update for better performance
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach(docSnapshot => {
        const data = docSnapshot.data();
        const status = data.isRead ? 'READ' : 'DELIVERED';
        
        batch.update(doc(db, this.messagesCollection, docSnapshot.id), {
          isDelivered: true,
          status: status
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as delivered:', error);
      throw error;
    }
  }

  async getConversationMessages(
    conversationId: string,
    isCommunityChat: boolean = false,
    recipientId: string = ''
  ): Promise<Message[]> {
    try {
      let finalConversationId = conversationId;
      
      // If it's a community chat and no conversationId is provided, generate it
      if (isCommunityChat && (!conversationId || conversationId.trim() === '') && recipientId) {
        finalConversationId = `community_${recipientId}`;
      }
      
      // If no conversationId, return empty array
      if (!finalConversationId || finalConversationId.trim() === '') return [];
      
      // Get messages from the conversation
      const messageQuery = query(
        collection(db, this.messagesCollection),
        where('conversationId', '==', finalConversationId),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(messageQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() 
            ? data.createdAt.toDate().toISOString() 
            : data.createdAt
        } as Message;
      });
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      return [];
    }
  }
  
  subscribeToMessages(
    conversationId: string,
    recipientId: string,
    userId: string,
    isCommunityChat: boolean,
    callback: (messages: Message[]) => void
  ): (() => void) | undefined {
    try {
      console.log(`Setting up message subscription for ${isCommunityChat ? 'community' : 'direct'} chat`);
      console.log(`conversationId: ${conversationId}, recipientId: ${recipientId}, userId: ${userId}`);
      
      // Set up the query based on whether it's a community chat or direct chat
      let messagesQuery;
      
      if (isCommunityChat) {
        // For community chats, use the community conversation ID format
        const communityConversationId = `community_${recipientId}`;
        console.log(`Using community conversation ID: ${communityConversationId}`);
        
        messagesQuery = query(
          collection(db, this.messagesCollection),
          where('conversationId', '==', communityConversationId),
          orderBy('createdAt', 'asc')
        );
      } else if (conversationId && conversationId.trim() !== '') {
        // For direct chats with a conversation ID
        console.log(`Using direct conversation ID: ${conversationId}`);
        
        messagesQuery = query(
          collection(db, this.messagesCollection),
          where('conversationId', '==', conversationId),
          orderBy('createdAt', 'asc')
        );
      } else {
        // For direct chats without a conversation ID, use a simpler query
        // We'll filter client-side to avoid complex indexes
        console.log('No conversation ID, using simpler query with client-side filtering');
        
        messagesQuery = query(
          collection(db, this.messagesCollection),
          where('type', '==', 'DIRECT'),
          orderBy('createdAt', 'asc')
        );
      }
      
      // Set up the real-time listener
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        let needToMarkAsDelivered = false;
        console.log(`Received ${snapshot.docs.length} messages from Firebase`);
        
        const messages = snapshot.docs
          .map(doc => {
            const data = doc.data();
            console.log(`Processing message: ${doc.id}, senderId: ${data.senderId}, recipientId: ${data.recipientId}`);
            
            // Mark messages as delivered when they come in
            if (!isCommunityChat && data.senderId !== userId && !data.isDelivered) {
              needToMarkAsDelivered = true;
            }
            
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() 
                ? data.createdAt.toDate().toISOString() 
                : data.createdAt
            } as Message;
          })
          // Filter messages if needed for direct chats without a conversationId
          .filter(message => {
            // If we have a specific conversationId or it's a community chat, include all messages
            if ((conversationId && conversationId.trim() !== '') || isCommunityChat) {
              return true;
            }
            
            // For direct chats without conversationId, filter to only include messages
            // between these two users
            const validMessage = (
              (message.senderId === userId && message.recipientId === recipientId) ||
              (message.senderId === recipientId && message.recipientId === userId)
            );
            
            if (!validMessage) {
              console.log(`Filtering out message ${message.id} that's not between the current users`);
            }
            
            return validMessage;
          });
        
        console.log(`Filtered to ${messages.length} messages, sending to UI`);
        
        // Automatically mark messages as delivered when they come in
        if (needToMarkAsDelivered && conversationId) {
          this.markMessagesAsDelivered(conversationId, userId).catch(err => {
            console.error('Error auto-marking messages as delivered:', err);
          });
        }
        
        // Make sure we send messages to the UI, even if the array is empty
        callback(messages);
      }, error => {
        console.error('Error in message subscription:', error);
        // Still call callback with empty array to prevent UI from hanging
        callback([]);
      });
      
      // Store the unsubscribe function in our map
      const conversationKey = isCommunityChat ? `community_${recipientId}` : conversationId || `direct_${userId}_${recipientId}`;
      
      if (!this.messageObservers.has(conversationKey)) {
        this.messageObservers.set(conversationKey, []);
      }
      
      this.messageObservers.get(conversationKey)?.push(unsubscribe);
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up message subscription:', error);
      // Call callback with empty array to prevent UI from hanging
      callback([]);
      return undefined;
    }
  }
  
  // Method to update user presence status (online/offline)
  async updateUserPresence(userId: string, isOnline: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, this.userPresenceCollection, userId), {
        online: isOnline,
        lastSeen: Timestamp.now()
      });
    } catch (error) {
      // If document doesn't exist, create it
      try {
        await addDoc(collection(db, this.userPresenceCollection), {
          userId,
          online: isOnline,
          lastSeen: Timestamp.now()
        });
      } catch (innerError) {
        console.error('Error updating user presence:', innerError);
      }
    }
  }
  
  // Method to subscribe to a user's presence status
  subscribeToUserPresence(userId: string, callback: (isOnline: boolean, lastSeen?: string) => void): (() => void) | undefined {
    try {
      return onSnapshot(doc(db, this.userPresenceCollection, userId), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          callback(
            data.online || false, 
            data.lastSeen?.toDate?.() ? data.lastSeen.toDate().toISOString() : undefined
          );
        } else {
          callback(false);
        }
      });
    } catch (error) {
      console.error('Error subscribing to user presence:', error);
      return undefined;
    }
  }

  // Subscribe to all new messages for a user
  subscribeToNewMessages(
    userId: string | undefined,
    callback: () => void
  ): (() => void) | undefined {
    if (!userId) return undefined;
    
    try {
      console.log(`Setting up new message notifications for user ${userId}`);
      
      // Temporary simplified query - just get direct messages for this user
      // This avoids needing a complex index
      const q = query(
        collection(db, this.messagesCollection),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        // Only trigger for changes (not initial load)
        if (!snapshot.metadata.hasPendingWrites && !snapshot.empty) {
          callback();
        }
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to new messages:', error);
      return undefined;
    }
  }

  /**
   * Send a link message in direct or group chat
   * @param senderId Sender ID
   * @param recipientId Direct recipient ID or community ID
   * @param url URL to share
   * @param linkPreview Optional metadata for URL preview
   * @param isCommunityChat Whether this is a community (group) chat
   * @returns Promise<Message>
   */
  async sendLinkMessage(
    senderId: string,
    recipientId: string,
    url: string,
    linkPreview?: {
      title?: string;
      description?: string;
      imageUrl?: string;
    },
    isCommunityChat: boolean = false
  ): Promise<Message> {
    try {
      // Create a message with link type
      const messageData = {
        content: url,
        senderId,
        type: isCommunityChat ? 'GROUP' : 'DIRECT',
        messageType: 'LINK',
        status: 'SENT',
        createdAt: serverTimestamp(),
        linkPreview: linkPreview || null
      };

      // Add recipient-specific fields based on message type
      if (isCommunityChat) {
        // Group message to a community
        Object.assign(messageData, {
          communityId: recipientId
        });
        
        return this.sendGroupMessage(senderId, recipientId, url, undefined, 'LINK', linkPreview);
      } else {
        // Direct message to a user
        Object.assign(messageData, {
          recipientId
        });
        
        return this.sendDirectMessage(senderId, recipientId, url, undefined, 'LINK', linkPreview);
      }
    } catch (error) {
      console.error('Error sending link message:', error);
      throw error;
    }
  }

  async markCommunityMessagesAsRead(communityId: string, userId: string): Promise<void> {
    try {
      // Get community reference
      const communityService = await import('./communityService').then(m => m.CommunityService.getInstance());
      const community = await communityService.getCommunityById(communityId);
      
      if (!community) {
        throw new Error('Community not found');
      }
      
      // Reset unread count for this user
      const unreadMessages = community.unreadMessages || {};
      unreadMessages[userId] = 0;
      
      // Update the community document
      const communityRef = doc(db, communityService['communitiesCollection'], communityId);
      await updateDoc(communityRef, {
        [`unreadMessages.${userId}`]: 0
      });
      
      console.log(`Marked community messages as read for user ${userId} in community ${communityId}`);
    } catch (error) {
      console.error('Error marking community messages as read:', error);
      throw error;
    }
  }
} 