import { XPActivity, UserXP, XP_REWARDS, calculateLevel } from '../types/xp';
import firestore from '@react-native-firebase/firestore';

interface UserXP {
  userId: string;
  totalXP: number;
  level: number;
  taskCompletions: {
    taskId: string;
    xp: number;
    timestamp: string;
  }[];
}

// Mock XP data
const mockUserXP: { [userId: string]: UserXP } = {};

const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const getUserXP = async (userId: string): Promise<UserXP> => {
  if (!mockUserXP[userId]) {
    mockUserXP[userId] = {
      userId,
      totalXP: 0,
      level: 1,
      taskCompletions: []
    };
  }
  return mockUserXP[userId];
};

export const addTaskCompletionXP = async (userId: string, taskId: string, xp: number): Promise<UserXP> => {
  const userXP = await getUserXP(userId);
  
  userXP.taskCompletions.push({
    taskId,
    xp,
    timestamp: new Date().toISOString()
  });
  
  userXP.totalXP += xp;
  userXP.level = calculateLevel(userXP.totalXP);
  
  mockUserXP[userId] = userXP;
  return userXP;
};

export const getLeaderboard = async (limit: number = 10): Promise<UserXP[]> => {
  return Object.values(mockUserXP)
    .sort((a, b) => b.totalXP - a.totalXP)
    .slice(0, limit);
};

export class XPService {
  private static instance: XPService;
  private readonly usersCollection = firestore().collection('users');

  private constructor() {}

  static getInstance(): XPService {
    if (!XPService.instance) {
      XPService.instance = new XPService();
    }
    return XPService.instance;
  }

  async getUserXP(userId: string): Promise<UserXP> {
    const userDoc = await this.usersCollection.doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData?.xp) {
      return {
        currentLevel: 1,
        totalXP: 0,
        currentLevelXP: 0,
        xpToNextLevel: 100,
        recentActivities: [],
      };
    }

    const { level, progress } = calculateLevel(userData.xp);
    const nextLevelXP = Math.ceil((1 - progress) * 100);

    return {
      currentLevel: level,
      totalXP: userData.xp,
      currentLevelXP: Math.floor(progress * 100),
      xpToNextLevel: nextLevelXP,
      recentActivities: userData.recentActivities || [],
    };
  }

  async addXP(userId: string, activity: Omit<XPActivity, 'id' | 'timestamp'>): Promise<void> {
    const newActivity: XPActivity = {
      ...activity,
      id: firestore().collection('random').doc().id,
      timestamp: Date.now(),
    };

    await this.usersCollection.doc(userId).update({
      xp: firestore.FieldValue.increment(activity.xpAmount),
      recentActivities: firestore.FieldValue.arrayUnion(newActivity),
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