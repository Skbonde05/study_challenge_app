// src/utils/streakLogic.js

import { supabase } from '../services/supabase';

export const updateStreak = async (userId) => {
  try {
    // Get user's last study session
    const { data: lastSession } = await supabase
      .from('study_sessions')
      .select('session_date')
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(1)
      .single();

    // Get user's current streak
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_study_date')
      .eq('id', userId)
      .single();

    if (!lastSession) return; // No sessions yet

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = profile.current_streak || 0;
    let longestStreak = profile.longest_streak || 0;

    if (lastSession.session_date === today) {
      // Already studied today, streak continues
    } else if (lastSession.session_date === yesterdayStr) {
      // Studied yesterday, increment streak
      newStreak += 1;
    } else {
      // Missed a day, reset streak
      newStreak = 1;
    }

    // Update longest streak if needed
    if (newStreak > longestStreak) {
      longestStreak = newStreak;
    }

    // Update profile
    await supabase
      .from('profiles')
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_study_date: today,
      })
      .eq('id', userId);

  } catch (error) {
    console.error('Error updating streak:', error);
  }
};

// Check if user has maintained streak today
export const checkStreakMaintained = (lastStudyDate) => {
  if (!lastStudyDate) return false;
  
  const today = new Date();
  const lastStudy = new Date(lastStudyDate);
  
  // Reset time for accurate day comparison
  today.setHours(0, 0, 0, 0);
  lastStudy.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
  
  return diffDays === 0; // Studied today
};