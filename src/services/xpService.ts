import { XPActivity, XP_REWARDS } from '../types/xp';
import { db } from '../config/firebase';
import { collection, doc, getDoc, updateDoc, increment, arrayUnion, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { EmergencyLevel } from '../types/task';

interface UserXPData {
  userId: string;
  totalXP: number;
  level: number;
  currentLevel: number;
  currentLevelXP: number;
  xpToNextLevel: number;
  recentActivities: XPActivity[];
  taskCompletions: {
    taskId: string;
    xp: number;
    timestamp: string;
  }[];
  streak: number;
  lastTaskCompletionDate: string | null;
}

function calculateUserLevel(xp: number): { level: number; progress: number } {
  const baseXP = 100;
  const exponent = 1.5;
  
  let level = 1;
  let xpForCurrentLevel = 0;
  let xpForNextLevel = baseXP;
  
  while (xp >= xpForNextLevel) {
    level++;
    xpForCurrentLevel = xpForNextLevel;
    xpForNextLevel += Math.floor(baseXP * Math.pow(level, exponent));
  }
  
  const xpInCurrentLevel = xp - xpForCurrentLevel;
  const xpRequiredForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progress = xpInCurrentLevel / xpRequiredForNextLevel;
  
  return { level, progress };
}

export class XPService {
  private static instance: XPService;
  private readonly usersCollection = 'users';
  private readonly tasksCollection = 'tasks';

  private constructor() {}

  static getInstance(): XPService {
    if (!XPService.instance) {
      XPService.instance = new XPService();
    }
    return XPService.instance;
  }

  async getUserXP(userId: string): Promise<UserXPData> {
    const userDoc = await getDoc(doc(db, this.usersCollection, userId));
    const userData = userDoc.data();
    
    if (!userData?.xp) {
      return {
        userId,
        currentLevel: 1,
        totalXP: 0,
        level: 1,
        currentLevelXP: 0,
        xpToNextLevel: 100,
        recentActivities: [],
        taskCompletions: [],
        streak: 0,
        lastTaskCompletionDate: null
      };
    }

    const { level, progress } = calculateUserLevel(userData.xp);
    const nextLevelXP = Math.ceil((1 - progress) * 100);

    return {
      userId,
      currentLevel: level,
      totalXP: userData.xp,
      level,
      currentLevelXP: Math.floor(progress * 100),
      xpToNextLevel: nextLevelXP,
      recentActivities: userData.recentActivities || [],
      taskCompletions: userData.taskCompletions || [],
      streak: userData.streak || 0,
      lastTaskCompletionDate: userData.lastTaskCompletionDate || null
    };
  }

  async addXP(userId: string, activity: XPActivity): Promise<void> {
    // Simülasyon için konsola yazdır
    console.log(`Adding XP to user ${userId}: ${activity.xpAmount} XP for ${activity.title}`);
    
    // Firestore güncellemesi (gerçek uygulamada)
    // const userRef = doc(db, this.usersCollection, userId);
    
    // await updateDoc(userRef, {
    //   xp: increment(activity.xpAmount),
    //   recentActivities: arrayUnion(activity)
    // });
  }

  async addTaskCompletionXP(
    userId: string, 
    taskId: string, 
    taskTitle: string, 
    isEmergency: boolean = false, 
    emergencyLevel?: EmergencyLevel
  ): Promise<void> {
    // Temel XP ekle
    let xpAmount = XP_REWARDS.TASK_COMPLETION;
    
    // Acil durum ise ekstra XP ekle
    if (isEmergency && emergencyLevel) {
      if (emergencyLevel === 'URGENT') {
        xpAmount += XP_REWARDS.EMERGENCY_TASK_URGENT;
      } else if (emergencyLevel === 'CRITICAL') {
        xpAmount += XP_REWARDS.EMERGENCY_TASK_CRITICAL;
      }
    }
    
    console.log(`Adding task completion XP: ${xpAmount} for task "${taskTitle}"`);
    
    // XP ekle
    await this.addXP(userId, {
      title: 'Görev Tamamlandı',
      description: `"${taskTitle}" görevi başarıyla tamamlandı`,
      xpAmount: xpAmount,
      type: 'TASK_COMPLETION',
    });
    
    // Kullanıcı bilgilerini al - simülasyon için atlanabilir
    // const userDoc = await getDoc(doc(db, this.usersCollection, userId));
    // const userData = userDoc.data();
    
    // Görev tamamlama ekle
    const taskCompletion = {
      taskId,
      xp: xpAmount,
      timestamp: new Date().toISOString()
    };
    
    const updates: any = {
      taskCompletions: arrayUnion(taskCompletion),
      lastTaskCompletionDate: new Date().toISOString()
    };
    
    // Streak kontrolü - simülasyon için atlanabilir
    // Kullanıcıyı güncelle - simülasyon için atlanabilir
    console.log(`Updating user ${userId} with task completion:`, updates);
    
    // Çoklu görev ödüllerini kontrol et
    // await this.checkAndAddMultipleTaskBonus(userId);
  }

  async addEmergencyHelpXP(userId: string, emergencyTitle: string, emergencyLevel: EmergencyLevel = 'NORMAL', category: string): Promise<void> {
    let xpAmount = XP_REWARDS.EMERGENCY_HELP;
    
    // Acil durum seviyesine göre ek XP
    if (emergencyLevel === 'URGENT') {
      xpAmount += 50;
    } else if (emergencyLevel === 'CRITICAL') {
      xpAmount += 100;
    }
    
    console.log(`Adding emergency help XP: ${xpAmount} for emergency "${emergencyTitle}"`);
    
    // XP ekle
    await this.addXP(userId, {
      title: 'Acil Duruma Yardım',
      description: `"${emergencyTitle}" acil durumuna yardım edildi`,
      xpAmount: xpAmount,
      type: 'EMERGENCY_HELP',
    });
    
    // Kategori sayılarını güncelle
    await this.incrementCategoryCount(userId, category);
  }
  
  async incrementCategoryCount(userId: string, category: string): Promise<void> {
    try {
      console.log(`Incrementing category count for user ${userId}, category: ${category}`);
      
      // Firestore güncellemesi (gerçek uygulamada)
      // const categoryField = `achievements.categories.${category.toLowerCase()}`;
      // await updateDoc(doc(db, this.usersCollection, userId), {
      //   [categoryField]: increment(1)
      // });
      
      // Mevcut istatistikleri al
      const progress = await this.getTaskProgress(userId);
      
      // Kategori sayısını artır
      const currentCount = (progress.currentTasksCount[category] || 0) + 1;
      progress.currentTasksCount[category] = currentCount;
      
      // Rozetleri kontrol et
      await this.checkAndAwardBadgesForCategory(userId, category, currentCount);
      
      // Simülasyon için konsola yazdır
      console.log(`✅ Category count updated for user ${userId}: ${category} = ${currentCount}`);
    } catch (error) {
      console.error('Error incrementing category count:', error);
      throw error;
    }
  }
  
  private async checkAndAwardBadgesForCategory(userId: string, category: string, count: number): Promise<void> {
    // Rozet eşik değerleri
    const badgeThresholds = {
      bronze: 5,
      silver: 10,
      gold: 25
    };
    
    // Bronz rozet
    if (count === badgeThresholds.bronze) {
      await this.awardBadge(userId, `${category.toLowerCase()}_bronze`, `${category} Bronz Rozeti`);
    }
    
    // Gümüş rozet
    if (count === badgeThresholds.silver) {
      await this.awardBadge(userId, `${category.toLowerCase()}_silver`, `${category} Gümüş Rozeti`);
    }
    
    // Altın rozet
    if (count === badgeThresholds.gold) {
      await this.awardBadge(userId, `${category.toLowerCase()}_gold`, `${category} Altın Rozeti`);
    }
  }
  
  private async awardBadge(userId: string, badgeId: string, badgeName: string): Promise<void> {
    console.log(`🏆 Awarding badge to user ${userId}: ${badgeName} (${badgeId})`);
    
    // XP Ödülü
    await this.addXP(userId, {
      title: 'Rozet Kazanıldı',
      description: `"${badgeName}" rozeti kazanıldı!`,
      xpAmount: 200,
      type: 'BADGE_EARNED'
    });
    
    // Firestore güncellemesi (gerçek uygulamada)
    // await updateDoc(doc(db, this.usersCollection, userId), {
    //   [`badges.${badgeId}`]: {
    //     earnedAt: new Date().toISOString(),
    //     name: badgeName
    //   }
    // });
  }
  
  async getTaskProgress(userId: string): Promise<{ 
    completedTasks: number; 
    totalStreakDays: number;
    currentTasksCount: { [key: string]: number } 
  }> {
    try {
      if (!userId) {
        throw new Error('UserId is required');
      }
      
      // Simülasyon için varsayılan değerler
      return {
        completedTasks: 10,
        totalStreakDays: 3,
        currentTasksCount: {
          FEEDING: 2,
          CLEANING: 1,
          HEALTH: 4,
          SHELTER: 3,
          OTHER: 0
        }
      };
      
      // Kullanıcı bilgilerini al (gerçek uygulamada)
      // const userDoc = await getDoc(doc(db, this.usersCollection, userId));
      // 
      // if (!userDoc.exists()) {
      //   return {
      //     completedTasks: 0,
      //     totalStreakDays: 0,
      //     currentTasksCount: {
      //       FEEDING: 0,
      //       CLEANING: 0,
      //       HEALTH: 0,
      //       SHELTER: 0,
      //       OTHER: 0
      //     }
      //   };
      // }
      // 
      // const userData = userDoc.data();
      // 
      // // Tamamlanan görev sayısı
      // const completedTasks = userData?.taskCompletions?.length || 0;
      // 
      // // Toplam streak günü
      // const totalStreakDays = userData?.streak || 0;
      // 
      // // Tüm tamamlanmış görevleri al
      // const tasksQuery = query(
      //   collection(db, this.tasksCollection),
      //   where('completedBy.id', '==', userId),
      //   orderBy('createdAt', 'desc')
      // );
      // 
      // const tasksSnapshot = await getDocs(tasksQuery);
      // 
      // // Kategori bazında görev sayıları
      // const categoryCount: { [key: string]: number } = {
      //   FEEDING: 0,
      //   CLEANING: 0,
      //   HEALTH: 0,
      //   SHELTER: 0,
      //   OTHER: 0
      // };
      // 
      // tasksSnapshot.forEach(doc => {
      //   const task = doc.data();
      //   if (task.category) {
      //     categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;
      //   }
      // });
      // 
      // return {
      //   completedTasks,
      //   totalStreakDays,
      //   currentTasksCount: categoryCount
      // };
    } catch (error) {
      console.error('Error getting task progress:', error);
      // Hata durumunda varsayılan değerler döndür
      return {
        completedTasks: 0,
        totalStreakDays: 0,
        currentTasksCount: {
          FEEDING: 0,
          CLEANING: 0,
          HEALTH: 0,
          SHELTER: 0,
          OTHER: 0
        }
      };
    }
  }
  
  async updateTaskProgressForCategory(userId: string, category: string): Promise<void> {
    // Mevcut ilerleme bilgilerini al
    const progress = await this.getTaskProgress(userId);
    
    // İlgili kategori sayısını artır
    progress.currentTasksCount[category] = (progress.currentTasksCount[category] || 0) + 1;
    
    // Tamamlanan toplam görev sayısını artır
    progress.completedTasks += 1;
    
    console.log(`Updated task progress for user ${userId}, category ${category}:`, progress.currentTasksCount);
    
    // Firestore güncellemesi (gerçek uygulamada)
    // await updateDoc(doc(db, this.usersCollection, userId), {
    //   [`achievements.categories.${category.toLowerCase()}`]: increment(1),
    //   'stats.tasksCompleted': increment(1)
    // });
    
    // Rozetleri kontrol et
    await this.checkAndAwardBadgesForCategory(userId, category, progress.currentTasksCount[category]);
  }
} 