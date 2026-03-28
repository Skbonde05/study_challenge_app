import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUserChallenges, 
  getDailyChallenge, 
  getAvailableChallenges, 
  joinChallenge, 
  claimDailyChallenge 
} from '../api/challenges';
import { supabase } from '../services/supabase';

/**
 * Hook to manage user challenges data with caching and optimistic updates
 */
export const useChallenges = () => {
  const queryClient = useQueryClient();

  const { data: challenges = [], isLoading: loadingChallenges, refetch: refetchChallenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      return getUserChallenges(user.id);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });

  const { data: dailyChallenge, isLoading: loadingDaily, refetch: refetchDaily } = useQuery({
    queryKey: ['daily-challenge'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      return getDailyChallenge(user.id);
    },
    staleTime: 1000 * 60 * 1, // 1 minute cache
  });

  const { data: availableChallenges = [], isLoading: loadingAvailable } = useQuery({
    queryKey: ['available-challenges'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      return getAvailableChallenges(user.id);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const claimDailyMutation = useMutation({
    mutationFn: async (args) => {
      const { dailyChallenge, currentProfile } = args;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return claimDailyChallenge(user.id, dailyChallenge, currentProfile);
    },
    onMutate: async (args) => {
      const { dailyChallenge, currentProfile } = args;
      await queryClient.cancelQueries({ queryKey: ['daily-challenge'] });
      await queryClient.cancelQueries({ queryKey: ['profile'] });

      const prevDaily = queryClient.getQueryData(['daily-challenge']);
      const prevProfile = queryClient.getQueryData(['profile']);

      // Optimistically update daily challenge
      queryClient.setQueryData(['daily-challenge'], (prev) => ({ ...prev, is_completed: true }));

      // Optimistically update profile with rewards
      queryClient.setQueryData(['profile'], (old) => {
        if (!old) return old;
        return {
          ...old,
          coins: (old.coins || 0) + dailyChallenge.rewards.coins,
          xp: (old.xp || 0) + dailyChallenge.rewards.xp,
          current_streak: (old.current_streak || 0) + 1,
        };
      });

      return { prevDaily, prevProfile };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['daily-challenge'], context.prevDaily);
      queryClient.setQueryData(['profile'], context.prevProfile);
    },
    onSuccess: (newProfileData) => {
      // Overwrite optimistic state with real server data
      queryClient.setQueryData(['profile'], newProfileData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-challenge'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return joinChallenge(user.id, challengeId);
    },
    onMutate: async (challengeId) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['challenges'] });
      await queryClient.cancelQueries({ queryKey: ['available-challenges'] });

      // Snapshot the previous value
      const previousChallenges = queryClient.getQueryData(['challenges']);
      const previousAvailable = queryClient.getQueryData(['available-challenges']);

      // Optimistically update to the new value
      const challengeToJoin = previousAvailable?.find(c => c.id === challengeId);
      if (challengeToJoin) {
        queryClient.setQueryData(['challenges'], (old = []) => [
          ...old, 
          { ...challengeToJoin, current_minutes: 0, is_completed: false }
        ]);
        queryClient.setQueryData(['available-challenges'], (old = []) => 
          old.filter(c => c.id !== challengeId)
        );
      }

      // Return a context object with the snapshotted value
      return { previousChallenges, previousAvailable };
    },
    onError: (err, challengeId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['challenges'], context.previousChallenges);
      queryClient.setQueryData(['available-challenges'], context.previousAvailable);
    },
    onSettled: () => {
      // Always refetch after error or success to keep server sync
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['available-challenges'] });
    },
  });

  const completeChallengeMutation = useMutation({
    mutationFn: async (args) => {
      const { userChallengeId, coinReward, xpReward } = args;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const currentProfile = queryClient.getQueryData(['profile']);
      
      return completeChallenge(
        user.id, 
        userChallengeId, 
        currentProfile?.coins || 0, 
        currentProfile?.xp || 0, 
        coinReward, 
        xpReward
      );
    },
    onMutate: async (args) => {
      const { userChallengeId, coinReward, xpReward } = args;
      await queryClient.cancelQueries({ queryKey: ['challenges'] });
      await queryClient.cancelQueries({ queryKey: ['profile'] });

      const prevChallenges = queryClient.getQueryData(['challenges']);
      const prevProfile = queryClient.getQueryData(['profile']);

      // Optimistically remove from active list
      queryClient.setQueryData(['challenges'], (old = []) => 
        old.filter(c => c.id !== userChallengeId)
      );

      // Optimistically update profile rewards
      queryClient.setQueryData(['profile'], (old) => {
        if (!old) return old;
        return {
          ...old,
          coins: (old.coins || 0) + coinReward,
          xp: (old.xp || 0) + xpReward,
          completed_challenges: (old.completed_challenges || 0) + 1,
        };
      });

      return { prevChallenges, prevProfile };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['challenges'], context.prevChallenges);
      queryClient.setQueryData(['profile'], context.prevProfile);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    challenges,
    dailyChallenge,
    availableChallenges,
    isLoading: loadingChallenges || loadingDaily || loadingAvailable,
    joinChallenge: joinChallengeMutation.mutate,
    isJoining: joinChallengeMutation.isPending,
    claimDaily: claimDailyMutation.mutate,
    isClaiming: claimDailyMutation.isPending,
    completeChallenge: completeChallengeMutation.mutate,
    isCompleting: completeChallengeMutation.isPending,
    refetch: () => {
      refetchChallenges();
      refetchDaily();
    }
  };
};
