import { BADGES, Badge } from '../types/badge';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { XPService } from './xpService';

interface UserBadge extends Badge {
  earnedAt: string;
  progress: number;
}

interface BadgeProgress {
  badgeId: string;
  currentCount: number;
  requiredCount: number;
  percentage: number;
}

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

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const userDoc = await getDoc(doc(db, this.usersCollection, userId));
      if (!userDoc.exists()) {
        console.log(`No user document found for ID: ${userId}`);
        return [];
      }
      
      const userData = userDoc.data();
      if (!userData) {
        console.log(`No user data found for ID: ${userId}`);
        return [];
      }
      
      // If badges field doesn't exist, initialize it
      if (!userData.badges) {
        console.log(`Initializing badges array for user: ${userId}`);
        await updateDoc(doc(db, this.usersCollection, userId), {
          badges: []
        });
        return [];
      }
      
      return userData.badges;
    } catch (error) {
      console.error('Error getting user badges:', error);
      return [];
    }
  }

  async getBadgeProgress(userId: string): Promise<BadgeProgress[]> {
    const xpService = XPService.getInstance();
    const progressData = await xpService.getTaskProgress(userId);
    const userBadges = await this.getUserBadges(userId);
    const earnedBadgeIds = userBadges.map(badge => badge.id);
    
    const badgeProgress: BadgeProgress[] = [];
    
    // Filtrele: Sadece kazanılmamış rozetleri göster
    const unearnedBadges = BADGES.filter(badge => !earnedBadgeIds.includes(badge.id));
    
    for (const badge of unearnedBadges) {
      let currentCount = 0;
      const requiredCount = badge.requirement.count;
      
      switch (badge.requirement.type) {
        case 'TASK_COUNT':
          currentCount = progressData.completedTasks;
          break;
        case 'CATEGORY_COUNT':
          if (badge.requirement.category && progressData.currentTasksCount[badge.requirement.category]) {
            currentCount = progressData.currentTasksCount[badge.requirement.category];
          }
          break;
        case 'STREAK_DAYS':
          currentCount = progressData.totalStreakDays;
          break;
        case 'EMERGENCY_COUNT':
          // Acil durum sayısı için özel sorgu gerekebilir
          // Bu örnekte şimdilik 0 olarak bırakıyoruz
          currentCount = 0;
          break;
      }
      
      const percentage = Math.min((currentCount / requiredCount) * 100, 100);
      
      badgeProgress.push({
        badgeId: badge.id,
        currentCount,
        requiredCount,
        percentage
      });
    }
    
    // Tamamlanmaya en yakın rozetleri önce göster
    return badgeProgress.sort((a, b) => b.percentage - a.percentage);
  }
  
  async checkAndAwardBadges(userId: string): Promise<{
    newBadges: Badge[];
    totalXPAwarded: number;
  }> {
    try {
      const xpService = XPService.getInstance();
      const progressData = await xpService.getTaskProgress(userId);
      
      // Get user document
      const userDoc = await getDoc(doc(db, this.usersCollection, userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const userBadges = userData.badges || [];
      const earnedBadgeIds = userBadges.map(badge => badge.id);
      
      const newBadges: Badge[] = [];
      let totalXPAwarded = 0;
      
      // Her rozet için kontrol et
      for (const badge of BADGES) {
        // Eğer rozet zaten kazanılmışsa atla
        if (earnedBadgeIds.includes(badge.id)) {
          continue;
        }
        
        let meetsRequirement = false;
        
        switch (badge.requirement.type) {
          case 'TASK_COUNT':
            meetsRequirement = progressData.completedTasks >= badge.requirement.count;
            break;
          case 'CATEGORY_COUNT':
            if (badge.requirement.category && progressData.currentTasksCount[badge.requirement.category]) {
              meetsRequirement = progressData.currentTasksCount[badge.requirement.category] >= badge.requirement.count;
            }
            break;
          case 'STREAK_DAYS':
            meetsRequirement = progressData.totalStreakDays >= badge.requirement.count;
            break;
          case 'EMERGENCY_COUNT':
            // Acil durum sayısı için özel sorgu gerekebilir
            // Bu örnekte şimdilik false olarak bırakıyoruz
            meetsRequirement = false;
            break;
        }
        
        // Eğer gereksinimi karşılıyorsa rozeti ver
        if (meetsRequirement) {
          const userBadge: UserBadge = {
            ...badge,
            earnedAt: new Date().toISOString(),
            progress: 100
          };
          
          try {
            // Kullanıcıya rozeti ekle
            await updateDoc(doc(db, this.usersCollection, userId), {
              badges: arrayUnion(userBadge)
            });
            
            // XP ödülü ver
            await xpService.addAchievementXP(
              userId, 
              badge.name, 
              badge.description, 
              badge.level === 'BRONZE' ? 'SMALL' : badge.level === 'SILVER' || badge.level === 'GOLD' ? 'MEDIUM' : 'LARGE'
            );
            
            newBadges.push(badge);
            totalXPAwarded += badge.xpReward;
          } catch (error) {
            console.error(`Error awarding badge ${badge.id}:`, error);
            // Continue with other badges even if one fails
            continue;
          }
        }
      }
      
      return { newBadges, totalXPAwarded };
    } catch (error) {
      console.error('Error in checkAndAwardBadges:', error);
      return { newBadges: [], totalXPAwarded: 0 };
    }
  }
  
  async trackEmergencyTaskCompletion(userId: string): Promise<void> {
    const userDoc = await getDoc(doc(db, this.usersCollection, userId));
    const userData = userDoc.data();
    
    // Acil durum sayacını artır
    const emergencyCount = (userData?.emergencyTasksCompleted || 0) + 1;
    
    await updateDoc(doc(db, this.usersCollection, userId), {
      emergencyTasksCompleted: emergencyCount
    });
    
    // Rozetleri kontrol et
    await this.checkAndAwardBadges(userId);
  }

  async awardTestBadge(userId: string): Promise<Badge> {
      const testBadge: Badge = {
        id: 'first_task',
        name: 'İlk Görev',
        description: 'İlk görevini tamamladın!',
        level: 'BRONZE',
      category: 'GENERAL',
      iconName: 'heart',
      requirement: {
        type: 'TASK_COUNT',
        count: 1
      },
      xpReward: 50
    };
    
    const userBadge = {
      ...testBadge,
      earnedAt: new Date().toISOString(),
      progress: 100
    };
    
      await updateDoc(doc(db, this.usersCollection, userId), {
      badges: arrayUnion(userBadge)
      });

      return testBadge;
  }
} 