/**
 * Utility functions for XP and level calculations
 */

/**
 * Calculate level based on XP amount
 * @param xp Total XP points
 * @returns Current level
 */
export const calculateLevelFromXP = (xp: number): number => {
  // Make sure we have a valid XP value
  if (!xp || xp < 0) return 1;
  
  // Each level requires more XP than the previous
  // Level 1: 0-1000 XP
  // Level 2: 1001-2500 XP
  // Level 3: 2501-4500 XP
  // And so on...
  
  const levels = [
    0,      // Level 1 starts at 0 XP
    1000,   // Level 2 starts at 1000 XP
    2500,   // Level 3 starts at 2500 XP
    4500,   // Level 4
    7000,   // Level 5
    10000,  // Level 6
    13500,  // Level 7
    17500,  // Level 8
    22000,  // Level 9
    27000,  // Level 10
    32500,  // Level 11
    38500,  // Level 12
    45000,  // Level 13
    52000,  // Level 14
    60000,  // Level 15
  ];
  
  let level = 1;
  for (let i = 1; i < levels.length; i++) {
    if (xp >= levels[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  
  return level;
};

/**
 * Calculate XP required for a specific level
 */
export const calculateXpForLevel = (level: number): number => {
  const levels = [
    0,      // Level 1 starts at 0 XP
    1000,   // Level 2 starts at 1000 XP
    2500,   // Level 3 starts at 2500 XP
    4500,   // Level 4
    7000,   // Level 5
    10000,  // Level 6
    13500,  // Level 7
    17500,  // Level 8
    22000,  // Level 9
    27000,  // Level 10
    32500,  // Level 11
    38500,  // Level 12
    45000,  // Level 13
    52000,  // Level 14
    60000,  // Level 15
  ];
  
  // Level is 1-indexed, array is 0-indexed
  const levelIndex = Math.min(Math.max(level - 1, 0), levels.length - 1);
  return levels[levelIndex];
};

/**
 * Calculate XP required for the next level
 */
export const calculateXpForNextLevel = (level: number): number => {
  return calculateXpForLevel(level + 1);
};

/**
 * Calculate progress percentage to next level
 */
export const calculateProgressValue = (xp: number, level: number): number => {
  const currentLevelXP = calculateXpForLevel(level);
  const nextLevelXP = calculateXpForLevel(level + 1);
  
  if (nextLevelXP === currentLevelXP) return 1; // Avoid division by zero
  
  const progress = (xp - currentLevelXP) / (nextLevelXP - currentLevelXP);
  return Math.min(Math.max(progress, 0), 1); // Ensure between 0 and 1
};

/**
 * Calculate progress percentage (0-100) for a user's current level
 */
export function calculateLevelProgress(level: number, xp: number): number {
  const currentLevelXP = calculateXpForLevel(level);
  const nextLevelXP = calculateXpForLevel(level + 1);
  if (nextLevelXP === currentLevelXP) return 100;
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return Math.max(0, Math.min(100, Math.round(progress)));
}