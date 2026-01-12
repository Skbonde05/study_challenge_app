// src/utils/xpLogic.js

// Calculate level based on XP
export const calculateLevel = (xp) => {
  return Math.floor(xp / 1000) + 1;
};

// Calculate progress to next level (0-100)
export const calculateProgress = (xp) => {
  const currentLevelXp = xp % 1000;
  return (currentLevelXp / 1000) * 100;
};

// Calculate XP earned for a study session
export const calculateXPEarned = (minutesStudied) => {
  // Base XP: 1 XP per minute
  let xp = minutesStudied;
  
  // Bonus multipliers
  if (minutesStudied >= 60) {
    // 25% bonus for studying 1+ hour
    xp *= 1.25;
  } else if (minutesStudied >= 30) {
    // 15% bonus for studying 30+ minutes
    xp *= 1.15;
  } else if (minutesStudied >= 15) {
    // 10% bonus for studying 15+ minutes
    xp *= 1.10;
  }
  
  // Round to nearest integer
  return Math.round(xp);
};

// Calculate XP needed for next level
export const xpToNextLevel = (currentXp) => {
  const nextLevel = calculateLevel(currentXp) + 1;
  const xpForNextLevel = (nextLevel - 1) * 1000;
  return xpForNextLevel - currentXp;
};