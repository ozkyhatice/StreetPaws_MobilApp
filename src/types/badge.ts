export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredXP: number;
  requiredTasks?: number;
  category?: string;
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  unlockedAt?: Date;
}

export const BADGES: Badge[] = [
  {
    id: 'first_task',
    name: 'İlk Adım',
    description: 'İlk görevini tamamladın!',
    icon: '🎯',
    requiredXP: 0,
    requiredTasks: 1,
    level: 'BRONZE'
  },
  {
    id: 'helper_bronze',
    name: 'Yardımsever',
    description: '5 görev tamamladın',
    icon: '🤝',
    requiredXP: 100,
    requiredTasks: 5,
    level: 'BRONZE'
  },
  {
    id: 'helper_silver',
    name: 'Süper Yardımsever',
    description: '15 görev tamamladın',
    icon: '⭐',
    requiredXP: 300,
    requiredTasks: 15,
    level: 'SILVER'
  },
  {
    id: 'helper_gold',
    name: 'Altın Yürekli',
    description: '30 görev tamamladın',
    icon: '🏆',
    requiredXP: 600,
    requiredTasks: 30,
    level: 'GOLD'
  },
  {
    id: 'feeding_specialist',
    name: 'Besleme Uzmanı',
    description: '10 besleme görevi tamamladın',
    icon: '🍖',
    requiredXP: 200,
    requiredTasks: 10,
    category: 'FEEDING',
    level: 'SILVER'
  },
  {
    id: 'health_hero',
    name: 'Sağlık Kahramanı',
    description: '10 sağlık görevi tamamladın',
    icon: '⚕️',
    requiredXP: 200,
    requiredTasks: 10,
    category: 'HEALTH',
    level: 'SILVER'
  },
  {
    id: 'shelter_builder',
    name: 'Yuva Kurucu',
    description: '10 barınak görevi tamamladın',
    icon: '🏠',
    requiredXP: 200,
    requiredTasks: 10,
    category: 'SHELTER',
    level: 'SILVER'
  },
  {
    id: 'xp_master',
    name: 'XP Ustası',
    description: '1000 XP topladın',
    icon: '✨',
    requiredXP: 1000,
    level: 'PLATINUM'
  }
]; 