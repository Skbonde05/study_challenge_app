import { supabase } from '../services/supabase';

/**
 * Fetch the user's profile information
 * @param {string} userId
 */
export const getProfile = async (userId) => {
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }
  
  if (!userId) throw new Error('No user authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update the user's profile
 * @param {string} userId
 * @param {object} updates
 */
export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
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
    .order('earned_at', { ascending: false })
    .limit(10);

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
