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
  | 'ACHIEVEMENT';

export interface XPActivity {
  id: string;
  title: string;
  description: string;
  xpAmount: number;
  type: XPActivityType;
  timestamp: number;
}

export const XP_REWARDS = {
  TASK_COMPLETION: 100,
  DONATION: 50,
  EMERGENCY_HELP: 150,
  DAILY_LOGIN: 10,
  ACHIEVEMENT_SMALL: 50,
  ACHIEVEMENT_MEDIUM: 100,
  ACHIEVEMENT_LARGE: 200
} as const;

export const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}; 