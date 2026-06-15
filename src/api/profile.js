import { supabase } from '../services/supabase';

const buildProfileSeed = (user) => {
  const email = user?.email || '';
  const usernameFromEmail = email.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 24);
  const metadata = user?.user_metadata || {};

  return {
    id: user?.id,
    email,
    full_name: metadata.full_name || metadata.name || '',
    username: metadata.username || usernameFromEmail || `user_${user?.id?.slice(0, 8) || 'profile'}`,
    avatar_url: metadata.avatar_url || null,
    xp: 0,
    coins: 0,
    total_study_time: 0,
    completed_sessions: 0,
    current_streak: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const ensureProfile = async (user) => {
  if (!user?.id) {
    throw new Error('No user authenticated');
  }

  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existing) return existing;

  const seed = buildProfileSeed(user);
  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .upsert(seed, { onConflict: 'id' })
    .select()
    .single();

  if (insertError) throw insertError;
  return inserted;
};

/**
 * Fetch the user's profile information
 * @param {string} userId
 */
export const getProfile = async (userId) => {
  let currentUser = null;

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
    currentUser = user;
  }
  
  if (!userId) throw new Error('No user authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error?.code === 'PGRST116') {
    if (!currentUser) {
      const { data: { user } } = await supabase.auth.getUser();
      currentUser = user;
    }

    if (currentUser?.id === userId) {
      return ensureProfile(currentUser);
    }
  }

  if (error) throw error;
  return data;
};

/**
 * Update the user's profile
 * @param {string} userId
 * @param {object} updates
 */
export const updateProfile = async (userId, updates) => {
  const payload = {
    id: userId,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Fetch the user's badges
 * @param {string} userId
 */
export const getUserBadges = async (userId) => {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badges:badge_id (*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Fetch the user's preferences
 * @param {string} userId
 */
export const getUserPreferences = async (userId) => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};
