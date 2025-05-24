export interface Community {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: string; // userId of creator
  members: string[]; // array of userIds
  membersCount: number;
  admins: string[]; // userIds of admins
  category: CommunityCategory;
  photoURL?: string;
  bannerURL?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  isPublic: boolean;
  joinRequests?: string[]; // userIds of pending join requests
  joinRequestsTimestamps?: {[userId: string]: any};
  tags?: string[];
  inviteCode?: string; // davet kodu
  inviteCodeExpiry?: any; // Davet kodunun geçerlilik süresi (Timestamp)
  inviteCodeUsageLimit?: number; // Davet kodu kullanım limiti (0=sınırsız)
  inviteCodeUsageCount?: number; // Davet kodunun kaç kez kullanıldığı
  isDeleted?: boolean;
  deletedAt?: any; // Timestamp
  deletedBy?: string;
  updatedAt?: any; // Timestamp
  updatedBy?: string;
  lastMessage?: {
    content: string;
    senderId: string;
    senderName?: string;
    createdAt: any;
  };
  unreadMessages?: {
    [userId: string]: number; // userId -> number of unread messages
  };
  bannedMembers?: Array<{
    userId: string;
    banTime: any;
    reason?: string;
  }>;
  mutedMembers?: Array<{
    userId: string;
    muteEndTime: any;
    reason?: string;
  }>;
  messagePermissions?: {
    onlyAdminsCanPost: boolean;
    approvalRequired: boolean;
    updatedAt?: any; // Timestamp
    updatedBy?: string;
  };
  advancedSettings?: {
    onlyAdminsCanChangeName?: boolean;
    onlyAdminsCanChangeDescription?: boolean;
    onlyAdminsCanChangePhoto?: boolean;
    slowMode?: boolean;
    slowModeInterval?: number; // Seconds between messages
    membersCanAddMembers?: boolean;
    approveNewMembers?: boolean;
    showMemberList?: boolean;
    autoDeleteMessages?: boolean;
    autoDeleteAfter?: number; // Days
    updatedAt?: any; // Timestamp
    updatedBy?: string;
  };
  memberUpdates?: Array<{
    action: 'MEMBERS_ADDED' | 'ADMIN_ADDED' | 'ADMIN_REMOVED';
    memberId?: string;
    memberIds?: string[];
    byAdmin: string;
    timestamp: any; // Timestamp
  }>;
}

export type CommunityCategory = 
  | 'ANIMAL_RESCUE' 
  | 'FEEDING' 
  | 'SHELTER' 
  | 'ADOPTION' 
  | 'VETERINARY' 
  | 'EDUCATION' 
  | 'FUNDRAISING'
  | 'OTHER';

export interface Message {
  id: string;
  senderId: string;
  recipientId: string; // userId or communityId
  content: string;
  createdAt: string;
  isRead: boolean;
  isDelivered?: boolean; // Indicates if message is delivered to the recipient
  attachments?: string[]; // URLs to any attached files or images
  type: 'DIRECT' | 'GROUP'; // DIRECT for user-to-user, GROUP for community messages
  conversationId: string; // Add this field for properly tracking conversations
  senderName?: string; // Optional sender name for display in group chats
  status?: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'PENDING'; // Message status for UI indicators
  messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'LINK'; // Type of message content
  linkPreview?: {
    title?: string;
    description?: string;
    imageUrl?: string;
  }; // Preview data for link messages
}

export interface DirectConversation {
  id: string;
  participants: string[]; // userIds
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: {
    [userId: string]: number; // userId -> number of unread messages
  };
  lastActivity?: string; // Timestamp of the last activity in the conversation
  
  // Additional properties for UI convenience
  otherUser?: {
    id: string;
    name: string;
    avatar: string;
  };
  recipientId?: string;
  recipientName?: string;
  recipientAvatar?: string;
}

export interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  participants?: string[]; // For direct
  communityId?: string; // For group
  name?: string; // For group
  photoURL?: string; // For group
  lastMessage?: {
    content: string;
    senderId: string;
    senderName?: string;
    createdAt: string;
  };
  lastMessageAt?: string;
  unreadCount?: { [userId: string]: number };
  otherUser?: {
    id: string;
    name: string;
    avatar: string;
  };
  recipientId?: string;
  recipientName?: string;
  recipientAvatar?: string;
} 