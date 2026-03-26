import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

/**
 * Hook to handle real-time database updates and invalidate React Query cache
 * It also handles conflict resolution for multi-device synchronization.
 */
export const useRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let profileSub, challengeSub, notificationSub, messageSub, leaderboardSub;

    const setupSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Listen for current user profile changes (Conflict Resolution enabled)
      profileSub = supabase
        .channel(`profile-changes-${user.id}`)
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => {
            const currentProfile = queryClient.getQueryData(['profile']);
            
            // Conflict Resolution Logics:
            // Check if the update is newer than our current local data
            if (currentProfile && payload.new.updated_at) {
              const currentUpdateAt = new Date(currentProfile.updated_at || 0).getTime();
              const newUpdateAt = new Date(payload.new.updated_at).getTime();
              
              if (newUpdateAt < currentUpdateAt) {
                // The received update is older, ignore it for now (or handle differently)
                console.log('Ignore stale profile update from real-time sync.');
                return;
              }
            }

            // Update cache with fresh data
            queryClient.setQueryData(['profile'], payload.new);
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            
            // Re-sync related data that often changes with profile (coins/xp)
            queryClient.invalidateQueries({ queryKey: ['daily-challenge'] });
          }
        )
        .subscribe();

      // 2. Listen for current user challenge updates
      challengeSub = supabase
        .channel(`challenge-changes-${user.id}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'user_challenges', filter: `user_id=eq.${user.id}` },
          () => {
            queryClient.invalidateQueries({ queryKey: ['challenges'] });
            queryClient.invalidateQueries({ queryKey: ['available-challenges'] });
          }
        )
        .subscribe();

      // 3. Listen for notifications (New Table)
      notificationSub = supabase
        .channel(`notification-changes-${user.id}`)
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${user.id}` },
          () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        )
        .subscribe();

      // 4. Listen for classroom messages
      messageSub = supabase
        .channel(`classroom-messages-${user.id}`)
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'classroom_messages' },
          () => {
            queryClient.invalidateQueries({ queryKey: ['classroom-messages'] });
          }
        )
        .subscribe();

      // 5. Listen for broad profile updates that affect Leaderboard
      leaderboardSub = supabase
        .channel('public-profile-changes')
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'profiles' },
          (payload) => {
            // We check if this profile change belongs to someone on our currrently loaded leaderboard
            const currentItems = queryClient.getQueriesData({ queryKey: ['leaderboard'] });
            const isOnLeaderboard = currentItems.some(([key, data]) => 
              data?.pages?.some(page => page.some(p => p.id === payload.new.id))
            );

            if (isOnLeaderboard) {
              // Only invalidate if the change actually affects the current list to save performance
              queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            }
          }
        )
        .subscribe();
    };

    setupSubscriptions();

    return () => {
      if (profileSub) profileSub.unsubscribe();
      if (challengeSub) challengeSub.unsubscribe();
      if (notificationSub) notificationSub.unsubscribe();
      if (messageSub) messageSub.unsubscribe();
      if (leaderboardSub) leaderboardSub.unsubscribe();
    };
  }, [queryClient]);
};
