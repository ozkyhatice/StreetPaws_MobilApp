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
        let taskCount = 0;
        
        switch (badge.requirement.type) {
          case 'TASK_COUNT':
            taskCount = progressData.completedTasks;
            meetsRequirement = taskCount >= badge.requirement.count;
            break;
          case 'CATEGORY_COUNT':
            if (badge.requirement.category && progressData.currentTasksCount[badge.requirement.category]) {
              taskCount = progressData.currentTasksCount[badge.requirement.category];
              meetsRequirement = taskCount >= badge.requirement.count;
              
              // Debug için logla
              console.log(`Badge check for ${badge.id}: Category ${badge.requirement.category} has ${taskCount} tasks, requirement is ${badge.requirement.count}`);
            }
            break;
          case 'STREAK_DAYS':
            taskCount = progressData.totalStreakDays;
            meetsRequirement = taskCount >= badge.requirement.count;
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

  // Özel bir metot ekleyelim: Sağlık kategorisi için rozet kontrolü
  async checkAndAwardHealthBadge(userId: string): Promise<boolean> {
    try {
      const xpService = XPService.getInstance();
      const progressData = await xpService.getTaskProgress(userId);
      
      // Sağlık kategorisindeki görev sayısını kontrol et
      const healthTaskCount = progressData.currentTasksCount['HEALTH'] || 0;
      console.log(`Health category task count for user ${userId}: ${healthTaskCount}`);
      
      if (healthTaskCount < 10) {
        console.log(`Not enough health tasks (${healthTaskCount}) for badge`);
        return false;
      }
      
      // Kullanıcının rozetlerini al
      const userDoc = await getDoc(doc(db, this.usersCollection, userId));
      if (!userDoc.exists()) {
        console.log(`User ${userId} not found`);
        return false;
      }
      
      const userData = userDoc.data();
      const userBadges = userData.badges || [];
      
      // Sağlık rozeti var mı kontrol et
      const healthBadge = userBadges.find((badge: UserBadge) => badge.id === 'health_hero_bronze');
      
      if (healthBadge) {
        console.log(`User ${userId} already has health badge`);
        return false;
      }
      
      // BADGES listesinden sağlık rozetini bul
      const healthBadgeTemplate = BADGES.find(badge => badge.id === 'health_hero_bronze');
      
      if (!healthBadgeTemplate) {
        console.log('Health badge template not found in BADGES');
        return false;
      }
      
      // Rozeti oluştur ve kullanıcıya ver
      const level = Math.floor(healthTaskCount / 10) + 1;
      const remainingCount = healthTaskCount % 10;
      
      const userBadge: UserBadge = {
        ...healthBadgeTemplate,
        earnedAt: new Date().toISOString(),
        progress: Math.floor((remainingCount / 10) * 100),
        level: level,
        currentCount: remainingCount,
        maxCount: 10
      };
      
      // Kullanıcıya rozeti ekle
      await updateDoc(doc(db, this.usersCollection, userId), {
        badges: arrayUnion(userBadge)
      });
      
      // XP ödülü ver
      const xpAmount = healthBadgeTemplate.xpReward * level;
      await xpService.addAchievementXP(
        userId,
        `${healthBadgeTemplate.name} - Seviye ${level}`,
        `${healthBadgeTemplate.description} rozetini kazandın!`,
        'MEDIUM'
      );
      
      console.log(`Successfully awarded health badge to user ${userId} at level ${level}`);
      return true;
    } catch (error) {
      console.error('Error checking health badge:', error);
      return false;
    }
  }
  
  // Mevcut tüm kategorileri kontrol edip rozet ver
  async checkAllCategoryBadges(userId: string): Promise<{
    badgesAwarded: string[];
  }> {
    try {
      const xpService = XPService.getInstance();
      const progressData = await xpService.getTaskProgress(userId);
      const badgesAwarded: string[] = [];
      
      // Tüm kategorileri kontrol et
      const categories = ['FEEDING', 'HEALTH', 'SHELTER', 'CLEANING'];
      
      for (const category of categories) {
        const taskCount = progressData.currentTasksCount[category] || 0;
        
        // 10 veya daha fazla görev tamamlanmışsa rozet ver
        if (taskCount >= 10) {
          const badgeId = `${category.toLowerCase()}_specialist_bronze`;
          if (category === 'HEALTH') {
            const awarded = await this.checkAndAwardHealthBadge(userId);
            if (awarded) {
              badgesAwarded.push('health_hero_bronze');
            }
          } else {
            // Diğer kategoriler için benzer işlem
            const badgeTemplate = BADGES.find(badge => badge.id === badgeId);
            if (badgeTemplate) {
              const userDoc = await getDoc(doc(db, this.usersCollection, userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                const userBadges = userData.badges || [];
                
                // Kullanıcının bu rozeti var mı kontrol et
                const hasBadge = userBadges.some((badge: UserBadge) => badge.id === badgeId);
                
                if (!hasBadge) {
                  const level = Math.floor(taskCount / 10) + 1;
                  const remainingCount = taskCount % 10;
                  
                  const userBadge: UserBadge = {
                    ...badgeTemplate,
                    earnedAt: new Date().toISOString(),
                    progress: Math.floor((remainingCount / 10) * 100),
                    level: level,
                    currentCount: remainingCount,
                    maxCount: 10
                  };
                  
                  await updateDoc(doc(db, this.usersCollection, userId), {
                    badges: arrayUnion(userBadge)
                  });
                  
                  badgesAwarded.push(badgeId);
                }
              }
            }
          }
        }
      }
      
      return { badgesAwarded };
    } catch (error) {
      console.error('Error checking all category badges:', error);
      return { badgesAwarded: [] };
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
      let badgesChanged = false;
      
      // Kategori bazlı rozetleri güncelle
      if (taskCategoryType) {
        console.log(`Updating badges for category: ${taskCategoryType}`);
        
        // İlgili kategoriye ait rozetleri bul
        for (let i = 0; i < updatedBadges.length; i++) {
          const badge = updatedBadges[i];
          
          // Kategori rozeti mi kontrol et
          if (badge.requirement?.type === 'CATEGORY_COUNT' && 
              badge.requirement?.category === taskCategoryType) {
            
            // Rozet ilerlemesini güncelle
            badge.currentCount = (badge.currentCount || 0) + 1;
            badge.progress = Math.floor((badge.currentCount / badge.maxCount) * 100);
            
            console.log(`Updated badge ${badge.id}: ${badge.currentCount}/${badge.maxCount} (${badge.progress}%)`);
            
            // Seviye atlama kontrolü
            if (badge.currentCount >= badge.maxCount) {
              const oldLevel = badge.level;
              badge.level = (badge.level || 1) + 1;
              badge.currentCount = 0; // Sayacı sıfırla
              badge.progress = 0; // İlerlemeyi sıfırla
              
              levelsGained.push({
                badgeId: badge.id,
                newLevel: badge.level
              });
              
              console.log(`Badge ${badge.id} leveled up from ${oldLevel} to ${badge.level}!`);
              
              // XP ödülü
              const badgeTemplate = BADGES.find(b => b.id === badge.id);
              if (badgeTemplate) {
                const xpAmount = badgeTemplate.xpReward * (badge.level - 1); // Önceki seviyeye göre XP
                totalXPAwarded += xpAmount;
                
                // XP ekle
                const xpService = XPService.getInstance();
                await xpService.addXP(userId, {
                  title: 'Rozet Seviye Atladı',
                  description: `"${badge.name}" rozeti seviye ${badge.level} oldu!`,
                  xpAmount: xpAmount,
                  type: 'BADGE_LEVEL_UP'
                });
              }
            }
            
            badgesChanged = true;
          }
        }
      }
      
      // Genel görev tamamlama rozetlerini güncelle
      for (let i = 0; i < updatedBadges.length; i++) {
        const badge = updatedBadges[i];
        
        // Genel görev rozeti mi kontrol et
        if (badge.requirement?.type === 'TASK_COUNT') {
          // Rozet ilerlemesini güncelle
          badge.currentCount = (badge.currentCount || 0) + 1;
          badge.progress = Math.floor((badge.currentCount / badge.maxCount) * 100);
          
          console.log(`Updated general badge ${badge.id}: ${badge.currentCount}/${badge.maxCount} (${badge.progress}%)`);
          
          // Seviye atlama kontrolü
          if (badge.currentCount >= badge.maxCount) {
            const oldLevel = badge.level;
            badge.level = (badge.level || 1) + 1;
            badge.currentCount = 0; // Sayacı sıfırla
            badge.progress = 0; // İlerlemeyi sıfırla
            
            levelsGained.push({
              badgeId: badge.id,
              newLevel: badge.level
            });
            
            console.log(`General badge ${badge.id} leveled up from ${oldLevel} to ${badge.level}!`);
            
            // XP ödülü
            const badgeTemplate = BADGES.find(b => b.id === badge.id);
            if (badgeTemplate) {
              const xpAmount = badgeTemplate.xpReward * (badge.level - 1); // Önceki seviyeye göre XP
              totalXPAwarded += xpAmount;
              
              // XP ekle
              const xpService = XPService.getInstance();
              await xpService.addXP(userId, {
                title: 'Rozet Seviye Atladı',
                description: `"${badge.name}" rozeti seviye ${badge.level} oldu!`,
                xpAmount: xpAmount,
                type: 'BADGE_LEVEL_UP'
              });
            }
          }
          
          badgesChanged = true;
        }
      }
      
      // Değişiklik varsa Firestore'a kaydet
      if (badgesChanged) {
        await updateDoc(doc(db, this.usersCollection, userId), {
          badges: updatedBadges
        });
      }
      
      return {
        levelsGained,
        totalXPAwarded
      };
    } catch (error) {
      console.error('Error updating badge progress:', error);
      return {
        levelsGained: [],
        totalXPAwarded: 0
      };
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