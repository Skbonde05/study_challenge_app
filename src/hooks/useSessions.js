import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecentSessions, recordSession } from '../api/sessions';
import { supabase } from '../services/supabase';

/**
 * Hook to manage study sessions with caching and automatic refresh
 */
export const useSessions = () => {
  const queryClient = useQueryClient();

  const { data: recentSessions = [], isLoading, refetch } = useQuery({
    queryKey: ['recent-sessions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      return getRecentSessions(user.id);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });

  const recordSessionMutation = useMutation({
    mutationFn: async (args) => {
      const { sessionData } = args;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return recordSession(user.id, sessionData);
    },
    onSuccess: () => {
      // Refresh list after recording
      queryClient.invalidateQueries({ queryKey: ['recent-sessions'] });
      // Invalidate stats too as they likely changed
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['daily-challenge'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });

  return {
    recentSessions,
    isLoading,
    refetch,
    recordSession: recordSessionMutation.mutate,
    isRecording: recordSessionMutation.isPending
  };
};
