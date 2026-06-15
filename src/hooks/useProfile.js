import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, getUserBadges } from '../api/profile';
import { supabase } from '../services/supabase';

/**
 * Hook to manage user profile data with caching
 */
export const useProfile = () => {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return getProfile(user.id);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return updateProfile(user.id, updates);
    },
    onSuccess: (newData) => {
      // Optimistic update of the cache
      queryClient.setQueryData(['profile'], newData);
    },
  });

  const { data: badges = [], isLoading: loadingBadges } = useQuery({
    queryKey: ['user-earned-badges'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      return getUserBadges(user.id);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    enabled: !!profile,
  });

  return { 
    profile, 
    badges,
    isLoading: isLoading || loadingBadges, 
    error, 
    refetch, 
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending 
  };
};
