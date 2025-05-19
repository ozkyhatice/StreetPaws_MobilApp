import { db } from '../config/firebase';
import { collection, doc, addDoc, getDocs, query, where, orderBy, limit as firestoreLimit, Timestamp, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// Redux actions için gerekli importlar
import { store } from '../store';
import { addNotification } from '../store/notifications/notificationSlice';

export interface NotificationData {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read?: boolean;
  timestamp?: Date | Timestamp;
  data?: any; // Ekstra veri (örn. link, rota, vs)
  actionType?: string; // Örn: 'OPEN_INVITATION', 'COMMUNITY_JOIN'
}

export class NotificationService {
  private static instance: NotificationService;
  private readonly notificationsCollection = 'notifications';

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Kullanıcıya bildirim gönderir ve veritabanına kaydeder
   * @param notification - Bildirim verisi
   * @returns Promise<string> - Eklenen bildirim ID'si
   */
  async sendNotification(notification: NotificationData): Promise<string> {
    try {
      // Timestamp ve read değerlerini ayarla
      const notificationData = {
        ...notification,
        timestamp: Timestamp.now(),
        read: false,
        id: notification.id || uuidv4()
      };

      // Firebase'e ekle
      await addDoc(collection(db, this.notificationsCollection), notificationData);
      
      // Redux store'a ekleyerek UI'da anlık göster
      store.dispatch(addNotification({
        id: notificationData.id,
        title: notificationData.title,
        message: notificationData.message,
        timestamp: Date.now(),
        read: false,
        type: notificationData.type
      }));

      return notificationData.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Kullanıcıya topluluk daveti bildirimi gönderir
   * @param userId - Bildirim gönderilecek kullanıcı ID'si
   * @param inviterName - Davet eden kullanıcı adı
   * @param communityName - Topluluk adı
   * @param inviteCode - Davet kodu
   * @returns Promise<string> - Eklenen bildirim ID'si
   */
  async sendInvitationNotification(
    userId: string, 
    inviterName: string, 
    communityName: string, 
    inviteCode: string
  ): Promise<string> {
    return this.sendNotification({
      userId,
      title: 'Topluluk Daveti',
      message: `${inviterName} sizi "${communityName}" topluluğuna davet etti.`,
      type: 'info',
      data: { 
        inviteCode,
        communityName 
      },
      actionType: 'OPEN_INVITATION'
    });
  }

  /**
   * Kullanıcının bildirimlerini okundu olarak işaretler
   * @param notificationId - Bildirim ID'si
   * @param userId - Kullanıcı ID'si
   */
  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      // Firebase'de bildirim bul
      const notificationsRef = collection(db, this.notificationsCollection);
      const q = query(
        notificationsRef, 
        where('id', '==', notificationId),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const notificationDoc = querySnapshot.docs[0];
        // Bildirim durumunu güncelle
        await updateDoc(doc(db, this.notificationsCollection, notificationDoc.id), {
          read: true
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Kullanıcının bildirimlerini getirir
   * @param userId - Kullanıcı ID'si
   * @param limit - Maksimum bildirim sayısı
   * @returns 
   */
  async getUserNotifications(userId: string, limitCount: number = 20): Promise<NotificationData[]> {
    try {
      const notificationsRef = collection(db, this.notificationsCollection);
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as NotificationData;
        return {
          ...data,
          timestamp: data.timestamp || new Date()
        };
      });
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }
} 