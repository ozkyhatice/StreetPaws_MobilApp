import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { TaskService } from './taskService';

export interface EmergencyRequest {
  id?: string;
  title: string;
  description: string;
  location: string;
  animalType?: 'FEEDING' | 'CLEANING' | 'HEALTH' | 'SHELTER' | 'OTHER';
  urgency: 'critical' | 'low' | 'medium' | 'high';
  contactPhone?: string;
  imageUrl?: string | null;
  userId: string;
  userName: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  resolvedBy?: {
    id: string;
    name: string;
    resolvedAt: string;
  };
  relatedTaskId?: string; // Acil durumla ilişkili görev ID'si
  category?: 'FEEDING' | 'CLEANING' | 'HEALTH' | 'SHELTER' | 'OTHER';
}

export class EmergencyService {
  private static instance: EmergencyService;
  private readonly collectionName = 'emergencyRequests';

  private constructor() {}

  public static getInstance(): EmergencyService {
    if (!EmergencyService.instance) {
      EmergencyService.instance = new EmergencyService();
    }
    return EmergencyService.instance;
  }

  async createEmergencyRequest(request: Omit<EmergencyRequest, 'id'>): Promise<string> {
    try {
      console.log('Creating emergency request:', request.title);
      
      // Firestore'a ekleme
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...request,
        createdAt: Timestamp.fromDate(new Date(request.createdAt)),
        updatedAt: Timestamp.fromDate(new Date()),
      });
      const emergencyId = docRef.id;
      
      console.log(`Emergency request created with ID: ${emergencyId}`);
      
      // Acil durumdan görev oluştur
      const taskId = await this.createTaskFromEmergency({...request, id: emergencyId});
      
      // Acil durum belgesini güncelle (görev ID'sini ekle)
      await updateDoc(doc(db, this.collectionName, emergencyId), {
        relatedTaskId: taskId
      });
      
      console.log(`Updated emergency ${emergencyId} with related task: ${taskId}`);
      
      return emergencyId;
    } catch (error) {
      console.error('Error creating emergency request:', error);
      throw error;
    }
  }

  private async createTaskFromEmergency(emergency: EmergencyRequest): Promise<string> {
    try {
      const taskService = TaskService.getInstance();
      
      // The categories in emergency request are now already aligned with TaskCategory values
      // So we can pass the emergency object directly to createEmergencyTask
      const task = await taskService.createEmergencyTask(emergency);
      
      console.log(`Task created from emergency: ${task.id} with category: ${task.category}`);
      return task.id;
    } catch (error) {
      console.error('Error creating task from emergency:', error);
      throw error;
    }
  }

  async getEmergencyRequests(userId?: string): Promise<EmergencyRequest[]> {
    try {
      console.log('Getting emergency requests', userId ? `for user ${userId}` : 'for all users');
      
      // Firestore sorgusu
      let q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      );
      
      if (userId) {
        q = query(q, where('userId', '==', userId));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as EmergencyRequest;
      });
      
      // Mock veri için yorum satırına alındı
      /*
      const mockEmergencies: EmergencyRequest[] = [
        {
          id: 'emergency_1',
          title: 'Yaralı Kedi Acil Yardım',
          description: 'Kadıköy meydanda yaralı bir kedi bulundu, acil veteriner yardımı gerekiyor.',
          location: 'Kadıköy Meydan, İstanbul',
          animalType: 'Kedi',
          urgency: 'high',
          userId: 'user1',
          userName: 'Ahmet Yılmaz',
          status: 'pending',
          createdAt: new Date().toISOString(),
          relatedTaskId: 'task_emergency_1'
        },
        {
          id: 'emergency_2',
          title: 'Aç Köpekler',
          description: 'Beşiktaş parkında aç köpekler var, acil mama yardımı gerekiyor.',
          location: 'Beşiktaş Parkı, İstanbul',
          animalType: 'Köpek',
          urgency: 'medium',
          userId: 'user2',
          userName: 'Ayşe Öztürk',
          status: 'in-progress',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          relatedTaskId: 'task_emergency_2'
        }
      ];
      
      if (userId) {
        return mockEmergencies.filter(e => e.userId === userId);
      }
      
      return mockEmergencies;
      */
    } catch (error) {
      console.error('Error getting emergency requests:', error);
      throw error;
    }
  }

  async getPendingEmergencyRequests(): Promise<EmergencyRequest[]> {
    try {
      console.log('Getting pending emergency requests');
      
      // Firestore sorgusu
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as EmergencyRequest;
      });
      
      // Mock veri için yorum satırına alındı
      /*
      const allRequests = await this.getEmergencyRequests();
      return allRequests.filter(req => req.status === 'pending');
      */
    } catch (error) {
      console.error('Error getting pending emergency requests:', error);
      throw error;
    }
  }
  
  async updateEmergencyStatus(emergencyId: string, status: 'pending' | 'in-progress' | 'resolved' | 'cancelled', userId?: string, userName?: string): Promise<void> {
    try {
      console.log(`Updating emergency ${emergencyId} status to ${status}`);
      
      const updates: any = {
        status,
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      if (status === 'resolved' && userId && userName) {
        updates.resolvedBy = {
          id: userId,
          name: userName,
          resolvedAt: Timestamp.fromDate(new Date())
        };
      }
      
      // Firestore güncellemesi
      await updateDoc(doc(db, this.collectionName, emergencyId), updates);
      
      console.log(`Emergency ${emergencyId} status updated to ${status}`);
      
      // İlişkili görevi de güncelle
      if (status === 'in-progress' || status === 'resolved') {
        await this.updateRelatedTask(emergencyId, status, userId, userName);
      }
    } catch (error) {
      console.error(`Error updating emergency ${emergencyId} status:`, error);
      throw error;
    }
  }
  
  private async updateRelatedTask(emergencyId: string, status: string, userId?: string, userName?: string): Promise<void> {
    try {
      // Acil durumun ilişkili görev ID'sini al
      const emergencyDoc = await getDoc(doc(db, this.collectionName, emergencyId));
      if (!emergencyDoc.exists()) {
        throw new Error(`Emergency with ID ${emergencyId} not found`);
      }
      
      const emergency = emergencyDoc.data() as EmergencyRequest;
      const taskId = emergency.relatedTaskId;
      
      if (taskId && userId) {
        const taskService = TaskService.getInstance();
        
        if (status === 'in-progress') {
          // Görevi kişiye ata
          await taskService.assignTask(taskId, userId);
        } else if (status === 'resolved' && userName) {
          // Görevi tamamla ve onaya gönder
          await taskService.completeTask(taskId, userId, userName);
          
          // Görevi otomatik onayla (gerçek uygulamada onay akışı farklı olabilir)
          await taskService.approveTask(taskId, 'admin1', 'Admin Kullanıcı');
        }
      }
    } catch (error) {
      console.error(`Error updating related task for emergency ${emergencyId}:`, error);
    }
  }
} 