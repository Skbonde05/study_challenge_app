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
    let profileSub, challengeSub, notificationSub, messageSub, leaderboardSub, sessionSub, streakSub;

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
            if (currentProfile && payload.new.updated_at) {
              const currentUpdateAt = new Date(currentProfile.updated_at || 0).getTime();
              const newUpdateAt = new Date(payload.new.updated_at).getTime();
              
              if (newUpdateAt < currentUpdateAt) {
                console.log('Ignore stale profile update from real-time sync.');
                return;
              }
            }

            // Invalidate to fetch fresh data
            queryClient.invalidateQueries({ queryKey: ['profile'] });
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

      // 3. Listen for sessions and streaks (NEW for Dashbaord fully real-time)
      const setupOptionalSub = (channelName, table, queryKey) => {
        try {
          const sub = supabase
            .channel(channelName)
            .on('postgres_changes', 
              { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` },
              () => {
                queryClient.invalidateQueries({ queryKey: [queryKey] });
              }
            );
          
          sub.subscribe((status) => {
            if (status === 'CHANNEL_ERROR') {
              console.warn(`Could not subscribe to ${table} (maybe table missing?)`);
            }
          });
          return sub;
        } catch (e) {
          console.warn(`Subscription failed for ${table}:`, e.message);
          return null;
        }
      };

      sessionSub = setupOptionalSub(`session-changes-${user.id}`, 'study_sessions', 'recent-sessions');
      streakSub = setupOptionalSub(`streak-changes-${user.id}`, 'daily_streaks', 'daily-challenge');
      notificationSub = setupOptionalSub(`notification-changes-${user.id}`, 'user_notifications', 'notifications');

      // 4. Classroom messages (No filter as they are global to the classroom usually)
      try {
        messageSub = supabase
          .channel(`classroom-messages-${user.id}`)
          .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'classroom_messages' },
            () => {
              queryClient.invalidateQueries({ queryKey: ['classroom-messages'] });
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Classroom messages subscription failed:', e.message);
      }

      // 5. Leaderboard changes
      try {
        leaderboardSub = supabase
          .channel('public-profile-changes')
          .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'profiles' },
            () => {
              const currentItems = queryClient.getQueriesData({ queryKey: ['leaderboard'] });
              if (currentItems.length > 0) {
                queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Leaderboard subscription failed:', e.message);
      }
    };

    setupSubscriptions();

    return () => {
      if (profileSub) profileSub.unsubscribe();
      if (challengeSub) challengeSub.unsubscribe();
      if (sessionSub) sessionSub.unsubscribe();
      if (streakSub) streakSub.unsubscribe();
      if (notificationSub) notificationSub.unsubscribe();
      if (messageSub) messageSub.unsubscribe();
      if (leaderboardSub) leaderboardSub.unsubscribe();
    };
  }, [queryClient]);
};
