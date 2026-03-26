import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserClassrooms, getExploreClassrooms, joinByCode } from '../api/classrooms';
import { supabase } from '../services/supabase';

/**
 * Hook to manage classroom data with caching and optimistic updates
 */
export const useClassrooms = () => {
  const queryClient = useQueryClient();

  const { data: userClassrooms = [], isLoading: isLoadingUser, refetch: refetchUser } = useQuery({
    queryKey: ['user-classrooms'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      return getUserClassrooms(user.id);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const { data: exploreClassrooms = [], isLoading: isLoadingExplore, refetch: refetchExplore } = useQuery({
    queryKey: ['explore-classrooms'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      return getExploreClassrooms(user.id);
    },
    staleTime: 1000 * 60 * 5,
  });

  const joinMutation = useMutation({
    mutationFn: async (inviteCode) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return joinByCode(user.id, inviteCode);
    },
    onSuccess: () => {
      // Refresh both lists after joining
      queryClient.invalidateQueries({ queryKey: ['user-classrooms'] });
      queryClient.invalidateQueries({ queryKey: ['explore-classrooms'] });
    },
  });

  return {
    userClassrooms,
    exploreClassrooms,
    isLoading: isLoadingUser || isLoadingExplore,
    isJoining: joinMutation.isPending,
    joinByCode: joinMutation.mutate,
    refetch: () => {
      refetchUser();
      refetchExplore();
    }
  };
};
