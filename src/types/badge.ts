export type BadgeLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export type BadgeCategory = 
  | 'GENERAL' 
  | 'TASK_COMPLETION' 
  | 'CATEGORY_SPECIFIC' 
  | 'STREAK' 
  | 'EMERGENCY' 
  | 'SPECIAL';

export interface Badge {
  id: string;
  name: string;
  description: string;
  level: BadgeLevel;
  category: BadgeCategory;
  iconName: string;
  requirement: {
    type: 'TASK_COUNT' | 'CATEGORY_COUNT' | 'STREAK_DAYS' | 'EMERGENCY_COUNT' | 'SPECIAL';
    count: number;
    category?: string;
  };
  xpReward: number;
}

export const BADGE_LEVELS: Record<BadgeLevel, { color: string; multiplier: number }> = {
  BRONZE: { color: '#CD7F32', multiplier: 1 },
  SILVER: { color: '#C0C0C0', multiplier: 2 },
  GOLD: { color: '#FFD700', multiplier: 3 },
  PLATINUM: { color: '#E5E4E2', multiplier: 4 },
  DIAMOND: { color: '#B9F2FF', multiplier: 5 }
};

export const BADGES: Badge[] = [
  // Genel görev tamamlama
  {
    id: 'general_helper_bronze',
    name: 'Yardımsever (Bronz)',
    description: '5 görev tamamla',
    level: 'BRONZE',
    category: 'GENERAL',
    iconName: 'heart',
    requirement: {
      type: 'TASK_COUNT',
      count: 5
    },
    xpReward: 50
  },
  {
    id: 'general_helper_silver',
    name: 'Yardımsever (Gümüş)',
    description: '15 görev tamamla',
    level: 'SILVER',
    category: 'GENERAL',
    iconName: 'heart',
    requirement: {
      type: 'TASK_COUNT',
      count: 15
    },
    xpReward: 100
  },
  {
    id: 'general_helper_gold',
    name: 'Yardımsever (Altın)',
    description: '30 görev tamamla',
    level: 'GOLD',
    category: 'GENERAL',
    iconName: 'heart',
    requirement: {
      type: 'TASK_COUNT',
      count: 30
    },
    xpReward: 150
  },
  
  // Kategoriye özel görevler
  {
    id: 'feeding_specialist_bronze',
    name: 'Besleme Uzmanı (Bronz)',
    description: '10 besleme görevi tamamla',
    level: 'BRONZE',
    category: 'CATEGORY_SPECIFIC',
    iconName: 'food',
    requirement: {
      type: 'CATEGORY_COUNT',
      count: 10,
      category: 'FEEDING'
    },
    xpReward: 75
  },
  {
    id: 'cleaning_specialist_bronze',
    name: 'Temizlik Uzmanı (Bronz)',
    description: '10 temizlik görevi tamamla',
    level: 'BRONZE',
    category: 'CATEGORY_SPECIFIC',
    iconName: 'clean',
    requirement: {
      type: 'CATEGORY_COUNT',
      count: 10,
      category: 'CLEANING'
    },
    xpReward: 75
  },
  {
    id: 'health_hero_bronze',
    name: 'Sağlık Kahramanı (Bronz)',
    description: '10 sağlık görevi tamamla',
    level: 'BRONZE',
    category: 'CATEGORY_SPECIFIC',
    iconName: 'medical',
    requirement: {
      type: 'CATEGORY_COUNT',
      count: 10,
      category: 'HEALTH'
    },
    xpReward: 75
  },
  {
    id: 'shelter_builder_bronze',
    name: 'Barınak Ustası (Bronz)',
    description: '10 barınak görevi tamamla',
    level: 'BRONZE',
    category: 'CATEGORY_SPECIFIC',
    iconName: 'home',
    requirement: {
      type: 'CATEGORY_COUNT',
      count: 10,
      category: 'SHELTER'
    },
    xpReward: 75
  },
  
  // Seri görevler
  {
    id: 'streak_3_days',
    name: '3 Gün Seri',
    description: '3 gün üst üste görev tamamla',
    level: 'BRONZE',
    category: 'STREAK',
    iconName: 'flame',
    requirement: {
      type: 'STREAK_DAYS',
      count: 3
    },
    xpReward: 30
  },
  {
    id: 'streak_5_days',
    name: '5 Gün Seri',
    description: '5 gün üst üste görev tamamla',
    level: 'BRONZE',
    category: 'STREAK',
    iconName: 'flame',
    requirement: {
      type: 'STREAK_DAYS',
      count: 5
    },
    xpReward: 50
  },
  {
    id: 'streak_7_days',
    name: '1 Hafta Seri',
    description: '7 gün üst üste görev tamamla',
    level: 'SILVER',
    category: 'STREAK',
    iconName: 'flame',
    requirement: {
      type: 'STREAK_DAYS',
      count: 7
    },
    xpReward: 100
  },
  {
    id: 'streak_14_days',
    name: '2 Hafta Seri',
    description: '14 gün üst üste görev tamamla',
    level: 'GOLD',
    category: 'STREAK',
    iconName: 'flame',
    requirement: {
      type: 'STREAK_DAYS',
      count: 14
    },
    xpReward: 200
  },
  {
    id: 'streak_30_days',
    name: '1 Ay Seri',
    description: '30 gün üst üste görev tamamla',
    level: 'DIAMOND',
    category: 'STREAK',
    iconName: 'flame',
    requirement: {
      type: 'STREAK_DAYS',
      count: 30
    },
    xpReward: 500
  },
  
  // Acil durum görevleri
  {
    id: 'emergency_helper_bronze',
    name: 'Acil Durum Kahramanı (Bronz)',
    description: '3 acil durum görevi tamamla',
    level: 'BRONZE',
    category: 'EMERGENCY',
    iconName: 'alert',
    requirement: {
      type: 'EMERGENCY_COUNT',
      count: 3
    },
    xpReward: 100
  },
  {
    id: 'emergency_helper_silver',
    name: 'Acil Durum Kahramanı (Gümüş)',
    description: '10 acil durum görevi tamamla',
    level: 'SILVER',
    category: 'EMERGENCY',
    iconName: 'alert',
    requirement: {
      type: 'EMERGENCY_COUNT',
      count: 10
    },
    xpReward: 250
  },
  {
    id: 'emergency_helper_gold',
    name: 'Acil Durum Kahramanı (Altın)',
    description: '25 acil durum görevi tamamla',
    level: 'GOLD',
    category: 'EMERGENCY',
    iconName: 'alert',
    requirement: {
      type: 'EMERGENCY_COUNT',
      count: 25
    },
    xpReward: 500
  }
]; 