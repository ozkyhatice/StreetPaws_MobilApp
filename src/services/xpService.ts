import { XPActivity, XP_REWARDS } from '../types/xp';
import { db } from '../config/firebase';
import { collection, doc, getDoc, updateDoc, increment, arrayUnion, query, where, orderBy, limit, getDocs, setDoc, onSnapshot } from 'firebase/firestore';
import { EmergencyLevel } from '../types/task';
import { BadgeService } from './badgeService';
import { calculateLevelFromXP, calculateProgressValue, calculateXpForNextLevel, calculateXpForLevel } from '../utils/levelUtils';

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
  // Use the same formula as in levelUtils.ts
  const level = calculateLevelFromXP(xp);
  const progress = calculateProgressValue(xp, level);
  
  return { level, progress };
}

export class XPService {
  private static instance: XPService;
  private readonly usersCollection = 'users';
  private readonly tasksCollection = 'tasks';
  
  // XP önbelleği - kullanıcıların XP değerlerini saklayarak tekrarlanan sorguları önler
  private xpCache: Map<string, {
    xp: number;
    timestamp: number;
    level: number;
  }> = new Map();
  
  // XP değişikliklerini dinlemek için abonelik fonksiyonları
  private xpListeners: Map<string, Function[]> = new Map();

  private constructor() {}

  static getInstance(): XPService {
    if (!XPService.instance) {
      XPService.instance = new XPService();
    }
    return XPService.instance;
  }
  
  // Tüm ekranlarda tutarlı XP değerlerine erişmek için merkezi bir metot
  async getCentralizedXP(userId: string): Promise<{
    xp: number;
    level: number;
  }> {
    try {
      // Önbellekte son 30 saniye içinde yüklenmiş güncel veri varsa, onu kullan
      const cached = this.xpCache.get(userId);
      const now = Date.now();
      if (cached && (now - cached.timestamp < 30000)) {
        console.log(`XPService: Using cached XP for user ${userId}: ${cached.xp} (Level ${cached.level})`);
        return {
          xp: cached.xp,
          level: cached.level
        };
      }
      
      // Kullanıcı belgesini al
      const userRef = doc(db, this.usersCollection, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log(`XPService: User document not found for ${userId}, returning default values`);
        return {
          xp: 0,
          level: 1
        };
      }
      
      const userData = userDoc.data();
      
      // Tamamlanan görevlerin XP'lerini topla
      const taskCompletions = userData.taskCompletions || [];
      const totalXP = taskCompletions.reduce((sum, task) => sum + (task.xp || 0), 0);
      
      // Seviyeyi hesapla
      const level = calculateLevelFromXP(totalXP);
      
      // Önbelleğe al
      this.xpCache.set(userId, {
        xp: totalXP,
        level,
        timestamp: now
      });
      
      console.log(`XPService: Calculated total XP from completed tasks for user ${userId}: ${totalXP} (Level ${level})`);
      
      return {
        xp: totalXP,
        level
      };
    } catch (error) {
      console.error(`XPService: Error getting centralized XP: ${error}`);
      return {
        xp: 0,
        level: 1
      };
    }
  }
  
  // Belirli bir süre (varsayılan: 10 dakika) sonra önbelleği temizleyen metot
  clearXPCache(userId?: string, timeout: number = 600000) {
    if (userId) {
      // Belirli bir kullanıcının önbelleğini temizle
      setTimeout(() => {
        this.xpCache.delete(userId);
        console.log(`XPService: Cleared cache for user ${userId}`);
      }, timeout);
    } else {
      // Tüm önbelleği temizle
      setTimeout(() => {
        this.xpCache.clear();
        console.log(`XPService: Cleared entire XP cache`);
      }, timeout);
    }
  }
  
  // XP değişikliklerini dinlemek için
  subscribeToXPChanges(userId: string, callback: (xp: number, level: number) => void): () => void {
    // Kullanıcının Firestore belgesini dinle
    const userRef = doc(db, this.usersCollection, userId);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const xp = userData?.xp || 0;
        const level = calculateLevelFromXP(xp);
        
        // Önbelleği güncelle
        this.xpCache.set(userId, {
          xp,
          level,
          timestamp: Date.now()
        });
        
        // Callback'i çağır
        callback(xp, level);
      }
    }, (error) => {
      console.error(`XPService: Error listening to XP changes for user ${userId}:`, error);
    });
    
    // Dinleyici listesine ekle
    if (!this.xpListeners.has(userId)) {
      this.xpListeners.set(userId, []);
    }
    this.xpListeners.get(userId)?.push(callback);
    
    return unsubscribe;
  }
  
  // Tüm dinleyicileri kaldır
  unsubscribeAllXPListeners(userId: string): void {
    this.xpListeners.delete(userId);
  }

  async getUserXP(userId: string): Promise<UserXPData> {
    // Öncelikle merkezi metodu kullan
    const { xp, level } = await this.getCentralizedXP(userId);
    
    const userDoc = await getDoc(doc(db, this.usersCollection, userId));
    const userData = userDoc.data();
    
    const nextLevelXP = calculateXpForNextLevel(level);
    const currentLevelXP = calculateXpForLevel(level);
    const progress = calculateProgressValue(xp, level);

    return {
      userId,
      currentLevel: level,
      totalXP: xp,
      level,
      currentLevelXP: Math.floor(progress * 100),
      xpToNextLevel: nextLevelXP - currentLevelXP,
      recentActivities: userData?.recentActivities || [],
      taskCompletions: userData?.taskCompletions || [],
      streak: userData?.streak || 0,
      lastTaskCompletionDate: userData?.lastTaskCompletionDate || null
    };
  }

  async addXP(userId: string, activity: XPActivity): Promise<void> {
    try {
      // XP aktivitesini logla
      console.log(`Adding XP activity to user ${userId}: ${activity.xpAmount} XP for ${activity.title}`);
      
      // Aktiviteye zaman damgası ekle
      const activityWithTimestamp = {
        ...activity,
        timestamp: new Date().toISOString()
      };
      
      // Görev tamamlama kaydı olarak ekle
      const taskCompletion = {
        taskId: `activity_${Date.now()}`,
        xp: activity.xpAmount,
        timestamp: new Date().toISOString(),
        title: activity.title,
        isEmergency: false
      };
      
      // Firestore güncellemesi
      const userRef = doc(db, this.usersCollection, userId);
      
      await updateDoc(userRef, {
        recentActivities: arrayUnion(activityWithTimestamp),
        taskCompletions: arrayUnion(taskCompletion)
      });
      
      // XP önbelleğini temizle
      this.xpCache.delete(userId);
      
      console.log(`XPService: Added activity for user ${userId}: ${activity.title}`);
    } catch (error) {
      console.error(`XPService: Error adding XP activity for user ${userId}: ${error.message}`);
    }
  }

  async addTaskCompletionXP(
    userId: string, 
    taskId: string, 
    taskTitle: string, 
    isEmergency: boolean = false, 
    emergencyLevel?: EmergencyLevel
  ): Promise<void> {
    try {
      // Temel XP hesapla
      let xpAmount = XP_REWARDS.TASK_COMPLETION;
      
      // Acil durum için ekstra XP
      if (isEmergency && emergencyLevel) {
        if (emergencyLevel === 'URGENT') {
          xpAmount += XP_REWARDS.EMERGENCY_TASK_URGENT;
        } else if (emergencyLevel === 'CRITICAL') {
          xpAmount += XP_REWARDS.EMERGENCY_TASK_CRITICAL;
        }
      }
      
      console.log(`Adding task completion for user ${userId}: "${taskTitle}" (XP: ${xpAmount})`);
      
      // Görev tamamlama kaydı
      const taskCompletion = {
        taskId: taskId || 'unknown',
        xp: xpAmount,
        timestamp: new Date().toISOString(),
        isEmergency: isEmergency || false,
        title: taskTitle || 'Görev'
      };
      
      // Kullanıcı belgesini kontrol et
      const userRef = doc(db, this.usersCollection, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log(`XPService: User does not exist, creating new document for user ${userId}`);
        // Yeni kullanıcı belgesi oluştur
        await setDoc(userRef, {
          userId: userId,
          recentActivities: [],
          taskCompletions: [taskCompletion],
          stats: {
            tasksCompleted: 1
          },
          lastTaskCompletionDate: new Date().toISOString(),
          xp: xpAmount // XP'yi başlat
        });
      } else {
        // Mevcut kullanıcı belgesini güncelle
        await updateDoc(userRef, {
          taskCompletions: arrayUnion(taskCompletion),
          lastTaskCompletionDate: new Date().toISOString(),
          'stats.tasksCompleted': increment(1),
          xp: increment(xpAmount) // XP'yi artır
        });
      }
      
      // XP önbelleğini temizle
      this.xpCache.delete(userId);
      
      console.log(`XPService: Updated user ${userId} with task completion data`);
      
      // Çoklu görev bonuslarını kontrol et
      await this.checkAndAddMultipleTaskBonus(userId);
    } catch (error) {
      console.error(`XPService: Error in addTaskCompletionXP for user ${userId}: ${error.message}`);
    }
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
  
  async updateTaskProgressForCategory(userId: string, category: string): Promise<void> {
    try {
      // Mevcut ilerleme bilgilerini al
      const progress = await this.getTaskProgress(userId);
      
      // İlgili kategori sayısını artır
      progress.currentTasksCount[category] = (progress.currentTasksCount[category] || 0) + 1;
      
      console.log(`XPService: Updated task progress for user ${userId}, category ${category}:`, progress.currentTasksCount);
      
      // Firestore güncellemesi
      const userRef = doc(db, this.usersCollection, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log(`XPService: User document not found, creating new document for user ${userId}`);
        // Kullanıcı belgesi yoksa yeni oluştur
        await setDoc(userRef, {
          userId: userId,
          stats: {
            tasksCompleted: 1
          },
          [`achievements.categories.${category.toLowerCase()}`]: 1
        });
        return;
      }
      
      // Kullanıcı verilerini al
      const userData = userDoc.data();
      
      // Mevcut kategori sayısını kontrol et
      const currentCategoryCount = userData?.achievements?.categories?.[category.toLowerCase()] || 0;
      
      // Mevcut görev sayısını kontrol et
      const currentTaskCount = userData?.stats?.tasksCompleted || 0;
      
      // Kategori sayısını güncelle (sadece mevcut sayıdan büyükse)
      const newCategoryCount = Math.max(currentCategoryCount + 1, progress.currentTasksCount[category]);
      
      // Firestore güncellemesi
      await updateDoc(userRef, {
        [`achievements.categories.${category.toLowerCase()}`]: newCategoryCount
      });
      
      console.log(`XPService: Firestore updated with category count for ${category}: ${newCategoryCount}`);
      
      // Rozetleri kontrol et
      await this.checkAndAwardBadgesForCategory(userId, category, newCategoryCount);
    } catch (error) {
      console.error(`XPService: Error updating task progress for category: ${error.message}`);
    }
  }

  private async checkAndAwardBadgesForCategory(userId: string, category: string, count: number): Promise<void> {
    try {
      // Rozet eşik değerleri
      const badgeThresholds = {
        bronze: 5,
        silver: 10,
        gold: 25
      };
      
      console.log(`XPService: Checking badges for user ${userId}, category ${category}, count ${count}`);
      
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
    } catch (error) {
      console.error(`XPService: Error checking badges for category: ${error.message}`);
    }
  }
  
  private async awardBadge(userId: string, badgeId: string, badgeName: string): Promise<void> {
    try {
      console.log(`XPService: Awarding badge to user ${userId}: ${badgeName} (${badgeId})`);
      
      // XP Ödülü
      await this.addXP(userId, {
        title: 'Rozet Kazanıldı',
        description: `"${badgeName}" rozeti kazanıldı!`,
        xpAmount: 200,
        type: 'BADGE_EARNED'
      });
      
      // Firestore güncellemesi
      const userRef = doc(db, this.usersCollection, userId);
      
      await updateDoc(userRef, {
        [`badges.${badgeId}`]: {
          earnedAt: new Date().toISOString(),
          name: badgeName
        }
      });
      
      console.log(`XPService: Badge ${badgeId} saved to Firestore for user ${userId}`);
    } catch (error) {
      console.error(`XPService: Error awarding badge: ${error.message}`);
    }
  }
  
  async getTaskProgress(userId: string): Promise<{ 
    completedTasks: number; 
    awaitingApprovalTasks: number;
    totalStreakDays: number;
    currentTasksCount: { [key: string]: number } 
  }> {
    try {
      if (!userId) {
        throw new Error('UserId is required');
      }
      
      console.log(`XPService: Getting task progress for user ${userId}`);
      
      // Kullanıcı bilgilerini Firestore'dan al
      const userDoc = await getDoc(doc(db, this.usersCollection, userId));
      
      // Varsayılan kategori sayaçları
      const categoryCount: { [key: string]: number } = {
        FEEDING: 0,
        CLEANING: 0,
        HEALTH: 0,
        SHELTER: 0,
        OTHER: 0
      };
      
      // Kullanıcı bulunamazsa varsayılan değerleri döndür
      if (!userDoc.exists()) {
        console.log(`XPService: User document not found for userId: ${userId}`);
        return {
          completedTasks: 0,
          awaitingApprovalTasks: 0,
          totalStreakDays: 0,
          currentTasksCount: categoryCount
        };
      }
      
      const userData = userDoc.data();
      console.log(`XPService: User data retrieved for user ${userId}`);
      
      // Streak bilgisi
      const totalStreakDays = userData?.streak || 0;
      
      // COMPLETED durumundaki görevleri sorgula
      const completedTasksQuery = query(
        collection(db, this.tasksCollection),
        where('completedBy.id', '==', userId),
        where('status', '==', 'COMPLETED')
      );
      
      // AWAITING_APPROVAL durumundaki görevleri sorgula
      const awaitingApprovalTasksQuery = query(
        collection(db, this.tasksCollection),
        where('completedBy.id', '==', userId),
        where('status', '==', 'AWAITING_APPROVAL')
      );
      
      // Sorguları çalıştır
      const [completedSnapshot, awaitingApprovalSnapshot] = await Promise.all([
        getDocs(completedTasksQuery),
        getDocs(awaitingApprovalTasksQuery)
      ]);
      
      console.log(`XPService: Found ${completedSnapshot.size} completed tasks and ${awaitingApprovalSnapshot.size} awaiting approval tasks for user ${userId}`);
      
      // Tamamlanan görevlerin kategori dağılımını hesapla
      completedSnapshot.forEach(doc => {
        const task = doc.data();
        if (task.category && categoryCount.hasOwnProperty(task.category)) {
          categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;
        } else if (task.category) {
          categoryCount.OTHER = (categoryCount.OTHER || 0) + 1;
        }
      });
      
      // Kategori sayılarının toplamını hesapla - bu bizim görev sayımız olacak
      // Bu, görev sayısının doğru hesaplanmasını sağlar
      const categoryTotal = Object.values(categoryCount).reduce((sum, count) => sum + count, 0);
      
      // Firestore'dan gelen sayıyı tamamen görmezden gel, sadece kategori toplamını kullan
      // Bu, görev sayısının 3 katına çıkması sorununu önler
      const result = {
        completedTasks: categoryTotal,
        awaitingApprovalTasks: awaitingApprovalSnapshot.size,
        totalStreakDays,
        currentTasksCount: categoryCount
      };
      
      console.log(`XPService: Task progress result for user ${userId}:`, result);
      
      // Eğer kategori toplamı ile kullanıcı belgesindeki görev sayısı farklıysa,
      // kullanıcı belgesini güncelle (bu, ileriki sorgularda tutarlılık sağlar)
      const storedTaskCount = userData?.stats?.tasksCompleted || 0;
      if (storedTaskCount !== categoryTotal) {
        console.log(`XPService: Updating stored task count from ${storedTaskCount} to ${categoryTotal}`);
        const userRef = doc(db, this.usersCollection, userId);
        await updateDoc(userRef, {
          'stats.tasksCompleted': categoryTotal
        });
      }
      
      return result;
    } catch (error) {
      console.error('XPService: Error getting task progress:', error);
      // Hata durumunda varsayılan değerler döndür
      return {
        completedTasks: 0,
        awaitingApprovalTasks: 0,
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
  
  private async checkAndAddMultipleTaskBonus(userId: string): Promise<void> {
    try {
      // Kullanıcı belgesini al
      const userRef = doc(db, this.usersCollection, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log(`XPService: User not found for bonus check: ${userId}`);
        return;
      }
      
      // Kullanıcının görev tamamlama kayıtlarını al
      const userData = userDoc.data();
      const taskCompletions = userData.taskCompletions || [];
      
      // Son 24 saat içinde tamamlanan görevleri filtrele
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentCompletions = taskCompletions.filter(task => {
        const completionDate = new Date(task.timestamp);
        return completionDate >= oneDayAgo;
      });
      
      // Bonus XP hesapla (her görev için artan bonus)
      if (recentCompletions.length >= 2) {
        const bonusXP = Math.min(recentCompletions.length * 10, 50); // Max 50 XP bonus
        
        console.log(`XPService: User ${userId} completed ${recentCompletions.length} tasks in 24 hours. Awarding ${bonusXP} bonus XP`);
        
        // Bonus XP ver
        await this.addXP(userId, {
          title: 'Çoklu Görev Bonusu',
          description: `24 saat içinde ${recentCompletions.length} görev tamamlandı`,
          xpAmount: bonusXP,
          type: 'MULTIPLE_TASK_BONUS'
        });
      }
    } catch (error) {
      console.error(`XPService: Error checking for multiple task bonus: ${error.message}`);
    }
  }

  // Check and update user's daily streak
  async checkAndUpdateDailyStreak(userId: string): Promise<{
    streakUpdated: boolean;
    currentStreak: number;
    xpAwarded: number;
  }> {
    try {
      if (!userId) {
        throw new Error('UserId is required');
      }
      
      console.log(`XPService: Checking daily streak for user ${userId}`);
      
      // Get user data
      const userRef = doc(db, this.usersCollection, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log(`XPService: User document not found for userId: ${userId}`);
        return {
          streakUpdated: false,
          currentStreak: 0,
          xpAwarded: 0
        };
      }
      
      const userData = userDoc.data();
      const currentStreak = userData.streak || 0;
      const lastLoginDate = userData.lastLoginDate ? new Date(userData.lastLoginDate) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      // If no previous login or last login was more than 2 days ago, reset streak
      if (!lastLoginDate) {
        // First login ever, set streak to 1
        await updateDoc(userRef, {
          streak: 1,
          lastLoginDate: new Date().toISOString()
        });
        
        // Award XP for first login
        await this.addXP(userId, {
          title: 'İlk Giriş',
          description: 'Uygulamaya ilk giriş',
          xpAmount: XP_REWARDS.DAILY_LOGIN,
          type: 'DAILY_LOGIN'
        });
        
        return {
          streakUpdated: true,
          currentStreak: 1,
          xpAwarded: XP_REWARDS.DAILY_LOGIN
        };
      }
      
      // Calculate days difference
      const lastLoginDay = new Date(lastLoginDate);
      lastLoginDay.setHours(0, 0, 0, 0); // Reset time to start of day
      
      const diffTime = today.getTime() - lastLoginDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      console.log(`XPService: Days since last login: ${diffDays}`);
      
      // If last login was today, no streak update needed
      if (diffDays === 0) {
        return {
          streakUpdated: false,
          currentStreak,
          xpAwarded: 0
        };
      }
      
      // If last login was yesterday, increment streak
      if (diffDays === 1) {
        const newStreak = currentStreak + 1;
        
        // Update streak in database
        await updateDoc(userRef, {
          streak: newStreak,
          lastLoginDate: new Date().toISOString()
        });
        
        // Calculate XP reward based on streak milestones
        let xpReward = XP_REWARDS.DAILY_LOGIN;
        let streakBonus = 0;
        
        // Add streak bonuses
        if (newStreak === 3) streakBonus = XP_REWARDS.STREAK_BONUS_3;
        else if (newStreak === 5) streakBonus = XP_REWARDS.STREAK_BONUS_5;
        else if (newStreak === 7) streakBonus = XP_REWARDS.STREAK_BONUS_7;
        else if (newStreak === 14) streakBonus = XP_REWARDS.STREAK_BONUS_14;
        else if (newStreak === 30) streakBonus = XP_REWARDS.STREAK_BONUS_30;
        
        const totalXP = xpReward + streakBonus;
        
        // Award XP for login streak
        await this.addXP(userId, {
          title: 'Günlük Giriş',
          description: streakBonus > 0 
            ? `${newStreak} günlük seri! Bonus: ${streakBonus} XP` 
            : `${newStreak} günlük seri`,
          xpAmount: totalXP,
          type: 'DAILY_LOGIN'
        });
        
        // Check for streak badges
        const badgeService = BadgeService.getInstance();
        await badgeService.checkAllCategoryBadges(userId);
        
        return {
          streakUpdated: true,
          currentStreak: newStreak,
          xpAwarded: totalXP
        };
      }
      
      // If more than 1 day passed, reset streak to 1
      await updateDoc(userRef, {
        streak: 1,
        lastLoginDate: new Date().toISOString()
      });
      
      // Award XP for new streak start
      await this.addXP(userId, {
        title: 'Yeni Seri Başlangıcı',
        description: 'Yeni günlük giriş serisi başlattınız',
        xpAmount: XP_REWARDS.DAILY_LOGIN,
        type: 'DAILY_LOGIN'
      });
      
      return {
        streakUpdated: true,
        currentStreak: 1,
        xpAwarded: XP_REWARDS.DAILY_LOGIN
      };
    } catch (error) {
      console.error('XPService: Error checking daily streak:', error);
      return {
        streakUpdated: false,
        currentStreak: 0,
        xpAwarded: 0
      };
    }
  }
  
  // Get task counts by priority
  async getTaskCountsByPriority(userId: string): Promise<{ HIGH: number; MEDIUM: number; LOW: number; }> {
    try {
      if (!userId) {
        throw new Error('UserId is required');
      }
      
      console.log(`XPService: Getting task counts by priority for user ${userId}`);
      
      // Default priority counts
      const priorityCounts = {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      };
      
      // Query completed tasks
      const completedTasksQuery = query(
        collection(db, this.tasksCollection),
        where('completedBy.id', '==', userId),
        where('status', '==', 'COMPLETED')
      );
      
      const completedSnapshot = await getDocs(completedTasksQuery);
      
      // Count tasks by priority
      completedSnapshot.forEach(doc => {
        const task = doc.data();
        if (task.priority && priorityCounts.hasOwnProperty(task.priority)) {
          priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
        }
      });
      
      console.log(`XPService: Task counts by priority for user ${userId}:`, priorityCounts);
      
      return priorityCounts;
    } catch (error) {
      console.error('XPService: Error getting task counts by priority:', error);
      return {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      };
    }
  }
} 