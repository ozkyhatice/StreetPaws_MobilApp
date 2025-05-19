/**
 * Utility functions for XP and level calculations
 */

/**
 * Calculate user level based on XP
 * @param xp The user's XP amount
 * @returns The user's level
 */
export const calculateLevelFromXP = (xp: number): number => {
  return Math.floor(xp / 100) + 1;
};

/**
 * Calculate XP needed for a specific level
 * @param level The level to calculate XP for
 * @returns XP amount required for this level
 */
export const calculateXpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return 100 * (level - 1);
};

/**
 * Calculate XP needed for the next level
 * @param level The current level
 * @returns XP amount required for the next level
 */
export const calculateXpForNextLevel = (level: number): number => {
  return 100 * level;
};

/**
 * Calculate level progress percentage
 * @param level The current level
 * @param xp The current XP amount
 * @returns Progress percentage (0-100)
 */
export const calculateLevelProgress = (level: number, xp: number): number => {
  const currentLevelXp = calculateXpForLevel(level);
  const nextLevelXp = calculateXpForNextLevel(level);
  const levelDiff = nextLevelXp - currentLevelXp;
  const levelProgress = xp - currentLevelXp;
  
  // Calculate percentage (clamped between 0-100)
  return Math.min(100, Math.max(0, (levelProgress / levelDiff) * 100));
};

/**
 * Calculate the progress value (0-1) for progress bars
 * @param xp The current XP amount
 * @param level The current level
 * @returns Progress value between 0 and 1
 */
export const calculateProgressValue = (xp: number, level: number): number => {
  const currentLevelXP = calculateXpForLevel(level);
  const nextLevelXP = calculateXpForNextLevel(level);
  return (xp - currentLevelXP) / (nextLevelXP - currentLevelXP);
}; 