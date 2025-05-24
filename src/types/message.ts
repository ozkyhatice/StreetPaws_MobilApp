export type MessageStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'PENDING';

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  isDelivered?: boolean;
  attachments?: string[];
  type: 'DIRECT' | 'GROUP';
  conversationId: string;
  senderName?: string;
  messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'LINK';
  linkPreview?: {
    title?: string;
    description?: string;
    image?: string;
    url: string;
  };
  status: MessageStatus;
} 