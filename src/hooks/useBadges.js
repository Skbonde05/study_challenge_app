import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

/**
 * Hook to manage badges and user achievements
 */
export const useBadges = () => {
  const { data: badges = [], isLoading: loadingBadges } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('requirement', { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes cache for list
  });

  const { data: earnedBadges = [], isLoading: loadingEarned, refetch: refetchEarned } = useQuery({
    queryKey: ['earned-badges'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at, badges(*)')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    badges,
    earnedBadges,
    isLoading: loadingBadges || loadingEarned,
    refetch: refetchEarned
  };
};
