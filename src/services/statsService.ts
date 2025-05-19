import { db } from '../config/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  increment, 
  Timestamp 
} from 'firebase/firestore';

export interface GlobalStats {
  totalTasksCompleted: number;
  totalVolunteers: number;
  activeTasksCount: number;
  lastUpdated: Timestamp | string;
}

export interface InfoCard {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  createdBy: string;
  priority: number;
}

export class StatsService {
  private static instance: StatsService;
  private readonly statsCollection = 'stats';
  private readonly usersCollection = 'users';
  private readonly tasksCollection = 'tasks';
  private readonly infoCollection = 'infoCards';

  private constructor() {}

  static getInstance(): StatsService {
    if (!StatsService.instance) {
      StatsService.instance = new StatsService();
    }
    return StatsService.instance;
  }

  async getGlobalStats(): Promise<GlobalStats> {
    try {
      // Check if global stats document exists
      const globalStatsRef = doc(db, this.statsCollection, 'global');
      const globalStatsDoc = await getDoc(globalStatsRef);
      
      if (globalStatsDoc.exists()) {
        const data = globalStatsDoc.data();
        // Ensure all fields have valid values
        return {
          totalTasksCompleted: data.totalTasksCompleted || 0,
          totalVolunteers: data.totalVolunteers || 0,
          activeTasksCount: data.activeTasksCount || 0,
          lastUpdated: data.lastUpdated || new Date().toISOString()
        };
      } else {
        // If no stats document exists, create one by calculating stats
        return this.recalculateAndUpdateGlobalStats();
      }
    } catch (error) {
      console.error('Error getting global stats:', error);
      return {
        totalTasksCompleted: 0,
        totalVolunteers: 0,
        activeTasksCount: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async recalculateAndUpdateGlobalStats(): Promise<GlobalStats> {
    try {
      // Count total volunteers (users with role 'volunteer' or 'admin')
      const usersQuery = query(
        collection(db, this.usersCollection),
        where('role', 'in', ['volunteer', 'admin', 'user'])
      );
      const usersSnapshot = await getDocs(usersQuery);
      const totalVolunteers = usersSnapshot.size;

      // Count active tasks (status is OPEN or IN_PROGRESS)
      const activeTasksQuery = query(
        collection(db, this.tasksCollection),
        where('status', 'in', ['OPEN', 'IN_PROGRESS'])
      );
      const activeTasksSnapshot = await getDocs(activeTasksQuery);
      const activeTasksCount = activeTasksSnapshot.size;

      // Count completed tasks
      const completedTasksQuery = query(
        collection(db, this.tasksCollection),
        where('status', '==', 'COMPLETED')
      );
      const completedTasksSnapshot = await getDocs(completedTasksQuery);
      const totalTasksCompleted = completedTasksSnapshot.size;

      // Create or update the global stats document
      const stats: GlobalStats = {
        totalTasksCompleted,
        totalVolunteers,
        activeTasksCount,
        lastUpdated: new Date().toISOString()
      };

      const globalStatsRef = doc(db, this.statsCollection, 'global');
      await setDoc(globalStatsRef, stats);

      return stats;
    } catch (error) {
      console.error('Error recalculating global stats:', error);
      return {
        totalTasksCompleted: 0,
        totalVolunteers: 0,
        activeTasksCount: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async incrementCompletedTasksCount(): Promise<void> {
    try {
      const globalStatsRef = doc(db, this.statsCollection, 'global');
      const globalStatsDoc = await getDoc(globalStatsRef);
      
      if (globalStatsDoc.exists()) {
        await updateDoc(globalStatsRef, {
          totalTasksCompleted: increment(1),
          lastUpdated: new Date().toISOString()
        });
      } else {
        await this.recalculateAndUpdateGlobalStats();
      }
    } catch (error) {
      console.error('Error incrementing completed tasks count:', error);
    }
  }

  async incrementActiveTasksCount(): Promise<void> {
    try {
      const globalStatsRef = doc(db, this.statsCollection, 'global');
      const globalStatsDoc = await getDoc(globalStatsRef);
      
      if (globalStatsDoc.exists()) {
        await updateDoc(globalStatsRef, {
          activeTasksCount: increment(1),
          lastUpdated: new Date().toISOString()
        });
      } else {
        await this.recalculateAndUpdateGlobalStats();
      }
    } catch (error) {
      console.error('Error incrementing active tasks count:', error);
    }
  }

  async decrementActiveTasksCount(): Promise<void> {
    try {
      const globalStatsRef = doc(db, this.statsCollection, 'global');
      const globalStatsDoc = await getDoc(globalStatsRef);
      
      if (globalStatsDoc.exists()) {
        const currentCount = globalStatsDoc.data().activeTasksCount || 0;
        await updateDoc(globalStatsRef, {
          activeTasksCount: Math.max(0, currentCount - 1),
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error decrementing active tasks count:', error);
    }
  }

    async getInfoCards(): Promise<InfoCard[]> {
    try {
      const infoCardsQuery = query(
        collection(db, this.infoCollection),
        where('active', '==', true)
      );
      
      const snapshot = await getDocs(infoCardsQuery);
      const infoCards = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          createdBy: data.createdBy || '',
          priority: data.priority !== undefined ? data.priority : 1
        } as InfoCard;
      });
      
      // Sort by priority (higher first)
      return infoCards.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    } catch (error) {
      console.error('Error getting info cards:', error);
      return [];
    }
  }

  async addInfoCard(userId: string, title: string, content: string, priority: number = 1): Promise<string> {
    try {
      // Create a new document reference
      const infoCardRef = doc(collection(db, this.infoCollection));
      
      const infoCard: Omit<InfoCard, 'id'> = {
        title,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId,
        priority,
      };
      
      await setDoc(infoCardRef, {
        ...infoCard,
        active: true
      });
      
      return infoCardRef.id;
    } catch (error) {
      console.error('Error adding info card:', error);
      throw error;
    }
  }

  async updateInfoCard(cardId: string, updates: Partial<InfoCard>): Promise<void> {
    try {
      const infoCardRef = doc(db, this.infoCollection, cardId);
      await updateDoc(infoCardRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating info card:', error);
      throw error;
    }
  }

  async deleteInfoCard(cardId: string): Promise<void> {
    try {
      const infoCardRef = doc(db, this.infoCollection, cardId);
      // Soft delete by setting active to false
      await updateDoc(infoCardRef, {
        active: false,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting info card:', error);
      throw error;
    }
  }
} 