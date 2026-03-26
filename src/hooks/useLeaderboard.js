import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getLeaderboard, getMyRank } from '../api/leaderboard';
import { supabase } from '../services/supabase';

/**
 * Hook to manage leaderboard with infinite loading
 * @param {string} timeframe - weekly, monthly, all-time
 */
export const useLeaderboard = (timeframe = 'weekly') => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching
  } = useInfiniteQuery({
    queryKey: ['leaderboard', timeframe],
    queryFn: ({ pageParam = 0 }) => getLeaderboard({ timeframe, pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page was empty or less than 20, we reached the end
      if (lastPage.length < 20) return undefined;
      // Next pageParam is the current count
      return allPages.length * 20;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const { data: myRank, isLoading: loadingRank } = useQuery({
    queryKey: ['my-rank', timeframe],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      return getMyRank(user.id);
    },
    staleTime: 1000 * 60 * 2,
  });

  // Flatten the pages for simple rendering
  const leaderboardItems = data?.pages.flat() || [];

  return {
    leaderboardItems,
    myRank,
    isLoading: isLoading || (loadingRank && leaderboardItems.length === 0),
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    isRefetching
  };
};
