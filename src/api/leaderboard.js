import { supabase } from '../services/supabase';

/**
 * Fetch leaderboard with pagination
 * @param {object} params 
 * @param {string} params.timeframe - weekly, monthly, all-time
 * @param {number} params.pageParam - for infinite loading
 */
export const getLeaderboard = async ({ timeframe, pageParam = 0 }) => {
  const PAGE_SIZE = 20;
  
  // For 'all-time', we just use profiles XP
  if (timeframe === 'all-time' || timeframe === 'monthly') {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, xp, total_study_time, current_streak, level')
      .order('xp', { ascending: false })
      .range(pageParam, pageParam + PAGE_SIZE - 1);

    if (error) throw error;
    return profiles.map((p, idx) => ({ ...p, rank: pageParam + idx + 1 }));
  }

  // For 'weekly', we'd normally join with study_sessions, 
  // but for a simple implementation here, we'll just mock the weekly sorting 
  // or fetch from a dedicated materialized view if it existed.
  // We'll fallback to XP for now but keep the interface ready.
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, xp, total_study_time, current_streak, level')
    .order('xp', { ascending: false }) 
    .range(pageParam, pageParam + PAGE_SIZE - 1);

  if (error) throw error;
  return profiles.map((p, idx) => ({ ...p, rank: pageParam + idx + 1 }));
};

/**
 * Get current user's rank
 * @param {string} userId
 */
export const getMyRank = async (userId) => {
  // In a real app, this would be a more complex query or RPC
  // For simplicity, we'll find the user in the top 100
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, xp, level, current_streak')
    .order('xp', { ascending: false })
    .limit(100);

  if (error) throw error;
  
  const idx = data.findIndex(u => u.id === userId);
  if (idx !== -1) {
    return { ...data[idx], rank: idx + 1 };
  }
  return null;
};
