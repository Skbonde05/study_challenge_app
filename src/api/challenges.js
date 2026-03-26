import { supabase } from '../services/supabase';

/**
 * Fetch the user's current challenges
 * @param {string} userId
 */
export const getUserChallenges = async (userId) => {
  const { data, error } = await supabase
    .from('user_challenges')
    .select(`
      *,
      challenge:challenge_id (*)
    `)
    .eq('user_id', userId)
    .eq('is_completed', false)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  
  return data.map(uc => ({
    id: uc.id,
    challenge_id: uc.challenge_id,
    title: uc.challenge?.title || 'Untitled Challenge',
    description: uc.challenge?.description || '',
    target_minutes: uc.challenge?.target_minutes || 60,
    current_minutes: uc.current_minutes || 0,
    is_completed: uc.is_completed || false,
    xp_reward: uc.challenge?.xp_reward || 100,
    coins_reward: uc.challenge?.coins_reward || 50,
    difficulty: uc.challenge?.difficulty || 'easy',
  }));
};

/**
 * Fetch all available challenges that the user hasn't joined yet
 * @param {string} userId
 */
export const getAvailableChallenges = async (userId) => {
  // First get joined ids
  const { data: joined, error: joinedError } = await supabase
    .from('user_challenges')
    .select('challenge_id')
    .eq('user_id', userId);

  if (joinedError) throw joinedError;
  const joinedIds = joined.map(j => j.challenge_id);

  let query = supabase.from('challenges').select('*');
  
  if (joinedIds.length > 0) {
    query = query.not('id', 'in', `(${joinedIds.join(',')})`);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
};

/**
 * Join a challenge
 * @param {string} userId
 * @param {string} challengeId
 */
export const joinChallenge = async (userId, challengeId) => {
  const { data: existing, error: fetchError } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  if (existing) throw new Error('Already Joined');

  const { data, error } = await supabase
    .from('user_challenges')
    .insert([{
      user_id: userId,
      challenge_id: challengeId,
      current_minutes: 0,
      is_completed: false,
    }])
    .select(`
      *,
      challenge:challenge_id (*)
    `)
    .single();

  if (error) throw error;
  
  // Format for consistency with getUserChallenges
  return {
    id: data.id,
    challenge_id: data.challenge_id,
    title: data.challenge?.title || 'Untitled Challenge',
    description: data.challenge?.description || '',
    target_minutes: data.challenge?.target_minutes || 60,
    current_minutes: data.current_minutes || 0,
    is_completed: data.is_completed || false,
    xp_reward: data.challenge?.xp_reward || 100,
    coins_reward: data.challenge?.coins_reward || 50,
    difficulty: data.challenge?.difficulty || 'easy',
  };
};

/**
 * Mark a challenge as completed and claim rewards
 * @param {string} userId
 * @param {string} ucId - User challenge ID
 * @param {number} currentCoins
 * @param {number} currentXp
 * @param {number} coinReward
 * @param {number} xpReward
 */
export const completeChallenge = async (userId, ucId, currentCoins, currentXp, coinReward, xpReward) => {
  // Use a transaction-like approach by updating both
  const { error: ucError } = await supabase
    .from('user_challenges')
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq('id', ucId);

  if (ucError) throw ucError;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      coins: (currentCoins || 0) + coinReward,
      xp: (currentXp || 0) + xpReward,
      completed_challenges: supabase.rpc('increment_completed_challenges'), // Assuming rpc or manual
    })
    .eq('id', userId);

  if (profileError) throw profileError;
};

/**
 * Fetch daily streak/challenge status
 * @param {string} userId
 */
export const getDailyChallenge = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: todayStreak, error: streakError } = await supabase
    .from('daily_streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (streakError && streakError.code === 'PGRST116') {
    // Create new streak record if it doesn't exist
    const { data: newData, error: insertError } = await supabase
      .from('daily_streaks')
      .insert([{
        user_id: userId,
        date: today,
        study_time: 0,
        completed: false,
      }])
      .select()
      .single();

    if (insertError) throw insertError;
    return formatDailyChallenge(newData);
  } else if (!streakError) {
    return formatDailyChallenge(todayStreak);
  }
  
  throw streakError;
};

const formatDailyChallenge = (streakData) => {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: 'daily_' + today,
    title: 'Daily Study Goal',
    description: 'Complete 60 minutes of focused study today',
    target_minutes: 60,
    current_minutes: streakData.study_time || 0,
    rewards: { coins: 100, xp: 500 },
    is_completed: streakData.completed || false,
    streak_id: streakData.id,
  };
};

/**
 * Claim daily challenge rewards
 * @param {string} userId
 * @param {object} dailyChallenge
 * @param {object} currentProfile
 */
export const claimDailyChallenge = async (userId, dailyChallenge, currentProfile) => {
  if (dailyChallenge.streak_id) {
    await supabase
      .from('daily_streaks')
      .update({ completed: true })
      .eq('id', dailyChallenge.streak_id);
  }

  const newCoins = (currentProfile.coins || 0) + dailyChallenge.rewards.coins;
  const newXp = (currentProfile.xp || 0) + dailyChallenge.rewards.xp;
  const newStreak = (currentProfile.current_streak || 0) + 1;
  const newLongestStreak = Math.max(currentProfile.longest_streak || 0, newStreak);
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      coins: newCoins,
      xp: newXp,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_study_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
