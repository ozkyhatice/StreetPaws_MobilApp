import { XPActivity, XP_REWARDS } from '../types/xp';
import { db } from '../config/firebase';
import { collection, doc, getDoc, updateDoc, increment, arrayUnion } from 'firebase/firestore';

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
}

function calculateUserLevel(xp: number): { level: number; progress: number } {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const progress = (xp - (level - 1) * (level - 1) * 100) / (level * level * 100);
  return { level, progress };
}

export class XPService {
  private static instance: XPService;
  private readonly usersCollection = 'users';

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
        taskCompletions: []
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
      taskCompletions: userData.taskCompletions || []
    };
  }

  async addXP(userId: string, activity: Omit<XPActivity, 'id' | 'timestamp'>): Promise<void> {
    const newActivity: XPActivity = {
      ...activity,
      id: doc(collection(db, 'random')).id,
      timestamp: Date.now(),
    };

    await updateDoc(doc(db, this.usersCollection, userId), {
      xp: increment(activity.xpAmount),
      recentActivities: arrayUnion(newActivity),
    });
  }

  async addTaskCompletionXP(userId: string, taskTitle: string): Promise<void> {
    await this.addXP(userId, {
      title: 'Görev Tamamlandı',
      description: `"${taskTitle}" görevi başarıyla tamamlandı`,
      xpAmount: XP_REWARDS.TASK_COMPLETION,
      type: 'TASK_COMPLETION',
    });
  }

  async addDonationXP(userId: string, amount: number): Promise<void> {
    await this.addXP(userId, {
      title: 'Bağış Yapıldı',
      description: `${amount}₺ tutarında bağış yapıldı`,
      xpAmount: XP_REWARDS.DONATION,
      type: 'DONATION',
    });
  }

  async addEmergencyHelpXP(userId: string, emergencyTitle: string): Promise<void> {
    await this.addXP(userId, {
      title: 'Acil Duruma Yardım',
      description: `"${emergencyTitle}" acil durumuna yardım edildi`,
      xpAmount: XP_REWARDS.EMERGENCY_HELP,
      type: 'EMERGENCY_HELP',
    });
  }

  async addDailyLoginXP(userId: string): Promise<void> {
    await this.addXP(userId, {
      title: 'Günlük Giriş',
      description: 'Uygulamaya günlük giriş yapıldı',
      xpAmount: XP_REWARDS.DAILY_LOGIN,
      type: 'DAILY_LOGIN',
    });
  }

  async addAchievementXP(
    userId: string,
    achievementTitle: string,
    achievementDescription: string,
    size: 'SMALL' | 'MEDIUM' | 'LARGE'
  ): Promise<void> {
    const xpAmount = XP_REWARDS[`ACHIEVEMENT_${size}`];
    await this.addXP(userId, {
      title: achievementTitle,
      description: achievementDescription,
      xpAmount,
      type: 'ACHIEVEMENT',
    });
  }
} 