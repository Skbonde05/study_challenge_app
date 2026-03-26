import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStoreItems, getOwnedItems, purchaseItem } from '../api/store';
import { supabase } from '../services/supabase';

// Mock data as fallback for demonstration and development until tables are fully synced
const MOCK_ITEMS = [
  { id: 'av_1', type: 'avatars', name: 'Cool Glasses', description: 'Stylish sunglasses for your avatar', price: 150, currency: 'coins', icon: '😎', rarity: 'common' },
  { id: 'av_2', type: 'avatars', name: 'Graduation Hat', description: 'Show off your academic achievements', price: 300, currency: 'coins', icon: '🎓', rarity: 'rare' },
  { id: 'th_1', type: 'themes', name: 'Dark Theme', description: 'Switch to dark mode theme', price: 500, currency: 'coins', icon: '🌙', rarity: 'epic' },
  { id: 'bt_1', type: 'boosts', name: 'XP Booster', description: 'Get 2x XP for 1 hour', price: 50, currency: 'gems', icon: '⚡', rarity: 'common' },
  { id: 'pr_1', type: 'premium', name: 'Premium Pack', description: 'Unlock all features for 30 days', price: 999, currency: 'gems', icon: '👑', rarity: 'legendary' },
];

/**
 * Hook to manage store state, items and purchases
 */
export const useStore = () => {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading: loadingItems, refetch: refetchItems } = useQuery({
    queryKey: ['store-items'],
    queryFn: async () => {
      try {
        const liveItems = await getStoreItems();
        return liveItems.length > 0 ? liveItems : MOCK_ITEMS;
      } catch (e) {
        return MOCK_ITEMS;
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });

  const { data: ownedItemsIds = [], isLoading: loadingOwned } = useQuery({
    queryKey: ['owned-items'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      try {
        const owned = await getOwnedItems(user.id);
        return owned.map(o => o.item_id);
      } catch (e) {
        return ['av_1']; // Initial mock owned item
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const purchaseMutation = useMutation({
    mutationFn: async (args) => {
      const { item, currentProfile } = args;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return purchaseItem(user.id, item, currentProfile);
    },
    onSuccess: (data) => {
      // Refresh calculations after purchase
      queryClient.setQueryData(['owned-items'], (prev = []) => [...prev, data.inventoryData.item_id]);
      // Update profile cache as well since coins/gems changed
      queryClient.setQueryData(['profile'], (prev) => ({ ...prev, ...data.newBalance }));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    items,
    ownedItemsIds,
    isLoading: loadingItems || loadingOwned,
    purchase: purchaseMutation.mutate,
    isPurchasing: purchaseMutation.isPending,
    refetch: () => {
      refetchItems();
      queryClient.invalidateQueries({ queryKey: ['owned-items'] });
    }
  };
};
