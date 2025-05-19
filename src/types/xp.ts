export interface UserXP {
  userId: string;
  totalXP: number;
  level: number;
  taskCompletions: {
    taskId: string;
    xp: number;
    timestamp: string;
  }[];
}

export type XPActivityType = 
  | 'TASK_COMPLETION'
  | 'DONATION'
  | 'EMERGENCY_HELP'
  | 'DAILY_LOGIN'
  | 'ACHIEVEMENT'
  | 'STREAK_BONUS'
  | 'MULTIPLE_TASK_BONUS'
  | 'EMERGENCY_TASK'
  | 'BADGE_EARNED';

export interface XPActivity {
  id?: string;
  title: string;
  description: string;
  xpAmount: number;
  type: XPActivityType;
  timestamp?: number;
}

export const XP_REWARDS = {
  TASK_COMPLETION: 100,
  DONATION: 50,
  EMERGENCY_HELP: 150,
  EMERGENCY_TASK_URGENT: 200,
  EMERGENCY_TASK_CRITICAL: 300,
  DAILY_LOGIN: 10,
  ACHIEVEMENT_SMALL: 50,
  ACHIEVEMENT_MEDIUM: 100,
  ACHIEVEMENT_LARGE: 200,
  STREAK_BONUS_3: 30,
  STREAK_BONUS_5: 50,
  STREAK_BONUS_7: 100,
  STREAK_BONUS_14: 200,
  STREAK_BONUS_30: 500,
  MULTIPLE_TASK_BONUS_5: 50,
  MULTIPLE_TASK_BONUS_10: 100,
  MULTIPLE_TASK_BONUS_20: 200,
  BADGE_EARNED: 200,
} as const;

export const calculateLevel = (xp: number): number => {
  return Math.floor(xp / 100) + 1;
};

export const getXPToNextLevel = (currentLevel: number): number => {
  return 100; // Always need 100 XP to level up
}; 