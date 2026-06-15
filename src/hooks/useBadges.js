import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

const DEFAULT_BADGES = [
  {
    id: 'b1',
    name: 'First Step',
    description: 'Complete your first study session of at least 10 minutes.',
    category: 'Timer',
    requirement: 1,
    rarity: 'common',
    icon: '🌱',
  },
  {
    id: 'b2',
    name: 'Focus Master',
    description: 'Complete 10 study sessions.',
    category: 'Timer',
    requirement: 10,
    rarity: 'rare',
    icon: '⚡',
  },
  {
    id: 'b3',
    name: 'Streak Starter',
    description: 'Maintain a 3-day study streak.',
    category: 'Streak',
    requirement: 3,
    rarity: 'common',
    icon: '🔥',
  },
  {
    id: 'b4',
    name: 'Streak Legend',
    description: 'Maintain a 14-day study streak.',
    category: 'Streak',
    requirement: 14,
    rarity: 'legendary',
    icon: '👑',
  },
  {
    id: 'b5',
    name: 'Challenger',
    description: 'Join and complete 3 study challenges.',
    category: 'Challenges',
    requirement: 3,
    rarity: 'rare',
    icon: '🎯',
  },
  {
    id: 'b6',
    name: 'Social Scholar',
    description: 'Join a classroom study group.',
    category: 'Classroom',
    requirement: 1,
    rarity: 'common',
    icon: '🤝',
  }
];

/**
 * Hook to manage badges and user achievements
 */
export const useBadges = () => {
  const { data: badges = [], isLoading: loadingBadges } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('badges')
          .select('*')
          .order('requirement', { ascending: true });
        if (error) throw error;
        return data && data.length > 0 ? data : DEFAULT_BADGES;
      } catch (err) {
        console.warn('Failing over to default badges:', err.message);
        return DEFAULT_BADGES;
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes cache for list
  });

  const { data: earnedBadges = [], isLoading: loadingEarned, refetch: refetchEarned } = useQuery({
    queryKey: ['earned-badges'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      try {
        const { data, error } = await supabase
          .from('user_badges')
          .select('badge_id, earned_at, badges(*)')
          .eq('user_id', user.id)
          .order('earned_at', { ascending: false });
        if (error) throw error;
        
        return (data || []).map(item => {
          if (!item.badges) {
            const matched = DEFAULT_BADGES.find(db => db.id === item.badge_id);
            return { ...item, badges: matched };
          }
          return item;
        });
      } catch (err) {
        console.warn('Error fetching earned badges:', err.message);
        return [];
      }
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
