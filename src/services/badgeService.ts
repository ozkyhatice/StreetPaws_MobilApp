import { BADGES, Badge } from '../types/badge';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { XPService } from './xpService';

interface UserBadge extends Badge {
  earnedAt: string;
  progress: number;
  level: number; // Level number for the badge (1, 2, 3, etc.)
  currentCount: number; // Current count toward next level
  maxCount: number; // Maximum count needed to level up (usually 10)
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
            progress: 0, // Start at 0% progress for level 1
            level: 1,  // Start at level 1
            currentCount: 0, // Start at 0 count
            maxCount: 10  // Need 10 to level up
          };
          
          // For CATEGORY_COUNT badges, if the count is already ≥ 10, start at level 2 with 0/10
          if (badge.requirement.type === 'CATEGORY_COUNT' && 
              badge.requirement.category && 
              progressData.currentTasksCount[badge.requirement.category] >= 10) {
            
            // Calculate what level this badge should start at
            const taskCount = progressData.currentTasksCount[badge.requirement.category];
            const startingLevel = Math.floor(taskCount / 10) + 1;
            const remainingCount = taskCount % 10;
            
            userBadge.level = startingLevel;
            userBadge.currentCount = remainingCount;
            userBadge.progress = Math.floor((remainingCount / 10) * 100);
            
            console.log(`Awarding ${badge.name} badge at level ${startingLevel} with ${remainingCount}/10 progress`);
          }
          
          try {
            // Kullanıcıya rozeti ekle
            await updateDoc(doc(db, this.usersCollection, userId), {
              badges: arrayUnion(userBadge)
            });
            
            // XP ödülü ver (the XP amount is multiplied by the badge's level)
            const xpAmount = badge.xpReward * userBadge.level;
            await xpService.addAchievementXP(
              userId, 
              `${badge.name} - Seviye ${userBadge.level}`,
              `${badge.description} rozetini kazandın!`,
              badge.level === 'BRONZE' ? 'SMALL' : badge.level === 'SILVER' || badge.level === 'GOLD' ? 'MEDIUM' : 'LARGE'
            );
            
            newBadges.push(badge);
            totalXPAwarded += xpAmount;
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

  // Update badge progress when completing a task
  async updateBadgeProgress(userId: string, taskCategoryType?: string): Promise<{
    levelsGained: {badgeId: string, newLevel: number}[];
    totalXPAwarded: number;
  }> {
    try {
      const userDoc = await getDoc(doc(db, this.usersCollection, userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const userBadges = userData.badges || [];
      
      const updatedBadges = [...userBadges];
      const levelsGained: {badgeId: string, newLevel: number}[] = [];
      let totalXPAwarded = 0;
      const xpService = XPService.getInstance();

      // Update each badge's progress
      for (let i = 0; i < updatedBadges.length; i++) {
        const badge = updatedBadges[i] as UserBadge;
        
        // Skip if badge doesn't have level or counts (for backward compatibility)
        if (badge.level === undefined || badge.currentCount === undefined || badge.maxCount === undefined) {
          // Initialize these properties if they don't exist
          badge.level = 1;
          badge.currentCount = 0;
          badge.maxCount = 10;
        }
        
        let shouldIncrementCount = false;
        
        // Check if this task counts for this badge
        switch (badge.requirement.type) {
          case 'TASK_COUNT':
            // Any task counts
            shouldIncrementCount = true;
            break;
          case 'CATEGORY_COUNT':
            if (!badge.requirement.category) break;
            
            // Direct category match
            if (taskCategoryType === badge.requirement.category) {
              shouldIncrementCount = true;
              break;
            }
            
            // Handle special category mapping for emergency tasks
            // Some emergency tasks might be categorized differently in the UI than in the badge system
            if (taskCategoryType) {
              // Map 'OTHER' to appropriate badge categories for backwards compatibility
              if (taskCategoryType === 'OTHER') {
                const badgeCategory = badge.requirement.category;
                // Map OTHER to all categories to ensure badges progress
                // This ensures emergency tasks that default to OTHER or HEALTH 
                // will still increment all category badges
                shouldIncrementCount = ['FEEDING', 'CLEANING', 'HEALTH', 'SHELTER'].includes(badgeCategory);
              }
              
              // Map HEALTH emergency tasks to appropriate badge categories as needed
              if (taskCategoryType === 'HEALTH') {
                const badgeCategory = badge.requirement.category;
                // For emergency tasks that are health-related but need to count for other badge categories
                if (['FEEDING', 'SHELTER'].includes(badgeCategory)) {
                  shouldIncrementCount = true;
                }
              }
            }
            break;
          // Other badge types don't increment on task completion directly
        }
        
        if (shouldIncrementCount) {
          // Increment current count
          badge.currentCount = (badge.currentCount || 0) + 1;
          
          console.log(`Incrementing badge ${badge.id} (${badge.name}) from ${badge.currentCount-1} to ${badge.currentCount}/${badge.maxCount}`);
          
          // Check if badge should level up
          if (badge.currentCount >= badge.maxCount) {
            // Level up the badge
            badge.level = (badge.level || 1) + 1;
            badge.currentCount = 0; // Reset count for next level
            
            console.log(`Badge ${badge.id} (${badge.name}) leveled up to level ${badge.level} with 0/${badge.maxCount} progress`);
            
            // Add XP reward for leveling up (increase reward by level)
            const xpReward = badge.xpReward * badge.level;
            totalXPAwarded += xpReward;
            
            // Record level gain
            levelsGained.push({
              badgeId: badge.id,
              newLevel: badge.level
            });
            
            // Award XP for leveling up
            await xpService.addAchievementXP(
              userId,
              `${badge.name} - Seviye ${badge.level}`,
              `${badge.description} rozetiniz seviye ${badge.level} oldu!`,
              badge.level <= 2 ? 'SMALL' : badge.level <= 4 ? 'MEDIUM' : 'LARGE'
            );
          }
          
          // Update progress percentage for visual display
          badge.progress = Math.floor((badge.currentCount / badge.maxCount) * 100);
          
          // Update badge in array
          updatedBadges[i] = badge;
        }
      }
      
      // Update badges in Firestore
      await updateDoc(doc(db, this.usersCollection, userId), {
        badges: updatedBadges
      });
      
      return { levelsGained, totalXPAwarded };
    } catch (error) {
      console.error('Error updating badge progress:', error);
      return { levelsGained: [], totalXPAwarded: 0 };
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
      progress: 0,
      level: 1,
      currentCount: 0,
      maxCount: 10
    };
    
    await updateDoc(doc(db, this.usersCollection, userId), {
      badges: arrayUnion(userBadge)
    });

    return testBadge;
  }
  
  // Test method to manually advance a badge's progress
  async testAdvanceBadge(userId: string, badgeId: string, tasksToAdd: number = 1): Promise<{
    badgeUpdated: boolean;
    leveledUp: boolean;
    newLevel?: number;
    currentCount?: number;
    maxCount?: number;
  }> {
    try {
      // Get user document
      const userDoc = await getDoc(doc(db, this.usersCollection, userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      // Get user badges
      const userData = userDoc.data();
      const userBadges = userData.badges || [];
      
      // Find the specific badge to update
      const badgeIndex = userBadges.findIndex((badge: UserBadge) => badge.id === badgeId);
      if (badgeIndex === -1) {
        console.log(`Badge ${badgeId} not found for user ${userId}`);
        return { 
          badgeUpdated: false, 
          leveledUp: false 
        };
      }
      
      // Create a copy of the badges array to modify
      const updatedBadges = [...userBadges];
      const badge = updatedBadges[badgeIndex] as UserBadge;
      
      // Ensure badge has the required properties
      if (badge.level === undefined || badge.currentCount === undefined || badge.maxCount === undefined) {
        badge.level = 1;
        badge.currentCount = 0;
        badge.maxCount = 10;
      }
      
      // Store initial values
      const initialLevel = badge.level;
      
      // Add tasks to the badge's progress
      badge.currentCount += tasksToAdd;
      console.log(`Advanced badge ${badge.id} (${badge.name}) to ${badge.currentCount}/${badge.maxCount}`);
      
      let leveledUp = false;
      
      // Check if badge should level up
      if (badge.currentCount >= badge.maxCount) {
        // Calculate how many times to level up (in case tasksToAdd > maxCount)
        const levelsToAdd = Math.floor(badge.currentCount / badge.maxCount);
        badge.level += levelsToAdd;
        badge.currentCount = badge.currentCount % badge.maxCount;
        leveledUp = true;
        
        console.log(`Badge ${badge.id} (${badge.name}) leveled up ${levelsToAdd} times to level ${badge.level}`);
      }
      
      // Update progress percentage
      badge.progress = Math.floor((badge.currentCount / badge.maxCount) * 100);
      
      // Update badge in array
      updatedBadges[badgeIndex] = badge;
      
      // Update badges in Firestore
      await updateDoc(doc(db, this.usersCollection, userId), {
        badges: updatedBadges
      });
      
      return { 
        badgeUpdated: true, 
        leveledUp, 
        newLevel: badge.level,
        currentCount: badge.currentCount,
        maxCount: badge.maxCount
      };
    } catch (error) {
      console.error('Error in testAdvanceBadge:', error);
      return { 
        badgeUpdated: false, 
        leveledUp: false 
      };
    }
  }
} 