import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface EmergencyRequest {
  id?: string;
  title: string;
  description: string;
  location: string;
  animalType?: string;
  urgency: 'low' | 'medium' | 'high';
  contactPhone?: string;
  imageUrl?: string | null;
  userId: string;
  userName: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
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
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...request,
        createdAt: Timestamp.fromDate(new Date(request.createdAt)),
        updatedAt: Timestamp.fromDate(new Date()),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating emergency request:', error);
      throw error;
    }
  }

  async getEmergencyRequests(userId?: string): Promise<EmergencyRequest[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      );

      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate().toISOString(),
      })) as EmergencyRequest[];
    } catch (error) {
      console.error('Error getting emergency requests:', error);
      throw error;
    }
  }

  async getPendingEmergencyRequests(): Promise<EmergencyRequest[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate().toISOString(),
      })) as EmergencyRequest[];
    } catch (error) {
      console.error('Error getting pending emergency requests:', error);
      throw error;
    }
  }
} 