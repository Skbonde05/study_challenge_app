import { supabase } from '../services/supabase';

/**
 * Fetch all classrooms the user is a member of
 * @param {string} userId
 */
export const getUserClassrooms = async (userId) => {
  try {
    const { data: memberships, error: membershipError } = await supabase
      .from('classroom_members')
      .select('classroom_id, role')
      .eq('user_id', userId);

    if (membershipError) throw membershipError;
    if (!memberships || memberships.length === 0) return [];
    
    // Continue with details fetch (moved from line 18)
    const classrooms = await Promise.all(memberships.map(async (m) => {
      try {
        const { data: classroom, error: classroomError } = await supabase
          .from('classrooms')
          .select('*')
          .eq('id', m.classroom_id)
          .single();

        if (classroomError || !classroom) return null;

        const { data: creator } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', classroom.created_by)
          .single();

        const { count } = await supabase
          .from('classroom_members')
          .select('*', { count: 'exact', head: true })
          .eq('classroom_id', classroom.id);

        return {
          ...classroom,
          user_role: m.role,
          is_member: true,
          member_count: count || 0,
          creator: creator || { username: 'Teacher' }
        };
      } catch (err) {
        return null;
      }
    }));

    return classrooms.filter(c => c !== null);

  } catch (err) {
    console.warn('Classroom hub fetch error (maybe table missing?):', err.message);
    return [];
  }
};

/**
 * Fetch public classrooms to explore
 * @param {string} userId - to check if already a member
 */
export const getExploreClassrooms = async (userId) => {
  try {
    const { data: classrooms, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('is_public', true)
      .limit(20);

    if (error) throw error;
    if (!classrooms) return [];

    const results = await Promise.all(classrooms.map(async (c) => {
      try {
        const { data: membership } = await supabase
          .from('classroom_members')
          .select('role')
          .eq('classroom_id', c.id)
          .eq('user_id', userId)
          .maybeSingle();

        const { count } = await supabase
          .from('classroom_members')
          .select('*', { count: 'exact', head: true })
          .eq('classroom_id', c.id);

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
          creator: creator || { username: 'Teacher' }
        };
      } catch (err) {
        return { ...c, creator: { username: 'Teacher' }, member_count: 0 };
      }
    }));

    return results || [];
  } catch (err) {
    console.warn('Explore classrooms fetch error:', err.message);
    return [];
  }
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

/**
 * Join a public classroom without code
 */
export const joinPublicClassroom = async (userId, classroomId) => {
  const { error: memberError } = await supabase
    .from('classroom_members')
    .insert([{
      classroom_id: classroomId,
      user_id: userId,
      role: 'member'
    }]);

  if (memberError && memberError.code === '23505') throw new Error('Already a member');
  if (memberError) throw memberError;

  return { success: true };
};

/**
 * Create a new classroom
 */
export const createClassroom = async (userId, classroomData) => {
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const { data: classroom, error: classroomError } = await supabase
    .from('classrooms')
    .insert([{
      name: classroomData.name,
      description: classroomData.description,
      is_public: classroomData.is_public || false,
      invite_code: inviteCode,
      created_by: userId,
      is_active: true
    }])
    .select()
    .single();

  if (classroomError) throw classroomError;

  // Add creator as owner/admin
  const { error: memberError } = await supabase
    .from('classroom_members')
    .insert([{
      classroom_id: classroom.id,
      user_id: userId,
      role: 'admin'
    }]);

  if (memberError) throw memberError;

  return classroom;
};
