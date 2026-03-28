// src/utils/gamification.js
import { supabase } from '../services/supabase';

export const calculateLevel = (xp) => {
  return Math.floor(xp / 1000) + 1;
};

export const calculateProgress = (xp) => {
  const currentLevelXp = xp % 1000;
  return (currentLevelXp / 1000) * 100;
};

export const calculateXPEarned = (minutesStudied, focusScore = 80) => {
  let xp = minutesStudied; // Base XP: 1 XP per minute
  
  // Focus multiplier
  if (focusScore >= 90) xp *= 1.5;
  else if (focusScore >= 70) xp *= 1.2;
  
  // Time bonus
  if (minutesStudied >= 60) xp *= 1.25; // 25% bonus for 1+ hour
  else if (minutesStudied >= 30) xp *= 1.15; // 15% bonus for 30+ mins
  
  return Math.round(xp);
};

export const calculateCoinsEarned = (minutesStudied, focusScore = 80, streak = 0) => {
  let coins = Math.floor(minutesStudied / 5); // 1 coin per 5 minutes
  
  // Focus multiplier
  if (focusScore >= 90) coins *= 1.5;
  else if (focusScore >= 70) coins *= 1.2;
  
  // Streak bonus
  if (streak >= 7) coins *= 1.3;
  else if (streak >= 3) coins *= 1.1;
  
  return Math.round(coins);
};

export const updateStreak = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if user already has a streak entry for today
    const { data: existingStreak } = await supabase
      .from('daily_streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existingStreak) {
      // Update existing streak
      await supabase
        .from('daily_streaks')
        .update({ completed: true })
        .eq('id', existingStreak.id);
    } else {
      // Create new streak entry
      await supabase
        .from('daily_streaks')
        .insert([
          {
            user_id: userId,
            date: today,
            completed: true,
          },
        ]);
    }

    // Calculate current streak
    const { data: streaks } = await supabase
      .from('daily_streaks')
      .select('date')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('date', { ascending: false });

    if (streaks && streaks.length > 0) {
      let currentStreak = 1;
      for (let i = 1; i < streaks.length; i++) {
        const prevDate = new Date(streaks[i-1].date);
        const currentDate = new Date(streaks[i].date);
        const diffDays = Math.floor((prevDate - currentDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Get current profile to update longest streak
      const { data: profile } = await supabase
        .from('profiles')
        .select('longest_streak')
        .eq('id', userId)
        .single();

      const longestStreak = Math.max(currentStreak, profile?.longest_streak || 0);

      // Update profile with new streak
      await supabase
        .from('profiles')
        .update({
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_study_date: today,
        })
        .eq('id', userId);

      return currentStreak;
    }

    return 0;
  } catch (error) {
    console.error('Error updating streak:', error);
    return 0;
  }
};

export const checkBadgeUnlocks = async (userId, category, value) => {
  try {
    // Get badges that match the category and requirement
    const { data: badges } = await supabase
      .from('badges')
      .select('*')
      .eq('category', category)
      .lte('requirement', value);

    if (!badges || badges.length === 0) return;

    // Check each badge
    for (const badge of badges) {
      // Check if user already has this badge
      const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_id', badge.id)
        .single();

      if (!existingBadge) {
        // User qualifies for badge, award it
        await supabase
          .from('user_badges')
          .insert([
            {
              user_id: userId,
              badge_id: badge.id,
            },
          ]);

        // Award coins/gems - Fetch first for balance calculation (Supabase JS client does not support atomic increment in raw)
        const { data: currentProf } = await supabase
          .from('profiles')
          .select('coins, gems')
          .eq('id', userId)
          .single();

        const newCoins = (currentProf?.coins || 0) + (badge.coins_reward || 0);
        const newGems = (currentProf?.gems || 0) + (badge.gems_reward || 0);

        await supabase
          .from('profiles')
          .update({
            coins: newCoins,
            gems: newGems,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        console.log(`Badge unlocked: ${badge.name}`);
      }
    }
  } catch (error) {
    console.error('Error checking badge unlocks:', error);
  }
};

export const getRankTitle = (level) => {
  if (level >= 50) return 'Study Sage';
  if (level >= 40) return 'Master Scholar';
  if (level >= 30) return 'Knowledge Keeper';
  if (level >= 20) return 'Dedicated Learner';
  if (level >= 10) return 'Rising Star';
  return 'Beginner';
};