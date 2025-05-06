import { Badge, BADGES } from '../types/badge';
import { db } from '../config/firebase';
import { Task } from '../types/task';
import { doc, getDoc, updateDoc, collection } from 'firebase/firestore';

export class BadgeService {
  private static instance: BadgeService;
  private readonly usersCollection = 'users';
  
  private constructor() {}
  
  static getInstance(): BadgeService {
    if (!BadgeService.instance) {
      BadgeService.instance = new BadgeService();
    }
    return BadgeService.instance;
  }

  async getUserBadges(userId: string): Promise<Badge[]> {
    try {
      const userDoc = await getDoc(doc(db, this.usersCollection, userId));
      const userData = userDoc.data();
      return userData?.badges || [];
    } catch (error) {
      console.error('Error getting user badges:', error);
      return [];
    }
  }

  async checkAndAwardBadges(userId: string, completedTask: Task): Promise<Badge[]> {
    try {
      const userDoc = await getDoc(doc(db, this.usersCollection, userId));
      const userData = userDoc.data();
      const currentBadges = userData?.badges || [];
      const completedTasks = userData?.completedTasks || [];
      const totalXP = userData?.xp || 0;
      
      const newBadges: Badge[] = [];
      
      // Check each badge
      for (const badge of BADGES) {
        // Skip if already earned
        if (currentBadges.find(b => b.id === badge.id)) {
          continue;
        }
        
        // Check XP requirement
        if (totalXP < badge.requiredXP) {
          continue;
        }
        
        // Check tasks requirement if exists
        if (badge.requiredTasks) {
          const relevantTasks = badge.category
            ? completedTasks.filter(t => t.category === badge.category)
            : completedTasks;
            
          if (relevantTasks.length < badge.requiredTasks) {
            continue;
          }
        }
        
        // Award badge
        const newBadge: Badge = {
          ...badge,
          unlockedAt: new Date()
        };
        
        newBadges.push(newBadge);
      }
      
      // Save new badges
      if (newBadges.length > 0) {
        await updateDoc(doc(db, this.usersCollection, userId), {
          badges: [...currentBadges, ...newBadges]
        });
      }
      
      return newBadges;
    } catch (error) {
      console.error('Error checking and awarding badges:', error);
      return [];
    }
  }

  async awardTestBadge(userId: string): Promise<Badge> {
    try {
      const userDoc = await getDoc(doc(db, this.usersCollection, userId));
      const userData = userDoc.data();
      const currentBadges = userData?.badges || [];

      // Test rozeti oluştur
      const testBadge: Badge = {
        id: 'first_task',
        name: 'İlk Görev',
        description: 'İlk görevini tamamladın!',
        icon: '🌟',
        level: 'BRONZE',
        requiredXP: 0,
        unlockedAt: new Date()
      };

      // Rozeti kaydet
      await updateDoc(doc(db, this.usersCollection, userId), {
        badges: [...currentBadges, testBadge]
      });

      return testBadge;
    } catch (error) {
      console.error('Error awarding test badge:', error);
      throw error;
    }
  }
} 