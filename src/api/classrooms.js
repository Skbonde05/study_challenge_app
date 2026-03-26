import { supabase } from '../services/supabase';

/**
 * Fetch all classrooms the user is a member of
 * @param {string} userId
 */
export const getUserClassrooms = async (userId) => {
  // 1. Get classroom memberships for the user
  const { data: memberships, error: membershipError } = await supabase
    .from('classroom_members')
    .select('classroom_id, role')
    .eq('user_id', userId);

  if (membershipError) throw membershipError;
  if (!memberships || memberships.length === 0) return [];

  // 2. Fetch classroom details and creator profile for each membership
  const classrooms = await Promise.all(memberships.map(async (m) => {
    // Get classroom basic info
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .select('*')
      .eq('id', m.classroom_id)
      .single();

    if (classroomError || !classroom) return null;

    // Get creator profile
    const { data: creator } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', classroom.created_by)
      .single();

    // Get member count for this classroom
    const { count } = await supabase
      .from('classroom_members')
      .select('*', { count: 'exact', head: true })
      .eq('classroom_id', classroom.id);

    return {
      ...classroom,
      user_role: m.role,
      is_member: true,
      member_count: count || 0,
      creator: creator || { username: 'Unknown' }
    };
  }));

  return classrooms.filter(c => c !== null);
};

/**
 * Fetch public classrooms to explore
 * @param {string} userId - to check if already a member
 */
export const getExploreClassrooms = async (userId) => {
  const { data: classrooms, error } = await supabase
    .from('classrooms')
    .select('*')
    .eq('is_public', true)
    .limit(20);

  if (error) throw error;

  const results = await Promise.all(classrooms.map(async (c) => {
    // Check membership
    const { data: membership } = await supabase
      .from('classroom_members')
      .select('role')
      .eq('classroom_id', c.id)
      .eq('user_id', userId)
      .maybeSingle();

    // Get member count
    const { count } = await supabase
      .from('classroom_members')
      .select('*', { count: 'exact', head: true })
      .eq('classroom_id', c.id);

    // Get creator details
    const { data: creator } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', c.created_by)
      .single();

    return {
      ...c,
      is_member: !!membership,
      user_role: membership?.role || null,
      member_count: count || 0,
      creator: creator || { username: 'Unknown' }
    };
  }));

  return results;
};

/**
 * Join a classroom via invite code
 */
export const joinByCode = async (userId, inviteCode) => {
  const { data: classroom, error: classroomError } = await supabase
    .from('classrooms')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .single();

  if (classroomError) throw new Error('Invalid Invite Code');
  if (!classroom.is_active) throw new Error('Classroom is closed');

  const { error: memberError } = await supabase
    .from('classroom_members')
    .insert([{
      classroom_id: classroom.id,
      user_id: userId,
      role: 'member'
    }]);

  if (memberError && memberError.code === '23505') throw new Error('Already a member');
  if (memberError) throw memberError;

  return classroom;
};
