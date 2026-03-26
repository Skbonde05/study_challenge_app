import { supabase } from '../services/supabase';

/**
 * Fetch the user's recent study sessions
 * @param {string} userId
 */
export const getRecentSessions = async (userId) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
};

/**
 * Record a new study session and update profile stats
 * @param {string} userId
 * @param {object} sessionData
 */
export const recordSession = async (userId, sessionData) => {
  const { 
    durationMinutes, 
    subject, 
    topic, 
    notes, 
    sessionTitle, 
    xpEarned, 
    coinsEarned, 
    focusScore, 
    challengeId,
    type = 'focus'
  } = sessionData;

  // Insert session record
  const { data, error } = await supabase
    .from('study_sessions')
    .insert([{
      user_id: userId,
      duration_minutes: durationMinutes,
      subject: subject || 'General',
      topic: topic || '',
      notes: notes || '',
      session_title: sessionTitle || `Focus Session - ${durationMinutes} min`,
      session_type: type,
      xp_earned: xpEarned || 0,
      coins_earned: coinsEarned || 0,
      focus_score: focusScore || 80,
      challenge_id: challengeId || null,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;

  // Update profile with rewards and total time
  const { data: profileData, error: profileFetchError } = await supabase
    .from('profiles')
    .select('coins, xp, total_study_time, completed_sessions')
    .eq('id', userId)
    .single();

  if (!profileFetchError) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        coins: (profileData.coins || 0) + (coinsEarned || 0),
        xp: (profileData.xp || 0) + (xpEarned || 0),
        total_study_time: (profileData.total_study_time || 0) + durationMinutes,
        completed_sessions: (profileData.completed_sessions || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) console.error('Error updating profile rewards:', profileError);
  }

  // Update daily streak study time
  const today = new Date().toISOString().split('T')[0];
  const { data: streak, error: streakError } = await supabase
    .from('daily_streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (!streakError && streak) {
    await supabase
      .from('daily_streaks')
      .update({ 
        study_time: (streak.study_time || 0) + durationMinutes,
        updated_at: new Date().toISOString()
      })
      .eq('id', streak.id);
  }

  // Update challenge progress if applicable
  if (challengeId) {
    await updateChallengeProgress(userId, challengeId, durationMinutes);
  }

  return data;
};

/**
 * Update user challenge progress
 * @param {string} userId
 * @param {string} challengeId
 * @param {number} minutesStudied
 */
const updateChallengeProgress = async (userId, challengeId, minutesStudied) => {
  try {
    const { data: uc, error: fetchError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (uc) {
      const newMinutes = (uc.current_minutes || 0) + minutesStudied;
      // We don't mark as completed here as it's handled by getAvailableChallenges / UI logic 
      // but we update the progress
      await supabase
        .from('user_challenges')
        .update({ 
          current_minutes: newMinutes,
          updated_at: new Date().toISOString()
        })
        .eq('id', uc.id);
    }
  } catch (error) {
    console.error('Error updating challenge progress:', error);
  }
};
